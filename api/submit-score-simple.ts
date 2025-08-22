// Import necessary types from Vercel and functions from viem
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createPublicClient, createWalletClient, http, encodeFunctionData, parseGwei } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

// --- Helper function for blockchain interaction ---
// This function contains all the logic to connect to Monad and send the transaction.
async function submitScoreToBlockchain(
  playerAddress: string,
  scoreAmount: number,
  transactionAmount: number,
  privateKey: string
) {
  // Define Monad Testnet configuration
  const monadTestnet = {
    id: 10143,
    name: 'Monad Testnet',
    nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
    rpcUrls: {
      default: { http: ['https://testnet-rpc.monad.xyz'] },
      public: { http: ['https://testnet-rpc.monad.xyz'] },
    },
    blockExplorers: {
      default: { name: 'Monad Explorer', url: 'https://testnet.monadexplorer.com' },
    },
    testnet: true,
  };

  // Define contract address and the minimal ABI needed
  const MONAD_LEADERBOARD_CONTRACT_ADDRESS = '0xceCBFF203C8B6044F52CE23D914A1bfD997541A4';
  const MINIMAL_ABI = [
    {
      inputs: [
        { internalType: 'address', name: 'player', type: 'address' },
        { internalType: 'uint256', name: 'scoreAmount', type: 'uint256' },
        { internalType: 'uint256', name: 'transactionAmount', type: 'uint256' },
      ],
      name: 'updatePlayerData',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
  ];

  // 1. Create wallet account from the private key
  const account = privateKeyToAccount(privateKey as `0x${string}`);
  console.log('🔑 Game wallet address:', account.address);

  // 2. Create Public and Wallet clients for interacting with the blockchain
  const publicClient = createPublicClient({
    chain: monadTestnet,
    transport: http(),
  });

  const walletClient = createWalletClient({
    account,
    chain: monadTestnet,
    transport: http(),
  });

  // 3. Prepare the transaction data
  console.log('📝 Encoding transaction data...');
  const data = encodeFunctionData({
    abi: MINIMAL_ABI,
    functionName: 'updatePlayerData',
    args: [playerAddress, BigInt(scoreAmount), BigInt(transactionAmount)],
  });

  // 4. Get necessary network details (nonce and gas price)
  const [gasPrice, nonce] = await Promise.all([
    publicClient.getGasPrice(),
    publicClient.getTransactionCount({ address: account.address }),
  ]);
  console.log(`⛽ Gas price: ${gasPrice}, Nonce: ${nonce}`);

  // 5. Send the transaction
  console.log('📤 Sending transaction...');
  const hash = await walletClient.sendTransaction({
    to: MONAD_LEADERBOARD_CONTRACT_ADDRESS,
    data,
    gas: BigInt(300000), // A safe gas limit for this transaction
    gasPrice: gasPrice, // Use the fetched gas price
    nonce: nonce,
    value: BigInt(0),
  });
  console.log('📤 Transaction sent with hash:', hash);

  // 6. Wait for the transaction to be confirmed
  console.log('⏳ Waiting for transaction confirmation...');
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log('✅ Transaction confirmed:', receipt);

  return {
    transactionHash: hash,
    receipt,
    gameWalletAddress: account.address,
  };
}


// --- Main API Handler ---
// This is the main function that Vercel will run.
export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  // Set CORS headers to allow requests from any origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Ensure the request is a POST request
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Only POST requests are accepted.',
    });
  }

  try {
    // 1. Extract and validate data from the request body
    const { playerAddress, score, transactions } = req.body;
    if (!playerAddress || typeof score !== 'number' || typeof transactions !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'Invalid input: playerAddress, score, and transactions are required.',
      });
    }

    // 2. Securely get the private key from Vercel's environment variables
    const privateKey = process.env.WALLET_PRIVATE_KEY;
    if (!privateKey) {
      console.error('❌ Server configuration error: WALLET_PRIVATE_KEY is not set.');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error: Wallet credentials are not set.',
      });
    }

    // 3. Call the blockchain interaction function
    console.log(`🚀 Processing score submission for ${playerAddress}...`);
    const result = await submitScoreToBlockchain(
      playerAddress,
      score,
      transactions,
      privateKey
    );

    // 4. Return a successful response
    console.log(`✅ Successfully submitted score for ${playerAddress}. Tx: ${result.transactionHash}`);
    return res.status(200).json({
      success: true,
      transactionHash: result.transactionHash,
    });

  } catch (error: any) {
    // 5. Catch any errors and return a formatted error response
    console.error('❌ API Error in handler:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'An internal server error occurred.',
    });
  }
}
