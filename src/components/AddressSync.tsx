import React, { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { syncWithMonadGamesId, getSavedAddressMapping, manualAddressSync, AddressSyncData } from '../lib/addressSync';
import './AddressSync.css';

interface AddressSyncProps {
  currentAddress: string;
  onAddressSync: (monadAddress: string) => void;
}

export const AddressSync: React.FC<AddressSyncProps> = ({ currentAddress, onAddressSync }) => {
  const { user } = usePrivy();
  const [syncData, setSyncData] = useState<AddressSyncData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [manualAddress, setManualAddress] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');

  const userEmail = user?.email?.address;

  useEffect(() => {
    if (userEmail) {
      loadSavedMapping();
    }
  }, [userEmail]);

  const loadSavedMapping = async () => {
    if (!userEmail) return;
    
    try {
      const saved = await getSavedAddressMapping(userEmail);
      setSyncData(saved);
    } catch (error) {
      console.error('Error loading saved mapping:', error);
    }
  };

  const handleAutoSync = async () => {
    if (!userEmail) {
      showMessage('Please login first', 'error');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const result = await syncWithMonadGamesId(userEmail, currentAddress);
      
      if (result.success && result.monadAddress) {
        showMessage(result.message, 'success');
        onAddressSync(result.monadAddress);
        await loadSavedMapping();
      } else {
        showMessage(result.message, 'error');
      }
    } catch (error) {
      showMessage('Failed to sync with Monad Games ID', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSync = async () => {
    if (!userEmail) {
      showMessage('Please login first', 'error');
      return;
    }

    if (!manualAddress.trim()) {
      showMessage('Please enter a valid address', 'error');
      return;
    }

    if (!manualAddress.startsWith('0x') || manualAddress.length !== 42) {
      showMessage('Invalid address format', 'error');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const result = await manualAddressSync(userEmail, currentAddress, manualAddress);
      
      if (result.success) {
        showMessage(result.message, 'success');
        onAddressSync(manualAddress);
        setShowManualInput(false);
        setManualAddress('');
        await loadSavedMapping();
      } else {
        showMessage(result.message, 'error');
      }
    } catch (error) {
      showMessage('Failed to sync addresses', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const showMessage = (msg: string, type: 'success' | 'error' | 'info') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  const validateAddress = (address: string): boolean => {
    return address.startsWith('0x') && address.length === 42 && /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  return (
    <div className="address-sync">
      <div className="address-sync-header">
        <h3>🔗 Address Synchronization</h3>
        <p>Sync your wallet address with Monad Games ID for seamless integration</p>
      </div>

      {/* Current Status */}
      <div className="sync-status">
        <div className="status-item">
          <span className="label">Current App Address:</span>
          <span className="address">{currentAddress.slice(0, 8)}...{currentAddress.slice(-6)}</span>
        </div>
        
        {syncData?.monadGamesIdAddress && (
          <div className="status-item synced">
            <span className="label">Monad Games ID Address:</span>
            <span className="address">{syncData.monadGamesIdAddress.slice(0, 8)}...{syncData.monadGamesIdAddress.slice(-6)}</span>
            <span className="sync-indicator">✅ Synced</span>
          </div>
        )}
        
        {syncData && (
          <div className="sync-info">
            <small>Last sync: {new Date(syncData.lastSyncAt).toLocaleString()}</small>
            <small>Status: {syncData.syncStatus}</small>
          </div>
        )}
      </div>

      {/* Message Display */}
      {message && (
        <div className={`message ${messageType}`}>
          <span className="icon">
            {messageType === 'success' ? '✅' : messageType === 'error' ? '❌' : 'ℹ️'}
          </span>
          <span>{message}</span>
        </div>
      )}

      {/* Sync Actions */}
      <div className="sync-actions">
        {!syncData?.monadGamesIdAddress && (
          <>
            <button 
              onClick={handleAutoSync}
              disabled={isLoading || !userEmail}
              className="sync-btn primary"
            >
              {isLoading ? '🔄 Syncing...' : '🔍 Auto-Sync with Monad Games ID'}
            </button>

            <button 
              onClick={() => setShowManualInput(!showManualInput)}
              className="sync-btn secondary"
            >
              📝 Manual Address Input
            </button>
          </>
        )}

        {syncData?.monadGamesIdAddress && (
          <button 
            onClick={handleAutoSync}
            disabled={isLoading}
            className="sync-btn secondary"
          >
            {isLoading ? '🔄 Re-syncing...' : '🔄 Re-sync with Monad Games ID'}
          </button>
        )}
      </div>

      {/* Manual Input Section */}
      {showManualInput && (
        <div className="manual-input-section">
          <h4>📝 Manual Address Input</h4>
          <p>If you know your Monad Games ID wallet address, enter it below:</p>
          
          <div className="input-group">
            <label htmlFor="manual-address">Monad Games ID Address:</label>
            <input
              id="manual-address"
              type="text"
              value={manualAddress}
              onChange={(e) => setManualAddress(e.target.value)}
              placeholder="0x..."
              className={`address-input ${manualAddress && !validateAddress(manualAddress) ? 'error' : ''}`}
            />
            {manualAddress && !validateAddress(manualAddress) && (
              <small className="error-text">Invalid address format</small>
            )}
          </div>

          <div className="manual-actions">
            <button 
              onClick={handleManualSync}
              disabled={isLoading || !validateAddress(manualAddress)}
              className="sync-btn primary"
            >
              {isLoading ? '🔄 Syncing...' : '💾 Link Addresses'}
            </button>
            
            <button 
              onClick={() => {
                setShowManualInput(false);
                setManualAddress('');
              }}
              className="sync-btn secondary"
            >
              ❌ Cancel
            </button>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="help-section">
        <h5>❓ How Address Sync Works:</h5>
        <ul>
          <li><strong>Auto-Sync:</strong> Automatically finds your Monad Games ID address using your email</li>
          <li><strong>Manual Input:</strong> Enter your known Monad Games ID address manually</li>
          <li><strong>Cross-Platform:</strong> Once synced, scores will use the correct address for blockchain submissions</li>
        </ul>
        
        <div className="help-links">
          <p>
            Don't have a Monad Games ID account? 
            <a href="https://monad-games-id-site.vercel.app/" target="_blank" rel="noopener noreferrer">
              Register here with the same email: <strong>{userEmail}</strong>
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
