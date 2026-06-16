/**
 * Print Ticket Service
 * Calls GET /api/v1/tickets/:id/print?size=58mm|80mm|a4
 * Falls back to locally generated HTML if API is unavailable
 */

import { API_BASE_URL } from "@/lib/config";
import { authFetch, parseErrorResponse } from "./auth.service";
import { Booking } from "@/lib/api";
import QRCode from "qrcode";

export type PrintSize = "58mm" | "80mm" | "a4";

export interface PrintTicketOptions {
  ticketId: string;
  size: PrintSize;
  token?: string;
  booking?: Booking;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
}

async function generateLocalPrintHtml(options: PrintTicketOptions & { booking?: Booking }): Promise<string> {
  const { size, booking, ticketId } = options;
  const bookingRef = `KAT-${ticketId.slice(-4).toUpperCase()}`;
  
  let widthCss: string;
  let qrSizeCss: string;
  let pageCss: string;
  
  switch (size) {
    case "58mm":
      widthCss = "width: 58mm;";
      qrSizeCss = "width: 30mm; height: 30mm;";
      pageCss = "@page { margin: 0; size: 58mm auto; }";
      break;
    case "80mm":
      widthCss = "width: 80mm;";
      qrSizeCss = "width: 40mm; height: 40mm;";
      pageCss = "@page { size: 80mm auto; }";
      break;
    case "a4":
      widthCss = "width: 210mm;";
      qrSizeCss = "width: 50mm; height: 50mm;";
      pageCss = "@page { size: a4; }";
      break;
  }

  // QR code content: simple ticket ID for operators to scan and identify the ticket
  const qrData = `katisha-ticket:${ticketId}`;

  let qrImageData = "";
  try {
    // Generate SVG QR code first, then convert to base64 data URL
    const svgString = await QRCode.toString(qrData, { type: "svg", width: 200 });
    // Encode SVG to base64
    const base64Svg = btoa(unescape(encodeURIComponent(svgString)));
    qrImageData = `data:image/svg+xml;base64,${base64Svg}`;
  } catch (error) {
    console.error("QR code generation failed:", error);
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ticket - ${bookingRef}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Courier New', monospace; 
      font-size: 11px; 
      background: #fff; 
      color: #000; 
      ${widthCss}
    }
    .receipt-wrapper { ${size === "a4" ? "max-width: 80mm; margin: 20mm auto;" : ""} }
    .receipt { width: 100%; padding: 4mm; }
    .logo { display: block; max-width: 30mm; margin: 0 auto 2mm; }
    .company-name { text-align: center; font-size: 13px; font-weight: bold; margin-bottom: 3mm; }
    .divider { border-top: 1px dashed #000; margin: 2mm 0; }
    .title { text-align: center; font-size: 12px; font-weight: bold; letter-spacing: 2px; margin: 2mm 0; }
    .row { display: flex; justify-content: space-between; margin: 1mm 0; }
    .label { color: #555; }
    .qr-wrapper { text-align: center; margin: 3mm 0; }
    .qr-wrapper img { ${qrSizeCss} }
    .ticket-id { text-align: center; font-size: 9px; color: #555; margin-bottom: 3mm; }
    .powered-by { text-align: center; font-size: 8px; color: #999; margin-top: 3mm; }
    @media print {
      body { margin: 0; }
      ${pageCss}
    }
  </style>
</head>
<body>
  <div class="receipt-wrapper">
    <div class="receipt">
      <div class="company-name">${booking?.trip?.operator || "Katisha"}</div>
      <div class="divider"></div>
      <div class="title">TICKET</div>
      <div class="divider"></div>
      <div class="row">
        <span class="label">Passenger</span>
        <span>${booking?.passenger?.fullName || "Passenger"}</span>
      </div>
      <div class="row">
        <span class="label">Phone</span>
        <span>${booking?.passenger?.phone || "-"}</span>
      </div>
      ${booking?.passenger?.email ? `
      <div class="row">
        <span class="label">Email</span>
        <span>${booking.passenger.email}</span>
      </div>` : ""}
      <div class="divider"></div>
      <div class="row">
        <span class="label">From</span>
        <span>${booking?.trip?.from?.city || booking?.trip?.from?.name || "-"}</span>
      </div>
      <div class="row">
        <span class="label">To</span>
        <span>${booking?.trip?.to?.city || booking?.trip?.to?.name || "-"}</span>
      </div>
      <div class="row">
        <span class="label">Date</span>
        <span>${booking?.trip?.departureTime ? formatDate(booking.trip.departureTime) : "-"}</span>
      </div>
      <div class="row">
        <span class="label">Time</span>
        <span>${booking?.trip?.departureTime ? formatTime(booking.trip.departureTime) : "-"}</span>
      </div>
      <div class="divider"></div>
      <div class="row">
        <span class="label">Seats</span>
        <span>${booking?.seatNumber || "1"}</span>
      </div>
      <div class="row">
        <span class="label">Amount</span>
        <span>${booking?.currency || "RWF"} ${(booking?.totalPaid || 0).toLocaleString()}</span>
      </div>
      ${booking?.trip?.busType ? `
      <div class="row">
        <span class="label">Bus Type</span>
        <span>${booking.trip.busType}</span>
      </div>` : ""}
      <div class="divider"></div>
      <div class="qr-wrapper">
        <img src="${qrImageData}" alt="Ticket QR Code" />
      </div>
      <div class="ticket-id">${bookingRef}</div>
      <div class="divider"></div>
      <div class="powered-by">powered by katisha online</div>
    </div>
  </div>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;
}

export async function fetchPrintHtml(
  opts: PrintTicketOptions,
): Promise<string> {
  const url = `${API_BASE_URL}/tickets/${opts.ticketId}/print?size=${opts.size}`;
  console.log("fetchPrintHtml URL:", url);
  console.log("fetchPrintHtml token present:", !!opts.token);
  
  try {
    const res = await authFetch(
      url,
      {},
      opts.token,
    );

    console.log("fetchPrintHtml response status:", res.status);

    if (res.status === 403) throw new Error("FORBIDDEN");
    if (res.status === 404) throw new Error("TICKET_NOT_FOUND");
    if (!res.ok) throw await parseErrorResponse(res);

    const html = await res.text();
    console.log("fetchPrintHtml HTML length:", html.length);
    return html;
  } catch (error) {
    console.log("API failed, generating local HTML:", error);
    return generateLocalPrintHtml(opts);
  }
}
