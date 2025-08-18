# Vercel Deployment Configuration

## Required Environment Variables

Set these in your Vercel project settings:

### Frontend Variables
```
VITE_PRIVY_APP_ID=your_privy_app_id_here
VITE_MONAD_GAMES_ID=cmd8euall0037le0my79qpz42
```

### Backend Variables (if you add server functionality)
```
WALLET_PRIVATE_KEY=your_private_key_for_server_transactions
```

## Deployment Steps

1. Connect your GitHub repository to Vercel
2. In Vercel Dashboard → Project Settings → Environment Variables
3. Add the required variables above
4. Deploy!

## Important Notes

- **VITE_PRIVY_APP_ID**: This should be YOUR Privy app ID, not Monad Games ID's
- **VITE_MONAD_GAMES_ID**: This should always be `cmd8euall0037le0my79qpz42`
- **WALLET_PRIVATE_KEY**: Only needed if you implement server-side transactions

## Testing Deployment

1. Visit your deployed app
2. Click "Sign In with Monad Games ID"
3. If you have a Monad Games ID account, you should be able to login
4. If not, register at https://monad-games-id-site.vercel.app/ first
