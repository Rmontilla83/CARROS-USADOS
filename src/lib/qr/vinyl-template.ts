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
  brand: string;
  model: string;
  year: number;
  price: number;
}

type VinylFormat = "square" | "rectangular";

/**
 * Generate a high-resolution vinyl sticker PNG for microperforated printing.
 * Square (65x65cm): 2 per 1.30m roll width, 0% waste.
 * Rectangular (65x43cm): 3 per 1.30m roll width, for panoramic rear windows.
 *
 * Layout (top to bottom):
 * - "SE VENDE" in ultra bold, minimum 5cm tall
 * - QR code occupying ~70% of space (~45x45cm), black on pure white
 * - Portal URL in readable text
 *
 * High contrast: pure black #000000 QR on pure white #FFFFFF for max readability with microperforated vinyl.
 */
export async function generateVinylPng(
  input: VinylTemplateInput,
  format: VinylFormat = "square"
): Promise<Buffer> {
  const { slug, brand, model, year, price } = input;

  const WIDTH_PX = format === "square" ? SQUARE_WIDTH_PX : RECT_WIDTH_PX;
  const HEIGHT_PX = format === "square" ? SQUARE_HEIGHT_PX : RECT_HEIGHT_PX;

  // QR takes ~70% of the available space
  const qrSize = format === "square"
    ? Math.round(WIDTH_PX * 0.68)  // ~5220px for square (~44cm)
    : Math.round(Math.min(WIDTH_PX, HEIGHT_PX) * 0.65); // for rectangular

  // Generate QR code at maximum size for print quality
  const qrBuffer = await generateQrBuffer(slug, qrSize);

  const vehicleUrl = `${APP_URL}/${slug}`;
  const shortUrl = vehicleUrl.replace(/^https?:\/\//, "");

  // "SE VENDE" text height: minimum 5cm = ~590px at 300DPI
  const seVendeFontSize = format === "square" ? 500 : 380;
  const urlFontSize = format === "square" ? 160 : 120;

  // Layout vertical positions
  const seVendeY = format === "square"
    ? CUT_MARGIN_PX + 600
    : CUT_MARGIN_PX + 450;

  const qrTop = format === "square"
    ? seVendeY + 200
    : seVendeY + 120;

  const urlY = format === "square"
    ? qrTop + qrSize + 300
    : qrTop + qrSize + 200;

  // Build SVG template — pure white background, pure black text, maximum contrast
  const svgTemplate = `
    <svg width="${WIDTH_PX}" height="${HEIGHT_PX}" xmlns="http://www.w3.org/2000/svg">
      <!-- Pure white background -->
      <rect width="${WIDTH_PX}" height="${HEIGHT_PX}" fill="#FFFFFF"/>

      <!-- Cut margin guides (very light, won't print on vinyl) -->
      <rect x="${CUT_MARGIN_PX}" y="${CUT_MARGIN_PX}"
            width="${WIDTH_PX - CUT_MARGIN_PX * 2}" height="${HEIGHT_PX - CUT_MARGIN_PX * 2}"
            fill="none" stroke="#EEEEEE" stroke-width="2" stroke-dasharray="20,10"/>

      <!-- "SE VENDE" header — ultra bold, pure black for max visibility -->
      <text x="${WIDTH_PX / 2}" y="${seVendeY}"
            font-family="Arial Black, Impact, Arial, Helvetica, sans-serif"
            font-weight="900" font-size="${seVendeFontSize}"
            fill="#000000" text-anchor="middle" letter-spacing="30">
        SE VENDE
      </text>

      <!-- URL below QR -->
      <text x="${WIDTH_PX / 2}" y="${urlY}"
            font-family="Arial, Helvetica, sans-serif"
            font-weight="700" font-size="${urlFontSize}"
            fill="#000000" text-anchor="middle">
        ${escapeXml(shortUrl)}
      </text>
    </svg>
  `;

  // Create the base image from SVG
  const baseImage = sharp(Buffer.from(svgTemplate)).png();

  // Resize QR code — pure black on transparent/white background
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
