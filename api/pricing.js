// /api/pricing.js — Vercel Serverless Function
// Proxies Price & Availability requests to Ingram Micro
// Handles batching (50 products per request), auth header injection

const INGRAM_BASE = 'https://api.ingrammicro.com:443';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { products, accessToken } = req.body;

  if (!products || !Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ error: 'products array is required' });
  }

  if (!accessToken) {
    return res.status(401).json({ error: 'accessToken is required. Call /api/auth first.' });
  }

  const customerNumber = process.env.INGRAM_CUSTOMER_NUMBER;
  const countryCode = process.env.INGRAM_COUNTRY_CODE || 'US';
  const senderId = process.env.INGRAM_SENDER_ID || 'PricingTool';
  const useSandbox = process.env.INGRAM_USE_SANDBOX === 'true';

  if (!customerNumber) {
    return res.status(500).json({
      error: 'Server configuration error',
      message: 'INGRAM_CUSTOMER_NUMBER is not set in environment variables.',
    });
  }

  const baseUrl = useSandbox ? `${INGRAM_BASE}/sandbox` : INGRAM_BASE;
  const endpoint = `${baseUrl}/resellers/v6/catalog/priceandavailability?includeAvailability=true&includePricing=true`;

  try {
    // Batch into groups of 50 (Ingram API limit)
    const batches = [];
    for (let i = 0; i < products.length; i += 50) {
      batches.push(products.slice(i, i + 50));
    }

    const allResults = [];
    const errors = [];

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      const correlationId = `IM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-B${batchIndex}`;

      const body = {
        products: batch.map((p) => {
          if (p.ingramPartNumber) return { ingramPartNumber: p.ingramPartNumber };
          if (p.vendorPartNumber) return { vendorPartNumber: p.vendorPartNumber };
          // Fallback: treat as Ingram part number
          return { ingramPartNumber: p.partNumber || String(p) };
        }),
      };

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'IM-CustomerNumber': customerNumber,
            'IM-CountryCode': countryCode,
            'IM-CorrelationID': correlationId,
            'IM-SenderID': senderId,
          },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errBody = await response.json().catch(() => ({}));
          const errMsg = errBody?.errors?.[0]?.message || `Batch ${batchIndex + 1}: HTTP ${response.status}`;
          errors.push({ batch: batchIndex + 1, status: response.status, message: errMsg });
          continue;
        }

        const data = await response.json();
        const items = Array.isArray(data) ? data : [data];
        allResults.push(...items);
      } catch (batchErr) {
        errors.push({ batch: batchIndex + 1, message: batchErr.message });
      }
    }

    return res.status(200).json({
      results: allResults,
      totalProducts: products.length,
      totalBatches: batches.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    console.error('Pricing request failed:', err);
    return res.status(500).json({
      error: 'Pricing request failed',
      message: err.message,
    });
  }
}
