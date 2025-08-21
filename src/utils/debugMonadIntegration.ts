// Debug script untuk check Monad Games ID integration
import { publicClient, MONAD_LEADERBOARD_CONTRACT_ADDRESS } from '../lib/monadContract';
import MONAD_LEADERBOARD_ABI from '../lib/monadLeaderboardABI';

export async function debugMonadIntegration(walletAddress: string, gameAddress: string) {
    console.log('🔍 DEBUGGING MONAD GAMES ID INTEGRATION');
    console.log('=====================================');

    try {
        // 1. Check game wallet and GAME_ROLE permission
        console.log('\n1. Checking game wallet and GAME_ROLE permission...');
        
        let gameWalletAddress = 'Not configured';
        let gameWalletHasRole = false;
        
        try {
            const { createGameWalletClient } = await import('../lib/monadContract');
            const { account } = createGameWalletClient();
            gameWalletAddress = account.address;
            
            const gameRole = await publicClient.readContract({
                address: MONAD_LEADERBOARD_CONTRACT_ADDRESS,
                abi: MONAD_LEADERBOARD_ABI,
                functionName: 'GAME_ROLE',
            }) as string;

            console.log('GAME_ROLE hash:', gameRole);

            gameWalletHasRole = await publicClient.readContract({
                address: MONAD_LEADERBOARD_CONTRACT_ADDRESS,
                abi: MONAD_LEADERBOARD_ABI,
                functionName: 'hasRole',
                args: [gameRole, gameWalletAddress],
            }) as boolean;

            console.log(`🎮 Game wallet: ${gameWalletAddress}`);
            console.log(`🎮 Game wallet has GAME_ROLE:`, gameWalletHasRole ? '✅ YES' : '❌ NO');
        } catch (error) {
            console.log('❌ Game wallet not configured:', error);
        }

        // Also check player wallet for reference
        const hasRole = await publicClient.readContract({
            address: MONAD_LEADERBOARD_CONTRACT_ADDRESS,
            abi: MONAD_LEADERBOARD_ABI,
            functionName: 'hasRole',
            args: [await publicClient.readContract({
                address: MONAD_LEADERBOARD_CONTRACT_ADDRESS,
                abi: MONAD_LEADERBOARD_ABI,
                functionName: 'GAME_ROLE',
            }) as string, walletAddress],
        }) as boolean;

        console.log(`👤 Player wallet ${walletAddress} has GAME_ROLE:`, hasRole ? '✅ YES' : '❌ NO (not needed)');

        // 2. Check game registration
        console.log('\n2. Checking game registration...');
        const gameData = await publicClient.readContract({
            address: MONAD_LEADERBOARD_CONTRACT_ADDRESS,
            abi: MONAD_LEADERBOARD_ABI,
            functionName: 'games',
            args: [gameAddress],
        }) as [string, string, string, string];

        const isRegistered = gameData[2] !== '';
        console.log(`Game ${gameAddress} is registered:`, isRegistered ? '✅ YES' : '❌ NO');

        if (isRegistered) {
            console.log('Game info:', {
                address: gameData[0],
                image: gameData[1],
                name: gameData[2],
                url: gameData[3]
            });
        }

        // 3. Check current player data
        console.log('\n3. Checking current player data...');
        try {
            const playerData = await publicClient.readContract({
                address: MONAD_LEADERBOARD_CONTRACT_ADDRESS,
                abi: MONAD_LEADERBOARD_ABI,
                functionName: 'playerDataPerGame',
                args: [gameAddress, walletAddress],
            }) as [bigint, bigint]; // [score, transactions]

            console.log(`Player data for ${walletAddress}:`, {
                score: Number(playerData[0]),
                transactions: Number(playerData[1])
            });

            // Also check total score across all games
            const totalScore = await publicClient.readContract({
                address: MONAD_LEADERBOARD_CONTRACT_ADDRESS,
                abi: MONAD_LEADERBOARD_ABI,
                functionName: 'totalScoreOfPlayer',
                args: [walletAddress],
            }) as bigint;

            console.log(`Total score across all games:`, Number(totalScore));

        } catch (error) {
            console.log('Could not get player data:', error);
        }

        // 4. Summary
        console.log('\n4. SUMMARY');
        console.log('==========');
        console.log('Can submit scores:', gameWalletHasRole && isRegistered ? '✅ YES' : '❌ NO');

        if (!gameWalletHasRole) {
            console.log('❌ Game wallet missing GAME_ROLE permission or not configured');
            console.log('📝 Action needed: Check VITE_WALLET_PRIVATE_KEY in .env or request GAME_ROLE for game wallet');
        }

        if (!isRegistered) {
            console.log('❌ Game not registered');
            console.log('📝 Action needed: Register game in Monad Games ID');
        }

        if (gameWalletHasRole && isRegistered) {
            console.log('✅ All systems ready! Game wallet can submit scores automatically.');
        }

        return {
            hasGameRole: gameWalletHasRole, // Use game wallet role instead of player wallet
            gameRegistered: isRegistered,
            canSubmit: gameWalletHasRole && isRegistered,
            gameWalletAddress,
            playerWalletHasRole: hasRole
        };

    } catch (error) {
        console.error('❌ Debug failed:', error);
        return {
            hasGameRole: false,
            gameRegistered: false,
            canSubmit: false
        };
    }
}

// Helper function to get proper wallet address from user
export function getEffectiveWalletAddress(user: any, monadWalletAddress: string, effectivePlayerAddress: string): string {
    const address = effectivePlayerAddress || monadWalletAddress || user?.wallet?.address;
    console.log('🔧 Effective wallet address:', address);
    return address;
}