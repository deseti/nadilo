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
To get GAME_ROLE permission for Monad Games ID:

1. 📧 Contact Monad Team:
   - Email: development@monad.xyz
   - Discord: Join Monad Discord server
   - Telegram: Monad developer group

2. 📋 Provide Information:
   - Your wallet address: ${playerAddress}
   - Game contract address: ${gameAddress}
   - Game name: Nadilo - Crypto Clash
   - Game description: Token collection arena game
   - Proof of ownership/development

3. ⏳ Wait for Approval:
   - Monad team will review your request
   - They will grant GAME_ROLE to your address
   - You'll receive confirmation

4. ✅ Verify Permission:
   - Refresh this page after approval
   - Check that GAME_ROLE shows as ✅
   - You can then submit scores

Alternative Approaches:
• Deploy a game contract with GAME_ROLE
• Use a multi-sig wallet with GAME_ROLE
• Implement meta-transactions through authorized contract
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
      faucet: 'https://faucet.monad.xyz', // Update with actual faucet URL
      docs: 'https://docs.monad.xyz',
      discord: 'https://discord.gg/monad', // Update with actual Discord
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
