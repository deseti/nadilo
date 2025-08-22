import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Only POST requests are accepted.' 
    });
  }

  try {
    console.log('🎯 API /submit-score-simple called with method:', req.method);
    console.log('📥 Request body:', req.body);
    
    // Extract data from request body
    const { playerAddress, score, transactions } = req.body;

    console.log('📊 Extracted data:', { playerAddress, score, transactions });

    // Validate required fields
    if (!playerAddress || typeof score !== 'number' || typeof transactions !== 'number') {
      console.log('❌ Validation failed:', { playerAddress, score, transactions });
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid required fields: playerAddress, score, transactions'
      });
    }

    // Validate playerAddress format
    if (!playerAddress.startsWith('0x') || playerAddress.length !== 42) {
      return res.status(400).json({
        success: false,
        error: 'Invalid player address format'
      });
    }

    // Check if private key exists in environment variables
    const privateKey = process.env.WALLET_PRIVATE_KEY;
    console.log('🔑 Environment check:', {
      hasWalletKey: !!privateKey,
      keyLength: privateKey ? privateKey.length : 0,
      keyPrefix: privateKey ? privateKey.substring(0, 4) + '...' : 'none'
    });
    
    if (!privateKey) {
      console.error('❌ WALLET_PRIVATE_KEY not found in environment variables');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error: Missing wallet credentials'
      });
    }

    console.log('🎮 Processing score submission:', {
      playerAddress,
      score,
      transactions,
      timestamp: new Date().toISOString()
    });

    // Use direct blockchain interaction without complex imports
    const result = await submitScoreDirectly(playerAddress, score, transactions, privateKey);

    console.log('✅ Score submission successful:', result);

    // Return success response
    return res.status(200).json({
      success: true,
      ...result
    });

  } catch (error: any) {
    console.error('❌ Score submission failed:', error);
    
    // Log detailed error information
    if (error?.cause) {
      console.error('Error cause:', error.cause);
    }
    if (error?.details) {
      console.error('Error details:', error.details);
    }

    // Return error response
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to submit score to blockchain',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

// Direct blockchain interaction function
async function submitScoreDirectly(
  playerAddress: string,
  scoreAmount: number,
  transactionAmount: number,
  privateKey: string
) {
  // Import viem dynamically to avoid ES module issues
  const { createPublicClient, createWalletClient, http, encodeFunctionData } = await import('viem');
  const { privateKeyToAccount } = await import('viem/accounts');

  const MONAD_LEADERBOARD_CONTRACT_ADDRESS = '0xceCBFF203C8B6044F52CE23D914A1bfD997541A4';
  
  // Minimal ABI for updatePlayerData function only
  const MINIMAL_ABI = [
    {
      "inputs": [
        {"internalType": "address", "name": "player", "type": "address"},
        {"internalType": "uint256", "name": "scoreAmount", "type": "uint256"},
        {"internalType": "uint256", "name": "transactionAmount", "type": "uint256"}
      ],
      "name": "updatePlayerData",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ];

  // Chain config
  const monadTestnet = {
    id: 10143,
    name: 'Monad Testnet',
    nativeCurrency: {
      decimals: 18,
      name: 'MON',
      symbol: 'MON',
    },
    rpcUrls: {
      default: {
        http: ['https://testnet-rpc.monad.xyz'],
      },
    },
  };

  try {
    console.log('🔄 Creating clients...');

    // Create account from private key
    const account = privateKeyToAccount(privateKey as `0x${string}`);
    console.log('🔑 Game wallet address:', account.address);

    // Create clients
    const publicClient = createPublicClient({
      chain: monadTestnet,
      transport: http(),
    });

    const walletClient = createWalletClient({
      account,
      chain: monadTestnet,
      transport: http(),
    });

    // Encode function data
    const data = encodeFunctionData({
      abi: MINIMAL_ABI,
      functionName: 'updatePlayerData',
      args: [playerAddress, BigInt(scoreAmount), BigInt(transactionAmount)],
    });

    console.log('📝 Encoded function data:', data);

    // Get current gas price and nonce
    const gasPrice = await publicClient.getGasPrice();
    const nonce = await publicClient.getTransactionCount({ address: account.address });

    console.log('⛽ Gas price:', gasPrice, 'Nonce:', nonce);

    // Create transaction
    const transaction = {
      to: MONAD_LEADERBOARD_CONTRACT_ADDRESS as `0x${string}`,
      data,
      gas: 300000n,
      gasPrice: gasPrice * 2n,
      nonce,
      value: 0n,
    };

    console.log('📤 Sending transaction:', transaction);

    // Send transaction
    const hash = await walletClient.sendTransaction(transaction);
    console.log('📤 Transaction sent:', hash);

    // Wait for confirmation
    console.log('⏳ Waiting for confirmation...');
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log('✅ Transaction confirmed:', receipt);

    return {
      transactionHash: hash,
      receipt,
      gameWalletAddress: account.address
    };

  } catch (error) {
    console.error('❌ Direct submission failed:', error);
    throw error;
  }
}