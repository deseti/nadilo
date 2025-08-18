import React, { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { validateMonadGamesIdAddress } from '../lib/addressSync';
import './MonadAddressVerification.css';

interface MonadAddressVerificationProps {
  address: string;
  onVerificationResult: (result: { valid: boolean; hasUsername: boolean; username?: string }) => void;
}

export const MonadAddressVerification: React.FC<MonadAddressVerificationProps> = ({ 
  address, 
  onVerificationResult 
}) => {
  const { user } = usePrivy();
  const [verificationStatus, setVerificationStatus] = useState<{
    loading: boolean;
    verified: boolean;
    hasUsername: boolean;
    username?: string;
    error?: string;
  }>({ loading: false, verified: false, hasUsername: false });

  useEffect(() => {
    if (address && address.startsWith('0x') && address.length === 42) {
      verifyAddress();
    }
  }, [address]);

  const verifyAddress = async () => {
    setVerificationStatus({ loading: true, verified: false, hasUsername: false });

    try {
      const result = await validateMonadGamesIdAddress(address);
      
      setVerificationStatus({
        loading: false,
        verified: result.valid,
        hasUsername: result.hasUsername,
        username: result.username,
        error: result.valid ? undefined : 'Address validation failed'
      });

      onVerificationResult(result);
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationStatus({
        loading: false,
        verified: false,
        hasUsername: false,
        error: 'Failed to verify address'
      });

      onVerificationResult({ valid: false, hasUsername: false });
    }
  };

  const userEmail = user?.email?.address;

  return (
    <div className="monad-address-verification">
      <div className="verification-header">
        <h4>🔍 Monad Games ID Verification</h4>
        <p>Checking address registration status...</p>
      </div>

      <div className="address-display">
        <span className="label">Address:</span>
        <span className="address">{address.slice(0, 10)}...{address.slice(-8)}</span>
      </div>

      {verificationStatus.loading && (
        <div className="verification-status loading">
          <span className="icon">🔄</span>
          <span>Verifying with Monad Games ID...</span>
        </div>
      )}

      {!verificationStatus.loading && verificationStatus.verified && verificationStatus.hasUsername && (
        <div className="verification-status success">
          <span className="icon">✅</span>
          <div className="status-content">
            <strong>Verified & Registered</strong>
            <p>Username: <strong>{verificationStatus.username}</strong></p>
            <p>This address is registered in Monad Games ID and can submit scores to the blockchain.</p>
          </div>
        </div>
      )}

      {!verificationStatus.loading && verificationStatus.verified && !verificationStatus.hasUsername && (
        <div className="verification-status warning">
          <span className="icon">⚠️</span>
          <div className="status-content">
            <strong>Address Valid but Not Registered</strong>
            <p>This address is valid but doesn't have a username in Monad Games ID.</p>
            <p>You can still use it, but you may not be able to submit scores to the blockchain.</p>
          </div>
        </div>
      )}

      {!verificationStatus.loading && !verificationStatus.verified && (
        <div className="verification-status error">
          <span className="icon">❌</span>
          <div className="status-content">
            <strong>Verification Failed</strong>
            <p>{verificationStatus.error || 'Unable to verify this address with Monad Games ID.'}</p>
            <p>Please check the address or try again later.</p>
          </div>
        </div>
      )}

      {!verificationStatus.loading && !verificationStatus.hasUsername && (
        <div className="action-section">
          <h5>📋 Need to register?</h5>
          <p>To submit scores to Monad Games ID blockchain, register with the same email:</p>
          <div className="registration-info">
            <p><strong>Your email:</strong> {userEmail}</p>
            <a 
              href="https://monad-games-id-site.vercel.app/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="register-link"
            >
              🔗 Register at Monad Games ID
            </a>
          </div>
        </div>
      )}

      <div className="retry-section">
        <button 
          onClick={verifyAddress}
          disabled={verificationStatus.loading}
          className="retry-btn"
        >
          {verificationStatus.loading ? '🔄 Verifying...' : '🔄 Re-verify Address'}
        </button>
      </div>
    </div>
  );
};
