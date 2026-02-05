// CSV/TSV parser for part number imports

export function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];

  const firstLine = lines[0].toLowerCase().trim();
  const hasHeader =
    firstLine.includes('part') ||
    firstLine.includes('sku') ||
    firstLine.includes('number') ||
    firstLine.includes('ingram') ||
    firstLine.includes('vendor');

  const dataLines = hasHeader ? lines.slice(1) : lines;

  let partCol = 0;
  let typeCol = -1;
  let qtyCol = -1;

  if (hasHeader) {
    const headers = lines[0].split(/[,\t;|]/).map((h) => h.trim().toLowerCase());
    partCol = headers.findIndex(
      (h) => h.includes('part') || h.includes('sku') || h.includes('number')
    );
    typeCol = headers.findIndex((h) => h.includes('type'));
    qtyCol = headers.findIndex((h) => h.includes('qty') || h.includes('quantity'));
    if (partCol === -1) partCol = 0;
  }

  return dataLines
    .map((line) => {
      const cols = line.split(/[,\t;|]/).map((c) => c.trim().replace(/^["']|["']$/g, ''));
      const partNumber = cols[partCol] || '';
      const type = typeCol >= 0 ? cols[typeCol]?.toLowerCase() : '';
      const qty = qtyCol >= 0 ? parseInt(cols[qtyCol]) || 1 : 1;
      if (!partNumber) return null;

      if (type === 'vendor' || type === 'vpn') {
        return { vendorPartNumber: partNumber, displayNumber: partNumber, type: 'VPN', qty };
      }
      return { ingramPartNumber: partNumber, displayNumber: partNumber, type: 'IPN', qty };
    })
    .filter(Boolean);
}

export function exportResultsCSV(results) {
  const headers = [
    'Ingram Part#',
    'Vendor Part#',
    'Vendor',
    'Description',
    'Status',
    'Product Class',
    'UPC',
    'Customer Price',
    'Retail Price',
    'MAP Price',
    'Currency',
    'Total Available',
    'Accepts Backorder',
    'Returnable',
  ];

  const rows = results.map((r) => {
    const pricing = r.pricing || r.availability?.pricing || {};
    return [
      r.ingramPartNumber || '',
      r.vendorPartNumber || '',
      r.vendorName || '',
      `"${(r.description || '').replace(/"/g, '""')}"`,
      r.productStatusMessage || '',
      r.productClass || '',
      r.upc || '',
      pricing.customerPrice ?? '',
      pricing.retailPrice ?? '',
      pricing.mapPrice ?? '',
      pricing.currencyCode ?? 'USD',
      r.availability?.totalAvailability ?? '',
      r.acceptBackOrder ? 'Yes' : 'No',
      r.returnableProduct ? 'Yes' : 'No',
    ];
  });

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ingram_pricing_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
