import React from 'react';
import { usePrivy } from '@privy-io/react-auth';
import './WalletConnection.css';

export const WalletConnection: React.FC = () => {
  const { user, linkWallet, unlinkWallet } = usePrivy();

  const hasWallet = user?.wallet?.address;

  if (hasWallet && user?.wallet?.address) {
    return (
      <div className="wallet-connection">
        <div className="wallet-info">
          <span className="wallet-icon">💼</span>
          <div>
            <p>Wallet Connected</p>
            <p className="wallet-address">
              {user.wallet.address.slice(0, 6)}...{user.wallet.address.slice(-4)}
            </p>
          </div>
        </div>
        <button 
          onClick={() => user?.wallet?.address && unlinkWallet(user.wallet.address)}
          className="disconnect-btn"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="wallet-connection">
      <div className="wallet-prompt">
        <span className="wallet-icon">💼</span>
        <div>
          <p>Connect Wallet for Blockchain Features</p>
          <p className="wallet-description">
            Link a wallet to submit scores to Monad blockchain
          </p>
        </div>
      </div>
      <button onClick={linkWallet} className="connect-btn">
        Connect Wallet
      </button>
    </div>
  );
};
