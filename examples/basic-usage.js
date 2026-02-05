require('dotenv').config();
const { createClient } = require('../src/index');

/**
 * Basic usage example for Ingram Micro API client
 */
async function main() {
  try {
    // Create client from environment variables
    const client = createClient();

    console.log('🔍 Fetching pricing and availability...\n');

    // Example: Get pricing and availability for multiple products
    const productSkus = ['ABC123', 'XYZ789', 'DEF456'];
    
    const priceData = await client.getPriceAndAvailability(productSkus);

    // Handle response structure - could be array or object with products property
    const products = Array.isArray(priceData) ? priceData : (priceData.products || []);
    console.log('📦 Products:', products.length);
    
    // Display results
    if (products.length > 0) {
      products.forEach((product, index) => {
        console.log(`\n--- Product ${index + 1} ---`);
        console.log('SKU:', product.ingramPartNumber);
        console.log('Description:', product.description || 'N/A');
        
        if (product.pricing) {
          console.log('Price:', product.pricing.customerPrice || 'N/A');
          console.log('Currency:', product.pricing.currencyCode || 'N/A');
        }
        
        if (product.availability) {
          console.log('Available:', product.availability.available || 'N/A');
          console.log('Quantity:', product.availability.totalAvailability || 0);
        }
      });
    }

    console.log('\n✅ Success!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the example
if (require.main === module) {
  main();
}

module.exports = main;
