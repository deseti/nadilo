// Monad Games ID Setup Guide
// Instructions for properly integrating with Monad Games ID

export interface SetupStep {
  step: number;
  title: string;
  description: string;
  completed: boolean;
  action?: () => void;
  required: boolean;
}

export class MonadGamesIDSetup {
  /**
   * Get setup steps for integrating with Monad Games ID
   */
  static getSetupSteps(
    gameAddress: string,
    playerAddress: string,
    gameRegistered: boolean,
    hasGameRole: boolean
  ): SetupStep[] {
    return [
      {
        step: 1,
        title: "Connect to Monad Testnet",
        description: "Ensure your wallet is connected to Monad Testnet (Chain ID: 10143)",
        completed: true, // Assume completed if we can check other things
        required: true,
      },
      {
        step: 2,
        title: "Get MON Tokens",
        description: "Get MON testnet tokens for gas fees from Monad faucet",
        completed: true, // We'll assume user has some tokens
        required: true,
      },
      {
        step: 3,
        title: "Register Game",
        description: "Register your game in the Monad Games ID contract",
        completed: gameRegistered,
        required: true,
      },
      {
        step: 4,
        title: "Get GAME_ROLE Permission",
        description: "Request GAME_ROLE permission from Monad team for your wallet/contract",
        completed: hasGameRole,
        required: true,
      },
      {
        step: 5,
        title: "Submit Scores",
        description: "Submit player scores to Monad Games ID blockchain",
        completed: false,
        required: false,
      },
    ];
  }

  /**
   * Generate instructions for getting GAME_ROLE
   */
  static getGameRoleInstructions(playerAddress: string, gameAddress: string): string {
    return `
🎮 HOW TO GET GAME_ROLE PERMISSION FOR MONAD GAMES ID

To submit scores to Monad Games ID blockchain, you need GAME_ROLE permission.

📧 CONTACT MONAD TEAM:
   • Email: development@monad.xyz
   • Subject: "GAME_ROLE Request for ${gameAddress.slice(0, 8)}..."
   • Discord: Join Monad Discord for faster response
   • Documentation: Check Monad Games ID official docs

📋 INFORMATION TO PROVIDE:
   • Developer wallet: ${playerAddress}
   • Game contract: ${gameAddress}
   • Game name: "Nadilo - Crypto Clash"
   • Game type: Token collection arena game
   • Live demo: ${window.location.origin}
   • Repository: (if public)

📄 EMAIL TEMPLATE:
   Subject: GAME_ROLE Request for Nadilo Game Integration

   Hello Monad Team,

   I'm developing "Nadilo - Crypto Clash" and would like to integrate with Monad Games ID.

   Game Details:
   - Name: Nadilo - Crypto Clash
   - Type: Token collection arena game
   - Demo: ${window.location.origin}
   - Contract: ${gameAddress}
   - Developer: ${playerAddress}

   Please grant GAME_ROLE permission to submit player scores to your leaderboard.

   Thank you!

⏳ EXPECTED PROCESS:
   1. Submit request with all required info
   2. Monad team reviews (usually 1-3 business days)
   3. GAME_ROLE granted to your wallet
   4. You can submit scores to blockchain

🔧 ALTERNATIVE SOLUTIONS:
   • Deploy a smart contract with GAME_ROLE
   • Use an authorized proxy contract
   • Implement gasless meta-transactions

💡 TIPS:
   • Have a working demo ready
   • Show genuine game development
   • Join Monad community for better support
    `.trim();
  }

  /**
   * Contract addresses and important info
   */
  static getContractInfo() {
    return {
      leaderboardContract: '0xceCBFF203C8B6044F52CE23D914A1bfD997541A4',
      network: 'Monad Testnet',
      chainId: 10143,
      rpcUrl: 'https://testnet-rpc.monad.xyz',
      explorer: 'https://testnet.monadexplorer.com',
      faucet: 'https://faucet.monad.xyz',
      docs: 'https://docs.monad.xyz',
      discord: 'https://discord.gg/monad',
      supportEmail: 'development@monad.xyz',
      gamesIdDocs: 'https://monad-foundation.notion.site/How-to-integrate-Monad-Games-ID-24e6367594f2802b8dd1ef3fbf3d136a',
    };
  }

  /**
   * Check if all requirements are met
   */
  static canSubmitScores(gameRegistered: boolean, hasGameRole: boolean): boolean {
    return gameRegistered && hasGameRole;
  }

  /**
   * Get next required action
   */
  static getNextAction(gameRegistered: boolean, hasGameRole: boolean): string {
    if (!gameRegistered) {
      return "Register your game first using the 'Register Game' button";
    }
    if (!hasGameRole) {
      return "Request GAME_ROLE permission from Monad team";
    }
    return "You can now submit scores to Monad Games ID!";
  }
}
