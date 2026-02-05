const axios = require('axios');
const IngramAuth = require('./auth');

/**
 * Ingram Micro API Client
 * Main client for interacting with Ingram Micro pricing and availability APIs
 */
class IngramClient {
  constructor(config) {
    this.config = {
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      baseUrl: config.baseUrl || 'https://api.ingrammicro.com:443',
      customerNumber: config.customerNumber,
      countryCode: config.countryCode || 'US'
    };

    this.auth = new IngramAuth(
      this.config.clientId,
      this.config.clientSecret,
      this.config.baseUrl
    );
  }

  /**
   * Get pricing and availability for products
   * @param {Array<string>} productSkus - Array of Ingram part numbers (max 50)
   * @param {Object} options - Optional parameters
   * @returns {Promise<Object>} Pricing and availability data
   */
  async getPriceAndAvailability(productSkus, options = {}) {
    if (!Array.isArray(productSkus) || productSkus.length === 0) {
      throw new Error('productSkus must be a non-empty array');
    }

    if (productSkus.length > 50) {
      throw new Error('Maximum 50 products per request');
    }

    try {
      const token = await this.auth.getAccessToken();
      
      const products = productSkus.map(sku => ({
        ingramPartNumber: sku
      }));

      const response = await axios.post(
        `${this.config.baseUrl}/resellers/v6/catalog/priceandavailability`,
        {
          products,
          includeAvailability: options.includeAvailability !== false,
          includePricing: options.includePricing !== false,
          includeProductAttributes: options.includeProductAttributes || false
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'IM-CustomerNumber': this.config.customerNumber,
            'IM-CountryCode': this.config.countryCode,
            'IM-CorrelationID': this.generateCorrelationId()
          }
        }
      );

      return response.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  /**
   * Get detailed product information
   * @param {string} productSku - Ingram part number
   * @returns {Promise<Object>} Product details
   */
  async getProductDetails(productSku) {
    if (!productSku) {
      throw new Error('productSku is required');
    }

    try {
      const token = await this.auth.getAccessToken();
      
      const response = await axios.get(
        `${this.config.baseUrl}/resellers/v6/catalog/details/${productSku}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'IM-CustomerNumber': this.config.customerNumber,
            'IM-CountryCode': this.config.countryCode,
            'IM-CorrelationID': this.generateCorrelationId()
          }
        }
      );

      return response.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  /**
   * Search for products in the catalog
   * @param {Object} searchParams - Search parameters
   * @returns {Promise<Object>} Search results
   */
  async searchProducts(searchParams) {
    try {
      const token = await this.auth.getAccessToken();
      
      const params = new URLSearchParams();
      if (searchParams.keyword) params.append('searchTerm', searchParams.keyword);
      if (searchParams.pageNumber) params.append('pageNumber', searchParams.pageNumber);
      if (searchParams.pageSize) params.append('pageSize', searchParams.pageSize);

      const response = await axios.get(
        `${this.config.baseUrl}/resellers/v6/catalog?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'IM-CustomerNumber': this.config.customerNumber,
            'IM-CountryCode': this.config.countryCode,
            'IM-CorrelationID': this.generateCorrelationId()
          }
        }
      );

      return response.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  /**
   * Generate a unique correlation ID for API tracking
   * @returns {string} Correlation ID
   */
  generateCorrelationId() {
    return `logistico-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Handle API errors with meaningful messages
   * @param {Error} error - Axios error object
   */
  handleApiError(error) {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      throw new Error(
        `Ingram API Error (${status}): ${data.message || data.error || 'Unknown error'}`
      );
    } else if (error.request) {
      throw new Error('No response received from Ingram API');
    } else {
      throw new Error(`Request failed: ${error.message}`);
    }
  }
}

module.exports = IngramClient;
