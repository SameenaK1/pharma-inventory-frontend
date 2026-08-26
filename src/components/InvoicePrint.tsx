import { forwardRef } from 'react';
import type { BillingInvoiceItem, BillingInvoiceListItem } from '../services/billing';

// ---------------------------------------------------------------------------
// Pharmacy header used on every printed invoice.
// Update these values to match the pharmacy's real letterhead.
// ---------------------------------------------------------------------------
const PHARMACY = {
  name: 'MediCare Pharmacy',
  tagline: 'Trusted medicines & wellness care',
  address: 'Shop 12, MG Road, Near City Hospital, Bengaluru, Karnataka 560001',
  phone: '+91 98765 43210',
  email: 'care@medicarepharmacy.in',
  gstin: '29ABCDE1234F1Z5',
  dlNumber: 'DL-KA-21-000123',
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const money = (value: string | number | null | undefined) =>
  `₹${Number(value ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const numberAmount = (value: string | number | null | undefined) => Number(value ?? 0);

function formatInvoiceDate(value: string | null): string {
  if (!value) return '—';
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return String(value).slice(0, 10);
  const month = MONTHS[Number(match[2]) - 1] ?? '';
  return `${match[3]} ${month} ${match[1]}`;
}

function formatExpiryDate(value: string | null): string {
  const match = String(value ?? '').match(/^(\d{4})-(\d{2})/);
  if (!match) return String(value ?? '').slice(0, 7);
  const month = MONTHS[Number(match[2]) - 1] ?? '';
  return `${month} ${match[1]}`;
}

// ---------------------------------------------------------------------------
// Indian numbering system amount-to-words helper.
// ---------------------------------------------------------------------------
const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen',
];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function twoDigits(n: number): string {
  if (n < 20) return ONES[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return `${TENS[t]}${o ? ` ${ONES[o]}` : ''}`.trim();
}

function threeDigits(n: number): string {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  if (!h) return twoDigits(rest);
  return `${ONES[h]} Hundred${rest ? ` ${twoDigits(rest)}` : ''}`.trim();
}

function amountInWords(amount: number): string {
  const rupees = Math.floor(Math.abs(amount));
  const paise = Math.round((Math.abs(amount) - rupees) * 100);
  if (!rupees && !paise) return 'Zero Rupees Only';

  const crore = Math.floor(rupees / 10000000);
  const lakh = Math.floor((rupees % 10000000) / 100000);
  const thousand = Math.floor((rupees % 100000) / 1000);
  const rest = rupees % 1000;

  const parts: string[] = [];
  if (crore) parts.push(`${threeDigits(crore)} Crore`);
  if (lakh) parts.push(`${twoDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${twoDigits(thousand)} Thousand`);
  if (rest) parts.push(threeDigits(rest));

  const rupeeWords = parts.length ? `${parts.join(' ')} Rupees` : '';
  const paiseWords = paise ? `${twoDigits(paise)} Paise` : '';
  const joined = [rupeeWords, paiseWords].filter(Boolean).join(' and ');
  return `${amount < 0 ? 'Minus ' : ''}${joined} Only`;
}

interface InvoicePrintProps {
  invoice: BillingInvoiceListItem;
  items: BillingInvoiceItem[];
}

// Renders a self-contained A4 invoice. All styling is scoped via a <style> block
// and plain CSS (no framework classes) so the same node can be printed in a new
// window or rasterised to a PDF by html2canvas without losing its look.
const InvoicePrint = forwardRef<HTMLDivElement, InvoicePrintProps>(function InvoicePrint(
  { invoice, items },
  ref
) {
  const taxBreakdown = (invoice.tax_breakdown ?? []).filter(
    (slab) => Number(slab.taxable) > 0 || Number(slab.cgst) > 0 || Number(slab.sgst) > 0 || Number(slab.igst) > 0
  );

  const totalQuantity = Number(invoice.total_quantity ?? 0);
  const grossAmount = numberAmount(invoice.gross_amount);
  const discountAmount = numberAmount(invoice.discount_amount);
  const flatDiscount = numberAmount(invoice.flat_discount);
  const subtotal = numberAmount(invoice.subtotal);
  const finalPayable = numberAmount(invoice.final_payable);

  return (
    <div ref={ref} className="inv-sheet">
      <style>{`
        .inv-sheet {
          width: 794px;
          min-height: 1123px;
          margin: 0 auto;
          padding: 44px 46px;
          background: #ffffff;
          color: #1f2937;
          font-family: 'Segoe UI', Arial, Helvetica, sans-serif;
          box-sizing: border-box;
          line-height: 1.35;
        }
        .inv-sheet * { box-sizing: border-box; }
        .inv-topbar {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 3px solid #0f766e;
          padding-bottom: 16px;
        }
        .inv-brand-name { font-size: 26px; font-weight: 800; color: #134e4a; letter-spacing: 0.2px; margin: 0; }
        .inv-brand-tagline { font-size: 12px; color: #0f766e; font-weight: 600; margin: 2px 0 10px; }
        .inv-brand-detail { font-size: 11px; color: #4b5563; margin: 2px 0; }
        .inv-doc-block { text-align: right; }
        .inv-doc-title { font-size: 22px; font-weight: 800; color: #0f766e; letter-spacing: 1px; margin: 0 0 10px; }
        .inv-meta-row { display: flex; justify-content: flex-end; gap: 6px; font-size: 12px; margin: 3px 0; }
        .inv-meta-label { color: #6b7280; }
        .inv-meta-value { font-weight: 700; color: #111827; }

        .inv-section { margin-top: 18px; }
        .inv-section-title {
          font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px;
          color: #0f766e; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 10px;
        }
        .inv-parties { display: flex; justify-content: space-between; gap: 24px; }
        .inv-party { flex: 1; font-size: 12px; color: #374151; }
        .inv-party-name { font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 4px; }
        .inv-party-row { margin: 2px 0; }
        .inv-party-label { color: #6b7280; }

        .inv-table { width: 100%; border-collapse: collapse; font-size: 11px; }
        .inv-table th {
          background: #f0fdfa; color: #134e4a; font-weight: 700; text-transform: uppercase;
          font-size: 10px; letter-spacing: 0.4px; border: 1px solid #d1d5db; padding: 6px 6px;
          text-align: right;
        }
        .inv-table th.inv-left, .inv-table td.inv-left { text-align: left; }
        .inv-table td { border: 1px solid #e5e7eb; padding: 6px; text-align: right; vertical-align: top; }
        .inv-table tbody tr:nth-child(even) td { background: #fafafa; }
        .inv-med-name { font-weight: 700; color: #111827; }
        .inv-med-sub { font-size: 10px; color: #6b7280; margin-top: 2px; }

        .inv-lower { display: flex; gap: 20px; margin-top: 18px; }
        .inv-gst-box { flex: 1.4; }
        .inv-totals-box { flex: 1; }
        .inv-totals-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .inv-totals-table td { padding: 6px 8px; border: 1px solid #e5e7eb; }
        .inv-totals-table .lbl { color: #4b5563; font-weight: 600; }
        .inv-totals-table .amt { text-align: right; font-weight: 600; color: #111827; }
        .inv-grand { background: #0f4d76; color: #040607 !important; font-weight: 800; }
        .inv-grand .lbl, .inv-grand .amt { color: #f5fcff !important; }

        .inv-words {
          margin-top: 14px; font-size: 12px; color: #374151;
          border: 1px dashed #cbd5e1; border-radius: 6px; padding: 8px 12px;
        }
        .inv-words b { color: #111827; }

        .inv-footer {
          display: flex; justify-content: space-between; align-items: flex-end;
          margin-top: 22px; padding-top: 12px; border-top: 1px solid #e5e7eb;
        }
        .inv-terms { font-size: 9.5px; color: #6b7280; max-width: 62%; }
        .inv-sign { text-align: center; font-size: 11px; color: #4b5563; }
        .inv-sign-line { width: 180px; border-top: 1px solid #9ca3af; margin: 38px auto 6px; }
        .inv-thanks { text-align: center; font-size: 12px; font-weight: 700; color: #0f766e; margin-top: 14px; }

        @media print {
          body { margin: 0; }
          .inv-sheet { width: 210mm; min-height: 0; padding: 12mm 14mm; }
        }
      `}</style>

      <div className="inv-topbar">
        <div>
          <p className="inv-brand-name">{PHARMACY.name}</p>
          <p className="inv-brand-tagline">{PHARMACY.tagline}</p>
          <p className="inv-brand-detail">{PHARMACY.address}</p>
          <p className="inv-brand-detail">Phone: {PHARMACY.phone} &nbsp;·&nbsp; Email: {PHARMACY.email}</p>
          <p className="inv-brand-detail">GSTIN: {PHARMACY.gstin} &nbsp;·&nbsp; {PHARMACY.dlNumber}</p>
        </div>
        <div className="inv-doc-block">
          <p className="inv-doc-title">TAX INVOICE</p>
          <div className="inv-meta-row">
            <span className="inv-meta-label">Invoice No:</span>
            <span className="inv-meta-value">{invoice.invoice_number}</span>
          </div>
          <div className="inv-meta-row">
            <span className="inv-meta-label">Date:</span>
            <span className="inv-meta-value">{formatInvoiceDate(invoice.invoice_date)}</span>
          </div>
          <div className="inv-meta-row">
            <span className="inv-meta-label">Payment:</span>
            <span className="inv-meta-value">{invoice.payment_type || 'Cash'}</span>
          </div>
        </div>
      </div>

      <div className="inv-section">
        <div className="inv-section-title">Billing details</div>
        <div className="inv-parties">
          <div className="inv-party">
            <div className="inv-party-name">{invoice.customer_name || 'Walk-in customer'}</div>
            <div className="inv-party-row"><span className="inv-party-label">Phone: </span>{invoice.phone_number || '—'}</div>
            <div className="inv-party-row">
              <span className="inv-party-label">Age / Gender: </span>
              {invoice.patient_age != null ? `${invoice.patient_age} yrs` : '—'}
              {invoice.patient_gender ? ` · ${invoice.patient_gender}` : ''}
            </div>
            <div className="inv-party-row"><span className="inv-party-label">Address: </span>{invoice.address || '—'}</div>
            <div className="inv-party-row"><span className="inv-party-label">GSTIN: </span>{invoice.gstin || '—'}</div>
          </div>
          <div className="inv-party">
            <div className="inv-party-name">Doctor / Prescriber</div>
            <div className="inv-party-row"><span className="inv-party-label">Name: </span>{invoice.doctor_name || '—'}</div>
            <div className="inv-party-row"><span className="inv-party-label">Billed by: </span>{invoice.created_by || '—'}</div>
          </div>
        </div>
      </div>

      <div className="inv-section">
        <div className="inv-section-title">Itemised medicines</div>
        <table className="inv-table">
          <thead>
            <tr>
              <th className="inv-left" style={{ width: 20 }}>#</th>
              <th className="inv-left">Medicine</th>
              <th>Batch</th>
              <th>Expiry</th>
              <th>Qty</th>
              <th>Pack</th>
              <th>MRP</th>
              <th>Rate</th>
              <th>Disc</th>
              <th>GST%</th>
              <th>Taxable</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={12} className="inv-left" style={{ textAlign: 'center', color: '#6b7280' }}>
                  No line items recorded for this invoice.
                </td>
              </tr>
            )}
            {items.map((item, index) => (
              <tr key={item.item_id ?? index}>
                <td className="inv-left">{index + 1}</td>
                <td className="inv-left">
                  <div className="inv-med-name">{item.medicine_name}</div>
                  {item.hsn_code && <div className="inv-med-sub">HSN: {item.hsn_code}</div>}
                </td>
                <td>{item.batch || '—'}</td>
                <td>{formatExpiryDate(item.expiry_date)}</td>
                <td>{item.qty}</td>
                <td>{item.pack || '—'}</td>
                <td>{money(item.mrp)}</td>
                <td>{money(item.selling_price)}</td>
                <td>{money(item.discount)}</td>
                <td>{Number(item.gst_percentage ?? 0)}%</td>
                <td>{money(item.taxable_amount)}</td>
                <td><b>{money(item.total)}</b></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="inv-lower">
        <div className="inv-gst-box">
          <div className="inv-section-title">Tax breakup</div>
          <table className="inv-table">
            <thead>
              <tr>
                <th>GST%</th>
                <th>Taxable</th>
                <th>CGST</th>
                <th>SGST</th>
                <th>IGST</th>
                <th>Total Tax</th>
              </tr>
            </thead>
            <tbody>
              {taxBreakdown.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: '#6b7280' }}>—</td>
                </tr>
              )}
              {taxBreakdown.map((slab, index) => (
                <tr key={`${slab.rate}-${index}`}>
                  <td>{slab.rate}%</td>
                  <td>{money(slab.taxable)}</td>
                  <td>{money(slab.cgst)}</td>
                  <td>{money(slab.sgst)}</td>
                  <td>{money(slab.igst)}</td>
                  <td>{money(Number(slab.cgst) + Number(slab.sgst) + Number(slab.igst))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="inv-totals-box">
          <table className="inv-totals-table">
            <tbody>
              <tr>
                <td className="lbl">Total Quantity</td>
                <td className="amt">{totalQuantity}</td>
              </tr>
              <tr>
                <td className="lbl">Gross Amount</td>
                <td className="amt">{money(grossAmount)}</td>
              </tr>
              <tr>
                <td className="lbl">Item Discount</td>
                <td className="amt">-{money(discountAmount)}</td>
              </tr>
              <tr>
                <td className="lbl">Flat Discount</td>
                <td className="amt">-{money(flatDiscount)}</td>
              </tr>
              <tr>
                <td className="lbl">Subtotal</td>
                <td className="amt">{money(subtotal)}</td>
              </tr>
              <tr className="inv-grand">
                <td className="lbl">Final Payable</td>
                <td className="amt">{money(finalPayable)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="inv-words">
        <b>Amount in words:</b> {amountInWords(finalPayable)}
      </div>

      <div className="inv-footer">
        <div className="inv-terms">
          <b>Terms &amp; conditions</b>
          <br />
          1. Medicines once sold will not be taken back or exchanged.
          <br />
          2. Please check the batch, expiry date and quantity before leaving the counter.
          <br />
          3. This is a computer-generated invoice and does not require a physical signature.
        </div>
        <div className="inv-sign">
          <div className="inv-sign-line"></div>
          Authorised Signatory
        </div>
      </div>

      <div className="inv-thanks">Thank you, visit again!</div>
    </div>
  );
});

export default InvoicePrint;
