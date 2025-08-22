import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  console.log('🧪 Test API endpoint called');

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

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