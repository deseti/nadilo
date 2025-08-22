import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  console.log('🧪 Test API endpoint called');
  
  return res.status(200).json({
    success: true,
    message: 'API is working!',
    method: req.method,
    timestamp: new Date().toISOString(),
    env: {
      hasWalletKey: !!process.env.WALLET_PRIVATE_KEY,
      nodeEnv: process.env.NODE_ENV
    }
  });
}