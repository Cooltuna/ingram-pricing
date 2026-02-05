require('dotenv').config();
const { createClient } = require('../src/index');

/**
 * Advanced usage example showing batch processing and error handling
 */
async function main() {
  try {
    const client = createClient();

    console.log('🚀 Advanced Ingram API Usage Example\n');

    // Example 1: Batch processing with chunking
    console.log('--- Example 1: Batch Processing ---');
    const allSkus = Array.from({ length: 75 }, (_, i) => `PROD${i + 1}`);
    
    // Process in chunks of 50 (API limit)
    const chunkSize = 50;
    const results = [];
    
    for (let i = 0; i < allSkus.length; i += chunkSize) {
      const chunk = allSkus.slice(i, i + chunkSize);
      console.log(`Processing chunk ${Math.floor(i / chunkSize) + 1}...`);
      
      try {
        const data = await client.getPriceAndAvailability(chunk);
        results.push(...data);
      } catch (error) {
        console.error(`Error processing chunk: ${error.message}`);
      }
    }
    
    console.log(`Processed ${results.length} products\n`);

    // Example 2: Get product details
    console.log('--- Example 2: Product Details ---');
    try {
      const details = await client.getProductDetails('ABC123');
      console.log('Product details retrieved successfully');
      console.log('Name:', details.productName || 'N/A');
      console.log('Vendor:', details.vendorName || 'N/A');
    } catch (error) {
      console.error('Product details error:', error.message);
    }
    console.log();

    // Example 3: Search products
    console.log('--- Example 3: Product Search ---');
    try {
      const searchResults = await client.searchProducts({
        keyword: 'laptop',
        pageNumber: 1,
        pageSize: 10
      });
      console.log('Search completed');
      console.log('Results:', searchResults.catalog?.length || 0);
    } catch (error) {
      console.error('Search error:', error.message);
    }
    console.log();

    // Example 4: Custom options
    console.log('--- Example 4: Custom Options ---');
    const customData = await client.getPriceAndAvailability(
      ['PROD1', 'PROD2'],
      {
        includeAvailability: true,
        includePricing: true,
        includeProductAttributes: true
      }
    );
    console.log('Custom request completed\n');

    console.log('✅ All examples completed!');

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = main;
