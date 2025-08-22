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
    console.log('🎯 API /submit-score-minimal called with method:', req.method);
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

    // Simulate successful transaction for now
    const result = await simulateTransaction(playerAddress, score, transactions, privateKey);

    console.log('✅ Score submission successful:', result);

    // Return success response
    return res.status(200).json({
      success: true,
      ...result
    });

  } catch (error: any) {
    console.error('❌ Score submission failed:', error);
    
    // Return error response
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to submit score to blockchain',
    });
  }
}

// Simulate transaction without any external dependencies
async function simulateTransaction(
  playerAddress: string,
  scoreAmount: number,
  transactionAmount: number,
  privateKey: string
) {
  console.log('🔄 Simulating blockchain transaction...');
  
  // Generate a fake transaction hash using built-in methods
  const timestamp = Date.now().toString();
  const data = `${playerAddress}-${scoreAmount}-${transactionAmount}-${timestamp}`;
  
  // Simple hash generation without crypto module
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  const fakeHash = '0x' + Math.abs(hash).toString(16).padStart(64, '0');
  const gameWalletAddress = '0x' + privateKey.slice(2, 42);
  
  console.log('📤 Simulated transaction hash:', fakeHash);
  console.log('🎮 Game wallet address:', gameWalletAddress);

  // Simulate a delay like a real blockchain transaction
  await new Promise(resolve => setTimeout(resolve, 1000));

  return {
    transactionHash: fakeHash,
    gameWalletAddress: gameWalletAddress,
    receipt: {
      status: 'success',
      blockNumber: Math.floor(Math.random() * 1000000),
      gasUsed: '21000'
    }
  };
}