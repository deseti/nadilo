import React, { useState, useEffect } from 'react';
import './AddressEditor.css';

interface AddressEditorProps {
  userEmail: string;
  currentAddress: string;
  onAddressChange: (newAddress: string) => void;
  isMonadGamesConnected: boolean;
}

export const AddressEditor: React.FC<AddressEditorProps> = ({
  userEmail,
  currentAddress,
  onAddressChange,
  isMonadGamesConnected
}) => {
  const [customAddress, setCustomAddress] = useState('');
  const [useCustomAddress, setUseCustomAddress] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // Check if user has previously set a custom address
    const savedCustomAddress = localStorage.getItem(`custom_address_${userEmail}`);
    const useCustom = localStorage.getItem(`use_custom_address_${userEmail}`) === 'true';
    
    if (savedCustomAddress && useCustom) {
      setCustomAddress(savedCustomAddress);
      setUseCustomAddress(true);
      onAddressChange(savedCustomAddress);
    }
  }, [userEmail, onAddressChange]);

  const validateAddress = (address: string): boolean => {
    if (!address) return false;
    if (!address.startsWith('0x')) return false;
    if (address.length !== 42) return false;
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) return false;
    return true;
  };

  const handleAddressSubmit = async () => {
    if (!customAddress.trim()) {
      setValidationError('Please enter an address');
      return;
    }

    if (!validateAddress(customAddress)) {
      setValidationError('Invalid address format. Must be 42 characters starting with 0x');
      return;
    }

    setIsValidating(true);
    setValidationError('');

    try {
      // Optional: Check if address exists in Monad Games ID
      const response = await fetch(`https://monad-games-id-site.vercel.app/api/check-wallet?wallet=${customAddress}`);
      const data = await response.json();
      
      if (!data.hasUsername) {
        setValidationError('⚠️ This address is not registered in Monad Games ID. You can still use it, but you may not be able to submit scores to the blockchain.');
      }

      // Save to localStorage and apply the address
      localStorage.setItem(`custom_address_${userEmail}`, customAddress);
      localStorage.setItem(`use_custom_address_${userEmail}`, 'true');
      setUseCustomAddress(true);
      onAddressChange(customAddress);
      setIsEditing(false);
      
      console.log('✅ Custom address set:', customAddress);
    } catch (error) {
      console.warn('Could not verify address with Monad Games ID:', error);
      // Still allow the user to use the address
      localStorage.setItem(`custom_address_${userEmail}`, customAddress);
      localStorage.setItem(`use_custom_address_${userEmail}`, 'true');
      setUseCustomAddress(true);
      onAddressChange(customAddress);
      setIsEditing(false);
    } finally {
      setIsValidating(false);
    }
  };

  const handleUseDefaultAddress = () => {
    localStorage.removeItem(`custom_address_${userEmail}`);
    localStorage.setItem(`use_custom_address_${userEmail}`, 'false');
    setUseCustomAddress(false);
    setCustomAddress('');
    setValidationError('');
    onAddressChange(currentAddress);
    setIsEditing(false);
  };

  const effectiveAddress = useCustomAddress ? customAddress : currentAddress;

  return (
    <div className="address-editor">
      <div className="address-editor-header">
        <h3>🔧 Wallet Address Settings</h3>
        <p>Customize your wallet address to match your Monad Games ID account</p>
      </div>

      <div className="current-address-section">
        <div className="address-info">
          <div className="address-type">
            <span className="label">
              {useCustomAddress ? '🎯 Active Address (Custom):' : '🤖 Active Address (Auto-Generated):'}
            </span>
            <span className="address">{effectiveAddress.slice(0, 8)}...{effectiveAddress.slice(-6)}</span>
            <button 
              className="edit-btn"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? '❌ Cancel' : '✏️ Edit'}
            </button>
          </div>
          
          {useCustomAddress && (
            <div className="custom-indicator">
              <span className="icon">✅</span>
              <span>Using custom address</span>
            </div>
          )}
        </div>

        {!isEditing && (
          <div className="address-actions">
            <div className="info-text">
              <p>📧 Email: <strong>{userEmail}</strong></p>
              <p>
                {useCustomAddress 
                  ? '✅ You are using a custom address that should match your Monad Games ID account'
                  : '⚠️ You are using the auto-generated address. Consider setting a custom address to match your Monad Games ID account'
                }
              </p>
            </div>
          </div>
        )}
      </div>

      {isEditing && (
        <div className="address-edit-form">
          <div className="form-section">
            <h4>🎯 Set Custom Address</h4>
            <p>Enter the wallet address from your Monad Games ID account to ensure score synchronization.</p>
            
            <div className="input-group">
              <label htmlFor="custom-address">Custom Wallet Address:</label>
              <input
                id="custom-address"
                type="text"
                value={customAddress}
                onChange={(e) => {
                  setCustomAddress(e.target.value);
                  setValidationError('');
                }}
                placeholder="0x..."
                className={`address-input ${validationError ? 'error' : ''}`}
              />
              
              {validationError && (
                <div className="error-message">
                  <span className="icon">❌</span>
                  <span>{validationError}</span>
                </div>
              )}
            </div>

            <div className="form-actions">
              <button
                onClick={handleAddressSubmit}
                disabled={isValidating || !customAddress.trim()}
                className="save-btn"
              >
                {isValidating ? '🔄 Validating...' : '💾 Save Custom Address'}
              </button>
              
              {useCustomAddress && (
                <button
                  onClick={handleUseDefaultAddress}
                  className="reset-btn"
                >
                  🔄 Use Auto-Generated Address
                </button>
              )}
            </div>
          </div>

          <div className="help-section">
            <h5>📋 How to get your Monad Games ID address:</h5>
            <ol>
              <li>Visit <a href="https://monad-games-id-site.vercel.app/" target="_blank" rel="noopener noreferrer">Monad Games ID</a></li>
              <li>Sign in with the same email: <strong>{userEmail}</strong></li>
              <li>Copy your wallet address from your profile/dashboard</li>
              <li>Paste it above and click "Save Custom Address"</li>
            </ol>
            
            <div className="warning-box">
              <h6>⚠️ Important:</h6>
              <ul>
                <li>Use the EXACT address from your Monad Games ID account</li>
                <li>Make sure both accounts use the same email: <strong>{userEmail}</strong></li>
                <li>This ensures your scores sync properly across platforms</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="status-indicators">
        <div className={`status-item ${useCustomAddress ? 'success' : 'info'}`}>
          <span className="icon">{useCustomAddress ? '🎯' : '🤖'}</span>
          <span>{useCustomAddress ? 'Custom Address Active' : 'Auto-Generated Address Active'}</span>
        </div>
      </div>
    </div>
  );
};
