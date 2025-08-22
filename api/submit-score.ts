import type { VercelRequest, VercelResponse } from '@vercel/node';

// Import the blockchain functions - try different import approaches
let updatePlayerDataWithGameWallet: any;

try {
  const monadContract = require('../src/lib/monadContract');
  updatePlayerDataWithGameWallet = monadContract.updatePlayerDataWithGameWallet;
} catch (importError) {
  console.error('❌ Failed to import monadContract:', importError);
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Only POST requests are accepted.' 
    });
  }

  try {
    // Extract data from request body
    const { playerAddress, score, transactions } = req.body;

    // Validate required fields
    if (!playerAddress || typeof score !== 'number' || typeof transactions !== 'number') {
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

    // Check if the function was imported successfully
    if (!updatePlayerDataWithGameWallet) {
      console.error('❌ updatePlayerDataWithGameWallet function not available');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error: Blockchain function not available'
      });
    }

    // Check if private key exists in environment variables
    const privateKey = process.env.WALLET_PRIVATE_KEY;
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

    // Temporarily set the environment variable for the blockchain function
    // This is needed because the monadContract.ts still expects VITE_WALLET_PRIVATE_KEY
    process.env.VITE_WALLET_PRIVATE_KEY = privateKey;

    // Call the blockchain function
    const result = await updatePlayerDataWithGameWallet(
      playerAddress,
      score,
      transactions
    );

    console.log('✅ Score submission successful:', {
      transactionHash: result.transactionHash,
      gameWalletAddress: result.gameWalletAddress
    });

    // Return success response
    return res.status(200).json({
      success: true,
      transactionHash: result.transactionHash,
      gameWalletAddress: result.gameWalletAddress,
      receipt: result.receipt
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