// Debug utility to check environment variables
export function debugEnvironmentVariables() {
  console.log('🔧 Environment Variables Debug:');
  
  const envVars = {
    VITE_WALLET_PRIVATE_KEY: import.meta.env.VITE_WALLET_PRIVATE_KEY,
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_PRIVY_APP_ID: import.meta.env.VITE_PRIVY_APP_ID,
    NODE_ENV: import.meta.env.NODE_ENV,
    MODE: import.meta.env.MODE,
    PROD: import.meta.env.PROD,
    DEV: import.meta.env.DEV
  };

  console.table({
    'VITE_WALLET_PRIVATE_KEY': envVars.VITE_WALLET_PRIVATE_KEY ? 
      `${envVars.VITE_WALLET_PRIVATE_KEY.substring(0, 6)}...${envVars.VITE_WALLET_PRIVATE_KEY.substring(-4)}` : 
      'NOT SET',
    'VITE_SUPABASE_URL': envVars.VITE_SUPABASE_URL ? 'SET' : 'NOT SET',
    'VITE_PRIVY_APP_ID': envVars.VITE_PRIVY_APP_ID ? 'SET' : 'NOT SET',
    'NODE_ENV': envVars.NODE_ENV || 'undefined',
    'MODE': envVars.MODE || 'undefined',
    'PROD': envVars.PROD ? 'true' : 'false',
    'DEV': envVars.DEV ? 'true' : 'false'
  });

  // Test wallet creation
  try {
    const { createGameWalletClient } = require('../lib/monadContract');
    const { account } = createGameWalletClient();
    console.log('✅ Game wallet created successfully:', account.address);
    return {
      success: true,
      gameWalletAddress: account.address,
      environmentOk: true
    };
  } catch (error) {
    console.error('❌ Failed to create game wallet:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      environmentOk: false
    };
  }
}

// Function to test score submission
export async function testScoreSubmission(playerAddress: string) {
  console.log('🧪 Testing score submission...');
  
  try {
    const { autoSubmitScore } = await import('../lib/autoScoreSubmit');
    
    const result = await autoSubmitScore(
      playerAddress,
      'Test Player',
      '0x5b84Dc548e45cC4f1498b95C000C748c1c953f64', // Game address
      100, // Test score
      1    // Test transactions
    );
    
    console.log('✅ Score submission test result:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Score submission test failed:', error);
    return false;
  }
}