import sharp from "sharp";
import { generateQrBuffer } from "./generate";
import { APP_URL } from "@/lib/constants";

// 300 DPI dimensions for 65x65 cm square vinyl (microperforated roll)
const DPI = 300;

// Square format: 65x65 cm — 2 pieces per 1.30m wide roll, 0% waste
const SQUARE_WIDTH_CM = 65;
const SQUARE_HEIGHT_CM = 65;
const SQUARE_WIDTH_PX = Math.round((SQUARE_WIDTH_CM / 2.54) * DPI); // ~7677
const SQUARE_HEIGHT_PX = Math.round((SQUARE_HEIGHT_CM / 2.54) * DPI); // ~7677

// Rectangular format: 65x43 cm — 3 pieces per 1.30m wide roll (for panoramic rear windows)
const RECT_WIDTH_CM = 65;
const RECT_HEIGHT_CM = 43;
const RECT_WIDTH_PX = Math.round((RECT_WIDTH_CM / 2.54) * DPI); // ~7677
const RECT_HEIGHT_PX = Math.round((RECT_HEIGHT_CM / 2.54) * DPI); // ~5079

// Cut margin: 5mm per side
const CUT_MARGIN_PX = Math.round((0.5 / 2.54) * DPI); // ~59px

interface VinylTemplateInput {
  slug: string;
}

type VinylFormat = "square" | "rectangular";

/**
 * Generate a high-resolution vinyl sticker PNG for microperforated printing.
 *
 * Clean professional design:
 * - Top accent bar (#1B4F72)
 * - "SE VENDE" in brand color
 * - QR code occupying ~75% of space (maximized for scannability)
 * - Website URL (not vehicle URL — forces buyer to scan QR)
 * - Bottom accent bar
 */
export async function generateVinylPng(
  input: VinylTemplateInput,
  format: VinylFormat = "square"
): Promise<Buffer> {
  const { slug } = input;

  const WIDTH_PX = format === "square" ? SQUARE_WIDTH_PX : RECT_WIDTH_PX;
  const HEIGHT_PX = format === "square" ? SQUARE_HEIGHT_PX : RECT_HEIGHT_PX;

  // QR takes ~75% of available width (bigger now without vehicle info)
  const qrSize = format === "square"
    ? Math.round(WIDTH_PX * 0.73)
    : Math.round(Math.min(WIDTH_PX, HEIGHT_PX) * 0.70);

  // Generate QR code at maximum size for print quality
  const qrBuffer = await generateQrBuffer(slug, qrSize);

  const siteUrl = APP_URL.replace(/^https?:\/\//, "");
  const accentColor = "#1B4F72";
  const barHeight = Math.round(HEIGHT_PX * 0.012);

  // Font sizes
  const seVendeFontSize = format === "square" ? 520 : 400;
  const urlFontSize = format === "square" ? 180 : 140;

  // Layout vertical positions
  const seVendeY = format === "square"
    ? barHeight + CUT_MARGIN_PX + 650
    : barHeight + CUT_MARGIN_PX + 480;

  const divider1Y = seVendeY + 120;

  const qrTop = format === "square"
    ? divider1Y + 120
    : divider1Y + 80;

  const divider2Y = qrTop + qrSize + (format === "square" ? 120 : 80);
  const urlY = divider2Y + (format === "square" ? 250 : 200);

  // Build SVG template
  const svgTemplate = `
    <svg width="${WIDTH_PX}" height="${HEIGHT_PX}" xmlns="http://www.w3.org/2000/svg">
      <!-- Pure white background -->
      <rect width="${WIDTH_PX}" height="${HEIGHT_PX}" fill="#FFFFFF"/>

      <!-- Top accent bar -->
      <rect width="${WIDTH_PX}" height="${barHeight}" fill="${accentColor}"/>

      <!-- Cut margin guides -->
      <rect x="${CUT_MARGIN_PX}" y="${CUT_MARGIN_PX}"
            width="${WIDTH_PX - CUT_MARGIN_PX * 2}" height="${HEIGHT_PX - CUT_MARGIN_PX * 2}"
            fill="none" stroke="#EEEEEE" stroke-width="2" stroke-dasharray="20,10"/>

      <!-- "SE VENDE" header -->
      <text x="${WIDTH_PX / 2}" y="${seVendeY}"
            font-family="Arial Black, Impact, Arial, Helvetica, sans-serif"
            font-weight="900" font-size="${seVendeFontSize}"
            fill="${accentColor}" text-anchor="middle" letter-spacing="40">
        SE VENDE
      </text>

      <!-- Divider line 1 -->
      <line x1="${WIDTH_PX * 0.15}" y1="${divider1Y}"
            x2="${WIDTH_PX * 0.85}" y2="${divider1Y}"
            stroke="#E5E7EB" stroke-width="4"/>

      <!-- Divider line 2 -->
      <line x1="${WIDTH_PX * 0.15}" y1="${divider2Y}"
            x2="${WIDTH_PX * 0.85}" y2="${divider2Y}"
            stroke="#E5E7EB" stroke-width="4"/>

      <!-- Site URL -->
      <text x="${WIDTH_PX / 2}" y="${urlY}"
            font-family="Arial, Helvetica, sans-serif"
            font-weight="700" font-size="${urlFontSize}"
            fill="${accentColor}" text-anchor="middle" letter-spacing="8">
        ${escapeXml(siteUrl)}
      </text>

      <!-- Bottom accent bar -->
      <rect y="${HEIGHT_PX - barHeight}" width="${WIDTH_PX}" height="${barHeight}" fill="${accentColor}"/>
    </svg>
  `;

  // Create the base image from SVG
  const baseImage = sharp(Buffer.from(svgTemplate)).png();

  // Resize QR code
  const qrResized = await sharp(qrBuffer)
    .resize(qrSize, qrSize, { fit: "contain" })
    .png()
    .toBuffer();

  // Center QR horizontally
  const qrLeft = Math.round((WIDTH_PX - qrSize) / 2);

  // Composite QR on top of the base template
  const finalImage = await baseImage
    .composite([
      {
        input: qrResized,
        left: qrLeft,
        top: qrTop,
      },
    ])
    .png({ quality: 100 })
    .toBuffer();

  return finalImage;
}

/**
 * Generate a lower-resolution preview of the vinyl for dashboard display.
 */
export async function generateVinylPreview(
  input: VinylTemplateInput,
  format: VinylFormat = "square"
): Promise<Buffer> {
  const fullVinyl = await generateVinylPng(input, format);

  // Scale down for web preview (~600px wide)
  return sharp(fullVinyl)
    .resize(600, null, { fit: "inside" })
    .png()
    .toBuffer();
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
