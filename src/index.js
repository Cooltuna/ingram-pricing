require('dotenv').config();
const IngramClient = require('./client');

/**
 * Create and export an Ingram client instance from environment variables
 */
function createClient(config = {}) {
  const clientConfig = {
    clientId: config.clientId || process.env.INGRAM_CLIENT_ID,
    clientSecret: config.clientSecret || process.env.INGRAM_CLIENT_SECRET,
    baseUrl: config.baseUrl || process.env.INGRAM_API_BASE_URL,
    customerNumber: config.customerNumber || process.env.INGRAM_CUSTOMER_NUMBER,
    countryCode: config.countryCode || process.env.INGRAM_COUNTRY_CODE
  };

  // Validate required fields
  const requiredFields = ['clientId', 'clientSecret', 'customerNumber'];
  const missingFields = requiredFields.filter(field => !clientConfig[field]);
  
  if (missingFields.length > 0) {
    throw new Error(
      `Missing required configuration: ${missingFields.join(', ')}. ` +
      'Please set environment variables or pass config directly.'
    );
  }

  return new IngramClient(clientConfig);
}

module.exports = {
  IngramClient,
  createClient
};
