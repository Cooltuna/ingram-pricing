const axios = require('axios');

/**
 * Ingram Micro OAuth2 Authentication Client
 * Handles authentication and token management for Ingram Micro API
 */
class IngramAuth {
  constructor(clientId, clientSecret, baseUrl) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.baseUrl = baseUrl;
    this.accessToken = null;
    this.tokenExpiresAt = null;
  }

  /**
   * Get a valid access token, refreshing if necessary
   * @returns {Promise<string>} Valid access token
   */
  async getAccessToken() {
    // Return cached token if still valid
    if (this.accessToken && this.tokenExpiresAt && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    // Request new token
    await this.authenticate();
    return this.accessToken;
  }

  /**
   * Authenticate with Ingram Micro API using OAuth2 client credentials flow
   * @returns {Promise<void>}
   */
  async authenticate() {
    try {
      const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      
      const response = await axios.post(
        `${this.baseUrl}/oauth/oauth30/token`,
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      this.accessToken = response.data.access_token;
      // Set expiration with 5 minute buffer to avoid edge cases
      const expiresIn = response.data.expires_in || 3600;
      this.tokenExpiresAt = Date.now() + ((expiresIn - 300) * 1000);
      
    } catch (error) {
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  /**
   * Clear cached token (useful for testing or forcing re-authentication)
   */
  clearToken() {
    this.accessToken = null;
    this.tokenExpiresAt = null;
  }
}

module.exports = IngramAuth;
