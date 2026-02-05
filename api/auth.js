// /api/auth.js — Vercel Serverless Function
// Handles OAuth2 client_credentials flow with Ingram Micro
// Credentials are stored in environment variables, never exposed to the browser

const INGRAM_TOKEN_URL = 'https://api.ingrammicro.com:443/oauth/oauth30/token';

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientId = process.env.INGRAM_CLIENT_ID;
  const clientSecret = process.env.INGRAM_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).json({
      error: 'Server configuration error',
      message: 'Ingram Micro API credentials are not configured. Set INGRAM_CLIENT_ID and INGRAM_CLIENT_SECRET in environment variables.',
    });
  }

  try {
    const response = await fetch(INGRAM_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Ingram auth error:', response.status, errorText);
      return res.status(response.status).json({
        error: 'Authentication failed',
        message: `Ingram Micro returned ${response.status}`,
      });
    }

    const data = await response.json();

    // Return token info (but NOT the client credentials)
    return res.status(200).json({
      access_token: data.access_token,
      token_type: data.token_type,
      expires_in: data.expires_in,
    });
  } catch (err) {
    console.error('Auth request failed:', err);
    return res.status(500).json({
      error: 'Authentication request failed',
      message: err.message,
    });
  }
}
