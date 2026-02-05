import { useState, Fragment } from 'react';
import { exportResultsCSV } from '../lib/csv';

export default function ResultsTable({ results }) {
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [sortKey, setSortKey] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);

  if (!results || results.length === 0) return null;

  const toggleRow = (idx) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const getPricing = (r) => r.pricing || r.availability?.pricing || {};

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const sorted = [...results].sort((a, b) => {
    if (!sortKey) return 0;
    let va, vb;
    switch (sortKey) {
      case 'part':
        va = a.ingramPartNumber || '';
        vb = b.ingramPartNumber || '';
        break;
      case 'vendor':
        va = a.vendorName || '';
        vb = b.vendorName || '';
        break;
      case 'price':
        va = getPricing(a).customerPrice ?? 999999;
        vb = getPricing(b).customerPrice ?? 999999;
        return sortAsc ? va - vb : vb - va;
      case 'avail':
        va = a.availability?.totalAvailability ?? -1;
        vb = b.availability?.totalAvailability ?? -1;
        return sortAsc ? va - vb : vb - va;
      default:
        return 0;
    }
    return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
  });

  const found = results.filter((r) => r.productStatusCode !== 'E').length;
  const notFound = results.length - found;

  const SortIcon = ({ col }) => (
    <span style={{ opacity: sortKey === col ? 1 : 0.3, marginLeft: '4px', fontSize: '10px' }}>
      {sortKey === col ? (sortAsc ? '▲' : '▼') : '⇅'}
    </span>
  );

  return (
    <div className="results-card" style={{ animation: 'fadeIn 0.4s ease' }}>
      {/* Header */}
      <div className="results-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h2 className="results-title">Results</h2>
          <span className="results-found">{found} found</span>
          {notFound > 0 && <span className="results-notfound">{notFound} not found</span>}
        </div>
        <button className="btn-export" onClick={() => exportResultsCSV(results)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th className="th-sortable" onClick={() => handleSort('part')}>
                Part Number <SortIcon col="part" />
              </th>
              <th className="th-sortable" onClick={() => handleSort('vendor')}>
                Vendor <SortIcon col="vendor" />
              </th>
              <th>Description</th>
              <th style={{ textAlign: 'center' }}>Class</th>
              <th className="th-sortable" onClick={() => handleSort('price')} style={{ textAlign: 'right' }}>
                Customer Price <SortIcon col="price" />
              </th>
              <th style={{ textAlign: 'right' }}>Retail</th>
              <th className="th-sortable" onClick={() => handleSort('avail')} style={{ textAlign: 'center' }}>
                Available <SortIcon col="avail" />
              </th>
              <th style={{ textAlign: 'center' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, idx) => {
              const pricing = getPricing(r);
              const isError = r.productStatusCode === 'E';
              const isExpanded = expandedRows.has(idx);
              const warehouses = r.availability?.availabilityByWarehouse || [];
              const hasDetail = !isError && warehouses.length > 0;

              return (
                <Fragment key={idx}>
                  <tr
                    className={`result-row ${isError ? 'row-error' : ''} ${isExpanded ? 'row-expanded' : ''} ${hasDetail ? 'row-clickable' : ''}`}
                    onClick={() => hasDetail && toggleRow(idx)}
                  >
                    <td>
                      <div className="part-number">{r.ingramPartNumber || '—'}</div>
                      {r.vendorPartNumber && (
                        <div className="vpn-sub">VPN: {r.vendorPartNumber}</div>
                      )}
                    </td>
                    <td>
                      <span style={{ fontWeight: 500 }}>{r.vendorName || '—'}</span>
                    </td>
                    <td style={{ maxWidth: '280px' }}>
                      <span style={{ fontSize: '12px', lineHeight: 1.4 }}>
                        {r.description || (isError ? r.productStatusMessage : '—')}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {r.productClass ? (
                        <span className={`class-badge class-${r.productClass}`}>
                          {r.productClass}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {pricing.customerPrice != null ? (
                        <span className="price-customer">
                          ${Number(pricing.customerPrice).toFixed(2)}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {pricing.retailPrice != null ? (
                        <span className="price-retail">
                          ${Number(pricing.retailPrice).toFixed(2)}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {r.availability ? (
                        <span className={`avail-count ${(r.availability.totalAvailability || 0) > 0 ? 'in-stock' : 'no-stock'}`}>
                          {r.availability.totalAvailability?.toLocaleString() ?? '0'}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {isError ? (
                        <span className="status-badge status-error">Not Found</span>
                      ) : r.availability?.available ? (
                        <span className="status-badge status-ok">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                          In Stock
                        </span>
                      ) : (
                        <span className="status-badge status-warn">Backorder</span>
                      )}
                    </td>
                  </tr>

                  {/* Expanded warehouse detail */}
                  {isExpanded && warehouses.length > 0 && (
                    <tr className="detail-row">
                      <td colSpan={8}>
                        <div className="warehouse-panel">
                          <div className="warehouse-title">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 21V8l9-5 9 5v13" /><path d="M9 21V12h6v9" />
                            </svg>
                            Warehouse Availability
                          </div>
                          <div className="warehouse-grid">
                            {warehouses.map((w, wi) => (
                              <div key={wi} className="warehouse-card">
                                <div className="wh-id">WH {w.warehouseId}</div>
                                <div className="wh-location">{w.location || '—'}</div>
                                <div className={`wh-qty ${(w.quantityAvailable || 0) > 0 ? 'in-stock' : ''}`}>
                                  {w.quantityAvailable?.toLocaleString() ?? '0'} avail
                                </div>
                                {(w.quantityBackordered || 0) > 0 && (
                                  <div className="wh-backorder">
                                    {w.quantityBackordered.toLocaleString()} backordered
                                  </div>
                                )}
                                {w.backOrderInfo?.map((bo, bi) => (
                                  <div key={bi} className="wh-eta">
                                    ETA {bo.etaDate}: {bo.quantity?.toLocaleString()}
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>

                          {/* Meta info */}
                          <div className="detail-meta">
                            {r.upc && <span>UPC: {r.upc}</span>}
                            {pricing.mapPrice > 0 && <span>MAP: ${Number(pricing.mapPrice).toFixed(2)}</span>}
                            {r.acceptBackOrder != null && <span>Backorder: {r.acceptBackOrder ? 'Yes' : 'No'}</span>}
                            {r.returnableProduct != null && <span>Returnable: {r.returnableProduct ? 'Yes' : 'No'}</span>}
                            {r.endUserInfoRequired && <span className="tag-amber">End-user info required</span>}
                            {r.govtSpecialPriceAvailable && <span className="tag-purple">Govt pricing available</span>}
                          </div>

                          {/* Discounts */}
                          {r.discounts?.[0]?.specialPricing?.length > 0 && (
                            <div className="discounts-section">
                              <div className="discounts-title">Special Pricing</div>
                              {r.discounts[0].specialPricing.map((sp, si) => (
                                <div key={si} className="discount-row">
                                  <span style={{ fontWeight: 600 }}>{sp.discountType}</span>
                                  <span className="discount-price">${Number(sp.specialPricingDiscount).toFixed(2)}</span>
                                  {sp.specialBidNumber && <span className="discount-bid">Bid: {sp.specialBidNumber}</span>}
                                  <span className="discount-dates">
                                    {sp.specialPricingEffectiveDate} → {sp.specialPricingExpirationDate}
                                  </span>
                                  {sp.governmentDiscountedCustomerPrice && (
                                    <span className="tag-purple">
                                      Govt: ${Number(sp.governmentDiscountedCustomerPrice).toFixed(2)} ({sp.governmentDiscountType})
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <style>{`
        .results-card {
          background: var(--surface);
          border-radius: var(--radius);
          border: 1px solid var(--border);
          padding: 24px;
        }
        .results-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .results-title {
          font-size: 15px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .results-found {
          font-size: 11px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 10px;
          background: var(--green-soft);
          color: var(--green);
          font-family: var(--font-mono);
        }
        .results-notfound {
          font-size: 11px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 10px;
          background: var(--red-soft);
          color: var(--red);
          font-family: var(--font-mono);
        }
        .btn-export {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          font-size: 12px;
          font-weight: 600;
        }
        .btn-export:hover {
          background: var(--surface-hover);
          border-color: var(--border-light);
        }
        .table-wrap {
          overflow-x: auto;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border);
        }
        table { font-size: 13px; }
        thead th {
          padding: 10px 14px;
          text-align: left;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          color: var(--text-muted);
          background: var(--surface-2);
          border-bottom: 1px solid var(--border);
          white-space: nowrap;
          user-select: none;
        }
        .th-sortable { cursor: pointer; }
        .th-sortable:hover { color: var(--text-secondary); }
        tbody td {
          padding: 11px 14px;
          vertical-align: top;
          border-bottom: 1px solid rgba(40, 45, 62, 0.5);
        }
        .result-row { transition: background 0.1s ease; }
        .row-clickable { cursor: pointer; }
        .row-clickable:hover { background: rgba(59, 130, 246, 0.03); }
        .row-error { background: rgba(239, 68, 68, 0.03); }
        .row-expanded { background: rgba(59, 130, 246, 0.04); }
        .part-number {
          font-weight: 600;
          color: var(--text-primary);
          font-family: var(--font-mono);
          font-size: 13px;
        }
        .vpn-sub {
          font-size: 10px;
          color: var(--text-muted);
          margin-top: 2px;
          font-family: var(--font-mono);
        }
        .class-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 26px;
          border-radius: 6px;
          font-weight: 800;
          font-size: 11px;
          font-family: var(--font-mono);
        }
        .class-A { background: var(--green-soft); color: var(--green); }
        .class-B { background: var(--accent-soft); color: var(--accent); }
        .class-C { background: var(--accent-soft); color: var(--accent); }
        .class-D, .class-O { background: var(--red-soft); color: var(--red); }
        .class-X { background: var(--amber-soft); color: var(--amber); }
        .price-customer {
          font-weight: 700;
          color: var(--accent);
          font-family: var(--font-mono);
          font-size: 14px;
        }
        .price-retail {
          color: var(--text-muted);
          font-family: var(--font-mono);
          font-size: 12px;
        }
        .avail-count {
          font-weight: 600;
          font-family: var(--font-mono);
        }
        .avail-count.in-stock { color: var(--green); }
        .avail-count.no-stock { color: var(--red); }
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 4px;
          white-space: nowrap;
          letter-spacing: 0.02em;
        }
        .status-ok { background: var(--green-soft); color: var(--green); }
        .status-warn { background: var(--amber-soft); color: var(--amber); }
        .status-error { background: var(--red-soft); color: var(--red); }

        /* Expanded detail */
        .detail-row td {
          padding: 0;
          background: var(--surface-2);
          border-bottom: 2px solid var(--border);
        }
        .warehouse-panel {
          padding: 18px 22px;
          animation: fadeIn 0.25s ease;
        }
        .warehouse-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--text-muted);
          margin-bottom: 10px;
        }
        .warehouse-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
          gap: 8px;
        }
        .warehouse-card {
          padding: 10px 12px;
          border-radius: var(--radius-sm);
          background: var(--surface);
          border: 1px solid var(--border);
        }
        .wh-id {
          font-size: 10px;
          font-weight: 800;
          font-family: var(--font-mono);
          color: var(--accent);
          letter-spacing: 0.04em;
        }
        .wh-location { font-size: 12px; color: var(--text-secondary); margin-top: 2px; }
        .wh-qty {
          font-size: 13px;
          font-weight: 700;
          font-family: var(--font-mono);
          margin-top: 4px;
          color: var(--text-muted);
        }
        .wh-qty.in-stock { color: var(--green); }
        .wh-backorder { font-size: 11px; color: var(--amber); margin-top: 2px; }
        .wh-eta {
          font-size: 10px;
          color: var(--text-muted);
          font-family: var(--font-mono);
          margin-top: 1px;
        }
        .detail-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          margin-top: 14px;
          padding-top: 12px;
          border-top: 1px solid var(--border);
          font-size: 11px;
          color: var(--text-muted);
          font-family: var(--font-mono);
        }
        .tag-amber { color: var(--amber); }
        .tag-purple { color: var(--purple); }
        .discounts-section {
          margin-top: 14px;
          padding-top: 12px;
          border-top: 1px solid var(--border);
        }
        .discounts-title {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--text-muted);
          margin-bottom: 8px;
        }
        .discount-row {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
          font-size: 12px;
          padding: 4px 0;
          color: var(--text-secondary);
        }
        .discount-price { color: var(--green); font-weight: 700; font-family: var(--font-mono); }
        .discount-bid { font-size: 11px; color: var(--text-muted); }
        .discount-dates { font-size: 10px; color: var(--text-muted); font-family: var(--font-mono); }
      `}</style>
    </div>
  );
}
