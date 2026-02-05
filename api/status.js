// /api/status.js — Vercel Serverless Function
// Health check + config verification endpoint

export default async function handler(req, res) {
  const config = {
    hasClientId: !!process.env.INGRAM_CLIENT_ID,
    hasClientSecret: !!process.env.INGRAM_CLIENT_SECRET,
    hasCustomerNumber: !!process.env.INGRAM_CUSTOMER_NUMBER,
    countryCode: process.env.INGRAM_COUNTRY_CODE || 'US',
    useSandbox: process.env.INGRAM_USE_SANDBOX === 'true',
    senderId: process.env.INGRAM_SENDER_ID || 'PricingTool',
  };

  const isConfigured = config.hasClientId && config.hasClientSecret && config.hasCustomerNumber;

  return res.status(200).json({
    status: isConfigured ? 'ready' : 'needs_configuration',
    config,
    message: isConfigured
      ? `Connected (${config.useSandbox ? 'Sandbox' : 'Production'} mode)`
      : 'Missing environment variables. Set INGRAM_CLIENT_ID, INGRAM_CLIENT_SECRET, and INGRAM_CUSTOMER_NUMBER.',
  });
}
