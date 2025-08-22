// Test utility for debugging auto score submission
import { autoSubmitScore } from '../lib/autoScoreSubmit';
import { debugMonadIntegration } from './debugMonadIntegration';

export async function testAutoSubmit(playerAddress: string) {
  console.log('🧪 Testing auto score submission...');
  
  try {
    // 1. Debug Monad integration first
    console.log('1. Debugging Monad integration...');
    const debugResult = await debugMonadIntegration(
      playerAddress, 
      '0x5b84Dc548e45cC4f1498b95C000C748c1c953f64' // Game address
    );
    
    console.log('Debug result:', debugResult);
    
    if (!debugResult.canSubmit) {
      console.warn('⚠️ Cannot submit to blockchain:', {
        hasGameRole: debugResult.hasGameRole,
        gameRegistered: debugResult.gameRegistered,
        gameWalletAddress: debugResult.gameWalletAddress
      });
      return false;
    }
    
    // 2. Test score submission
    console.log('2. Testing score submission...');
    const testScore = 1000;
    const testTransactions = 1;
    
    const result = await autoSubmitScore(
      playerAddress,
      'Test Player',
      '0x5b84Dc548e45cC4f1498b95C000C748c1c953f64',
      testScore,
      testTransactions
    );
    
    console.log('✅ Auto submit test result:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Auto submit test failed:', error);
    return false;
  }
}

// Function to test just the blockchain submission part
export async function testBlockchainSubmission(playerAddress: string) {
  console.log('🔗 Testing blockchain submission only...');
  
  try {
    const { updatePlayerDataWithGameWallet } = await import('../lib/monadContract');
    
    const result = await updatePlayerDataWithGameWallet(
      playerAddress,
      500, // Test score
      1    // Test transactions
    );
    
    console.log('✅ Blockchain submission test result:', result);
    return result.success;
    
  } catch (error) {
    console.error('❌ Blockchain submission test failed:', error);
    return false;
  }
}

// Function to test environment variables
export function testEnvironmentVariables() {
  console.log('🔧 Testing environment variables...');
  
  const privateKey = import.meta.env.VITE_WALLET_PRIVATE_KEY;
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const privyAppId = import.meta.env.VITE_PRIVY_APP_ID;
  
  console.log('Environment check:', {
    hasPrivateKey: !!privateKey,
    privateKeyFormat: privateKey ? (privateKey.startsWith('0x') ? 'Valid' : 'Invalid - missing 0x') : 'Missing',
    hasSupabaseUrl: !!supabaseUrl,
    hasPrivyAppId: !!privyAppId
  });
  
  return {
    hasPrivateKey: !!privateKey,
    validPrivateKeyFormat: privateKey ? privateKey.startsWith('0x') : false,
    hasSupabaseUrl: !!supabaseUrl,
    hasPrivyAppId: !!privyAppId
  };
}