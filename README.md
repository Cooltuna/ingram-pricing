# Ingram Micro API Pricing Tool

A Node.js client library for integrating with Ingram Micro's API to fetch real-time pricing and availability data for Logistico inventory management.

## Features

- 🔐 **OAuth2 Authentication** - Automatic token management with caching
- 💰 **Pricing & Availability** - Fetch real-time pricing and stock levels for up to 50 products per request
- 📦 **Product Details** - Get detailed product information
- 🔍 **Product Search** - Search the Ingram Micro catalog
- ⚡ **Batch Processing** - Built-in support for processing large product lists
- 🛡️ **Error Handling** - Comprehensive error handling and logging

## Prerequisites

- Node.js 14.0.0 or higher
- Ingram Micro API credentials (Client ID and Client Secret)
- Active Ingram Micro reseller account

## Installation

1. Clone this repository:
```bash
git clone https://github.com/Cooltuna/ingram-pricing.git
cd ingram-pricing
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

4. Edit `.env` and add your Ingram Micro credentials:
```env
INGRAM_CLIENT_ID=your_client_id_here
INGRAM_CLIENT_SECRET=your_client_secret_here
INGRAM_CUSTOMER_NUMBER=your_customer_number
INGRAM_COUNTRY_CODE=US
```

## Getting API Credentials

1. Visit [Ingram Micro Developer Portal](https://developer.ingrammicro.com)
2. Register for a developer account
3. Apply for access to the Product Catalog and Price & Availability APIs
4. Once approved, you'll receive your Client ID and Client Secret
5. Note: Approval can take several days

## Usage

### Basic Example

```javascript
const { createClient } = require('./src/index');

async function main() {
  // Create client from environment variables
  const client = createClient();

  // Get pricing and availability
  const productSkus = ['ABC123', 'XYZ789'];
  const data = await client.getPriceAndAvailability(productSkus);

  console.log(data);
}

main();
```

### Advanced Usage

```javascript
const { createClient } = require('./src/index');

async function main() {
  // Create client with custom config
  const client = createClient({
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
    customerNumber: 'your-customer-number',
    countryCode: 'US'
  });

  // Batch processing for large lists
  const allSkus = ['SKU1', 'SKU2', /* ... up to 100s of SKUs */];
  const chunkSize = 50;
  const results = [];

  for (let i = 0; i < allSkus.length; i += chunkSize) {
    const chunk = allSkus.slice(i, i + chunkSize);
    const data = await client.getPriceAndAvailability(chunk);
    results.push(...data);
  }

  // Get detailed product information
  const details = await client.getProductDetails('ABC123');

  // Search products
  const searchResults = await client.searchProducts({
    keyword: 'laptop',
    pageNumber: 1,
    pageSize: 10
  });
}

main();
```

### Custom Options

```javascript
// Include additional product attributes
const data = await client.getPriceAndAvailability(
  ['ABC123'],
  {
    includeAvailability: true,
    includePricing: true,
    includeProductAttributes: true
  }
);
```

## API Methods

### `getPriceAndAvailability(productSkus, options)`

Fetch pricing and availability for multiple products.

**Parameters:**
- `productSkus` (Array<string>): Array of Ingram part numbers (max 50)
- `options` (Object, optional):
  - `includeAvailability` (boolean): Include stock levels (default: true)
  - `includePricing` (boolean): Include pricing data (default: true)
  - `includeProductAttributes` (boolean): Include additional attributes (default: false)

**Returns:** Promise<Object> - Pricing and availability data

### `getProductDetails(productSku)`

Get detailed information for a specific product.

**Parameters:**
- `productSku` (string): Ingram part number

**Returns:** Promise<Object> - Product details

### `searchProducts(searchParams)`

Search the Ingram Micro catalog.

**Parameters:**
- `searchParams` (Object):
  - `keyword` (string): Search term
  - `pageNumber` (number): Page number (default: 1)
  - `pageSize` (number): Results per page (default: 25)

**Returns:** Promise<Object> - Search results

## Running Examples

```bash
# Basic usage example
npm run example

# View other examples
node examples/advanced-usage.js
```

## Integration with Logistico

This tool is designed to integrate with Logistico inventory management. You can:

1. **Scheduled Sync**: Set up a cron job to periodically fetch pricing updates
2. **On-Demand Updates**: Fetch pricing when needed (e.g., before creating quotes)
3. **Batch Processing**: Process large product catalogs efficiently

Example integration pattern:
```javascript
const { createClient } = require('ingram-pricing');

async function syncPricingToLogistico() {
  const client = createClient();
  const productSkus = await getProductSkusFromLogistico();
  
  // Process in batches
  for (let i = 0; i < productSkus.length; i += 50) {
    const batch = productSkus.slice(i, i + 50);
    const pricing = await client.getPriceAndAvailability(batch);
    
    // Update Logistico database
    await updateLogisticoPricing(pricing);
  }
}
```

## Error Handling

The client throws descriptive errors for common issues:

```javascript
try {
  const data = await client.getPriceAndAvailability(productSkus);
} catch (error) {
  console.error('API Error:', error.message);
  // Handle error appropriately
}
```

Common errors:
- `Authentication failed`: Invalid credentials or expired access
- `Maximum 50 products per request`: Too many SKUs in single request
- `Ingram API Error (4xx/5xx)`: API-specific errors with status codes

## API Rate Limits

- Maximum 50 products per `getPriceAndAvailability` request
- Respect Ingram Micro's rate limits (check your API agreement)
- Token caching reduces authentication requests

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run examples
npm run example
```

## Project Structure

```
ingram-pricing/
├── src/
│   ├── index.js      # Main entry point
│   ├── client.js     # API client implementation
│   └── auth.js       # OAuth2 authentication
├── examples/
│   ├── basic-usage.js
│   └── advanced-usage.js
├── .env.example      # Environment variables template
├── package.json
└── README.md
```

## Best Practices

1. **Secure Credentials**: Never commit `.env` file or credentials to version control
2. **Token Caching**: The client automatically caches access tokens to reduce API calls
3. **Batch Processing**: Process large lists in chunks of 50 SKUs
4. **Error Handling**: Always wrap API calls in try-catch blocks
5. **Rate Limiting**: Implement delays between batch requests if needed
6. **Monitoring**: Use the correlation ID in logs for API request tracking

## Troubleshooting

### Authentication Errors
- Verify your Client ID and Client Secret are correct
- Ensure your API access has been approved by Ingram Micro
- Check that credentials haven't expired

### API Errors
- Verify your customer number is correct
- Ensure country code matches your account region
- Check product SKUs are valid Ingram part numbers

### Connection Issues
- Verify API base URL is correct
- Check network connectivity
- Ensure firewall allows HTTPS traffic to Ingram's API

## Support

For API-related questions:
- [Ingram Micro Developer Portal](https://developer.ingrammicro.com)
- Contact your Ingram Micro account representative

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgments

Built for Logistico inventory management system to enable seamless integration with Ingram Micro's wholesale distribution platform.