import { supabase } from './supabase';

export interface AddressSyncData {
  email: string;
  nadiloAddress: string;
  monadGamesIdAddress?: string;
  lastSyncAt: string;
  syncStatus: 'pending' | 'synced' | 'failed';
}

/**
 * Sync address dengan Monad Games ID
 */
export async function syncWithMonadGamesId(email: string, nadiloAddress: string): Promise<{
  success: boolean;
  monadAddress?: string;
  message: string;
}> {
  try {
    console.log('🔄 Syncing address with Monad Games ID for:', email);
    
    // 1. Cek apakah email sudah terdaftar di Monad Games ID
    const response = await fetch(`https://monad-games-id-site.vercel.app/api/check-email?email=${encodeURIComponent(email)}`);
    const data = await response.json();
    
    if (data.found && data.walletAddress) {
      console.log('✅ Found Monad Games ID address:', data.walletAddress);
      
      // 2. Simpan mapping ke database lokal
      await saveAddressMapping(email, nadiloAddress, data.walletAddress);
      
      return {
        success: true,
        monadAddress: data.walletAddress,
        message: 'Successfully synced with Monad Games ID address'
      };
    } else {
      console.log('⚠️ Email not found in Monad Games ID');
      
      // Simpan status bahwa email belum terdaftar
      await saveAddressMapping(email, nadiloAddress, null);
      
      return {
        success: false,
        message: 'Email not registered in Monad Games ID. Please register first at https://monad-games-id-site.vercel.app/'
      };
    }
  } catch (error) {
    console.error('❌ Error syncing with Monad Games ID:', error);
    return {
      success: false,
      message: 'Failed to sync with Monad Games ID. Please try again later.'
    };
  }
}

/**
 * Simpan mapping address ke database
 */
async function saveAddressMapping(email: string, nadiloAddress: string, monadAddress: string | null) {
  try {
    const syncData: Partial<AddressSyncData> = {
      email,
      nadiloAddress,
      monadGamesIdAddress: monadAddress || undefined,
      lastSyncAt: new Date().toISOString(),
      syncStatus: monadAddress ? 'synced' : 'failed'
    };

    const { error } = await supabase
      .from('address_sync')
      .upsert(syncData, { onConflict: 'email' });

    if (error) {
      console.error('Error saving address mapping:', error);
    } else {
      console.log('✅ Address mapping saved to database');
    }
  } catch (error) {
    console.error('Error in saveAddressMapping:', error);
  }
}

/**
 * Get saved address mapping dari database
 */
export async function getSavedAddressMapping(email: string): Promise<AddressSyncData | null> {
  try {
    const { data, error } = await supabase
      .from('address_sync')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No data found
        return null;
      }
      throw error;
    }

    return data as AddressSyncData;
  } catch (error) {
    console.error('Error getting saved address mapping:', error);
    return null;
  }
}

/**
 * Check apakah address valid untuk Monad Games ID
 */
export async function validateMonadGamesIdAddress(address: string): Promise<{
  valid: boolean;
  hasUsername: boolean;
  username?: string;
}> {
  try {
    const response = await fetch(`https://monad-games-id-site.vercel.app/api/check-wallet?wallet=${address}`);
    const data = await response.json();
    
    return {
      valid: true,
      hasUsername: data.hasUsername,
      username: data.user?.username
    };
  } catch (error) {
    console.error('Error validating Monad Games ID address:', error);
    return {
      valid: false,
      hasUsername: false
    };
  }
}

/**
 * Manual sync - untuk kasus dimana user sudah punya address di kedua platform
 */
export async function manualAddressSync(email: string, nadiloAddress: string, monadAddress: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    // Validate kedua address
    const monadValidation = await validateMonadGamesIdAddress(monadAddress);
    
    if (!monadValidation.valid) {
      return {
        success: false,
        message: 'Invalid Monad Games ID address'
      };
    }

    if (!monadValidation.hasUsername) {
      return {
        success: false,
        message: 'This address is not registered in Monad Games ID'
      };
    }

    // Save mapping
    await saveAddressMapping(email, nadiloAddress, monadAddress);
    
    return {
      success: true,
      message: `Successfully linked with Monad Games ID address (${monadValidation.username})`
    };
  } catch (error) {
    console.error('Error in manual address sync:', error);
    return {
      success: false,
      message: 'Failed to sync addresses. Please try again.'
    };
  }
}
