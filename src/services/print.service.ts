/**
 * Print Ticket Service
 * Calls GET /api/v1/tickets/:id/print?size=58mm|80mm|a4
 * Returns a fully self-contained HTML page that auto-prints.
 */

import { API_BASE_URL, USE_MOCK_DATA } from "@/lib/config";

export type PrintSize = "58mm" | "80mm" | "a4";

/** Ticket data used to build the mock receipt */
export interface PrintTicketData {
  ticketId: string;
  companyName?: string;
  companyLogo?: string; // base64 data URI or emoji
  passengerName?: string;
  passengerPhone?: string; // already masked e.g. +250788***456
  boardingStop?: string;
  alightingStop?: string;
  departureDate?: string; // e.g. "06 Apr 2026"
  departureTime?: string; // e.g. "06:00 AM"
  seatsCount?: number;
  totalAmount?: string; // e.g. "RWF 3,500"
  paymentMethod?: string; // e.g. "Wallet"
  busPlate?: string | null;
  driverName?: string | null;
  issuedBy?: string | null; // staff-created tickets only
}

export interface PrintTicketOptions {
  ticketId: string;
  size: PrintSize;
  token?: string;
  /** Ticket data for mock mode — ignored in real API mode (server builds the HTML) */
  data?: PrintTicketData;
}

/**
 * Fetch the print HTML for a ticket.
 * Returns the raw HTML string on success.
 * Throws "FORBIDDEN" | "TICKET_NOT_FOUND" | "PRINT_FAILED" on error.
 */
export async function fetchPrintHtml(
  opts: PrintTicketOptions,
): Promise<string> {
  if (USE_MOCK_DATA) {
    return buildMockHtml(opts.size, opts.data ?? { ticketId: opts.ticketId });
  }

  const headers: Record<string, string> = {};
  if (opts.token) headers["Authorization"] = `Bearer ${opts.token}`;

  const res = await fetch(
    `${API_BASE_URL}/tickets/${opts.ticketId}/print?size=${opts.size}`,
    { headers },
  );

  if (res.status === 403) throw new Error("FORBIDDEN");
  if (res.status === 404) throw new Error("TICKET_NOT_FOUND");
  if (!res.ok) throw new Error("PRINT_FAILED");

  return res.text();
}

// ─── Mock HTML builder ────────────────────────────────────────────────────────

function r(label: string, value: string | number | null | undefined): string {
  if (value == null || value === "") return "";
  return `<div class="row"><span class="label">${label}</span><span>${value}</span></div>`;
}

function buildMockHtml(size: PrintSize, d: PrintTicketData): string {
  const widthCss = size === "a4" ? "210mm" : size === "80mm" ? "80mm" : "58mm";
  const qrSize = size === "a4" ? "50mm" : size === "80mm" ? "40mm" : "30mm";
  const pageSize =
    size === "a4" ? "a4" : size === "80mm" ? "80mm auto" : "58mm auto";
  const wrapperStyle = size === "a4" ? "max-width:80mm;margin:20mm auto;" : "";

  // 1×1 transparent PNG — placeholder for logo and QR (server embeds real base64)
  const placeholder =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

  const logoSrc = d.companyLogo?.startsWith("data:")
    ? d.companyLogo
    : placeholder;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Ticket - ${d.ticketId}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Courier New',monospace;font-size:11px;background:#f5f5f5;color:#000;display:flex;justify-content:center;min-height:100vh;padding:20px}
    .receipt-wrapper{${wrapperStyle}width:100%;max-width:${widthCss}}
    .receipt{width:100%;padding:4mm;background:#fff}
    .logo{display:block;max-width:30mm;margin:0 auto 2mm}
    .company-name{text-align:center;font-size:13px;font-weight:bold;margin-bottom:3mm}
    .divider{border-top:1px dashed #000;margin:2mm 0}
    .title{text-align:center;font-size:12px;font-weight:bold;letter-spacing:2px;margin:2mm 0}
    .row{display:flex;justify-content:space-between;margin:1mm 0}
    .label{color:#555}
    .qr-wrapper{text-align:center;margin:3mm 0}
    .qr-wrapper img{width:${qrSize};height:${qrSize}}
    .ticket-id{text-align:center;font-size:9px;color:#555;margin-bottom:3mm}
    .powered-by{text-align:center;font-size:8px;color:#999;margin-top:3mm}
    @media print{
      body{background:#fff;padding:0;margin:0;display:block}
      .receipt-wrapper{margin:0}
      @page{margin:0;size:${pageSize}}
    }
  </style>
</head>
<body>
  <div class="receipt-wrapper">
    <div class="receipt">
      <img class="logo" src="${logoSrc}" alt="${d.companyName ?? "Company"}"/>
      <div class="company-name">${d.companyName ?? "Bus Company"}</div>
      <div class="divider"></div>
      <div class="title">TICKET</div>
      <div class="divider"></div>
      ${r("Passenger", d.passengerName)}
      ${r("Phone", d.passengerPhone)}
      <div class="divider"></div>
      ${r("From", d.boardingStop)}
      ${r("To", d.alightingStop)}
      ${r("Date", d.departureDate)}
      ${r("Time", d.departureTime)}
      <div class="divider"></div>
      ${r("Seats", d.seatsCount)}
      ${r("Amount", d.totalAmount)}
      ${r("Method", d.paymentMethod)}
      <div class="divider"></div>
      ${d.busPlate ? r("Bus", d.busPlate) : ""}
      ${d.driverName ? r("Driver", d.driverName) : ""}
      ${d.issuedBy ? r("Issued by", d.issuedBy) : ""}
      <div class="divider"></div>
      <div class="qr-wrapper">
        <img src="${placeholder}" alt="Scan to verify ticket"/>
      </div>
      <div class="ticket-id">${d.ticketId}</div>
      <div class="divider"></div>
      <div class="powered-by">powered by katisha online</div>
    </div>
  </div>
  <script>window.onload=function(){window.print()}</script>
</body>
</html>`;
}
