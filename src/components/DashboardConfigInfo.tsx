import React from 'react';
import './DashboardConfigInfo.css';

export const DashboardConfigInfo: React.FC = () => {
  return (
    <div className="dashboard-config-info">
      <h3>🔧 Dashboard Configuration Required</h3>
      <p>To enable Monad Games ID integration, you need to configure cross-app authentication in your Privy Dashboard:</p>
      
      <div className="config-steps">
        <div className="step">
          <span className="step-number">1</span>
          <div className="step-content">
            <strong>Login to Privy Dashboard</strong>
            <p>Visit <a href="https://dashboard.privy.io" target="_blank" rel="noopener noreferrer">dashboard.privy.io</a> and select your Renaz app</p>
          </div>
        </div>
        
        <div className="step">
          <span className="step-number">2</span>
          <div className="step-content">
            <strong>Find Cross-app Settings</strong>
            <p>Look for "Login Methods", "Cross-app", or "External Apps" in the sidebar</p>
          </div>
        </div>
        
        <div className="step">
          <span className="step-number">3</span>
          <div className="step-content">
            <strong>Add Monad Games ID Provider</strong>
            <div className="code-block">
              <p>Provider App ID: <code>cmd8euall0037le0my79qpz42</code></p>
            </div>
          </div>
        </div>
        
        <div className="step">
          <span className="step-number">4</span>
          <div className="step-content">
            <strong>Enable Cross-app Authentication</strong>
            <p>Enable or activate the cross-app connection for Monad Games ID</p>
          </div>
        </div>
      </div>
      
      <div className="info-note">
        <p><strong>Note:</strong> After configuration, users who login with the same email on both Monad Games ID and your app will automatically get their Monad Games ID wallet address linked.</p>
      </div>
      
      <div className="debug-info">
        <h4>Current Status:</h4>
        <p>Cross-app integration: <span className="status-error">❌ Not configured</span></p>
        <p>Expected wallet sharing: <span className="status-error">❌ Not working</span></p>
      </div>
    </div>
  );
};
