import sharp from "sharp";
import { generateQrBuffer } from "./generate";
import { APP_NAME, APP_URL } from "@/lib/constants";

// 300 DPI dimensions for ~30x20 cm vinyl sticker
const DPI = 300;
const WIDTH_CM = 30;
const HEIGHT_CM = 20;
const WIDTH_PX = Math.round((WIDTH_CM / 2.54) * DPI); // ~3543
const HEIGHT_PX = Math.round((HEIGHT_CM / 2.54) * DPI); // ~2362

const PRIMARY_COLOR = "#1B4F72";
const ACCENT_COLOR = "#27AE60";

interface VinylTemplateInput {
  slug: string;
  brand: string;
  model: string;
  year: number;
  price: number;
}

/**
 * Generate a high-resolution vinyl sticker PNG for printing.
 * Layout: "SE VENDE" header, vehicle info, centered QR code, URL below, branding footer.
 */
export async function generateVinylPng(
  input: VinylTemplateInput
): Promise<Buffer> {
  const { slug, brand, model, year, price } = input;

  // Generate QR code at large size for print quality
  const qrSize = 1200;
  const qrBuffer = await generateQrBuffer(slug, qrSize);

  const vehicleUrl = `${APP_URL}/${slug}`;
  const shortUrl = vehicleUrl.replace(/^https?:\/\//, "");
  const priceFormatted = `$${price.toLocaleString("en-US")}`;
  const vehicleTitle = `${brand} ${model} ${year}`;

  // Build SVG template for text elements
  const svgTemplate = `
    <svg width="${WIDTH_PX}" height="${HEIGHT_PX}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900');
        </style>
      </defs>

      <!-- Background -->
      <rect width="${WIDTH_PX}" height="${HEIGHT_PX}" rx="60" ry="60" fill="white"/>

      <!-- Border -->
      <rect x="20" y="20" width="${WIDTH_PX - 40}" height="${HEIGHT_PX - 40}"
            rx="50" ry="50" fill="none" stroke="${PRIMARY_COLOR}" stroke-width="8"/>

      <!-- Top accent bar -->
      <rect x="20" y="20" width="${WIDTH_PX - 40}" height="280"
            rx="50" ry="50" fill="${PRIMARY_COLOR}"/>
      <rect x="20" y="200" width="${WIDTH_PX - 40}" height="100" fill="${PRIMARY_COLOR}"/>

      <!-- "SE VENDE" header -->
      <text x="${WIDTH_PX / 2}" y="200"
            font-family="Inter, Arial, Helvetica, sans-serif"
            font-weight="900" font-size="180"
            fill="white" text-anchor="middle" letter-spacing="12">
        SE VENDE
      </text>

      <!-- Vehicle title -->
      <text x="${WIDTH_PX / 2}" y="460"
            font-family="Inter, Arial, Helvetica, sans-serif"
            font-weight="700" font-size="100"
            fill="${PRIMARY_COLOR}" text-anchor="middle">
        ${escapeXml(vehicleTitle)}
      </text>

      <!-- Price -->
      <text x="${WIDTH_PX / 2}" y="580"
            font-family="Inter, Arial, Helvetica, sans-serif"
            font-weight="900" font-size="120"
            fill="${ACCENT_COLOR}" text-anchor="middle">
        ${priceFormatted}
      </text>

      <!-- "Escanea el QR" instruction -->
      <text x="${WIDTH_PX / 2}" y="700"
            font-family="Inter, Arial, Helvetica, sans-serif"
            font-weight="400" font-size="56"
            fill="#666666" text-anchor="middle">
        Escanea el código QR para ver fotos y detalles
      </text>

      <!-- URL below QR (positioned after QR area) -->
      <text x="${WIDTH_PX / 2}" y="2040"
            font-family="Inter, Arial, Helvetica, sans-serif"
            font-weight="700" font-size="52"
            fill="${PRIMARY_COLOR}" text-anchor="middle">
        ${escapeXml(shortUrl)}
      </text>

      <!-- Platform branding -->
      <text x="${WIDTH_PX / 2}" y="2200"
            font-family="Inter, Arial, Helvetica, sans-serif"
            font-weight="400" font-size="44"
            fill="#999999" text-anchor="middle">
        Publicado en ${escapeXml(APP_NAME)}
      </text>

      <!-- Accent line at bottom -->
      <rect x="${WIDTH_PX / 2 - 200}" y="2250" width="400" height="6"
            rx="3" fill="${ACCENT_COLOR}"/>
    </svg>
  `;

  // Create the base image from SVG
  const baseImage = sharp(Buffer.from(svgTemplate)).png();

  // Resize QR code to fit within the template
  const qrDisplaySize = 1100;
  const qrResized = await sharp(qrBuffer)
    .resize(qrDisplaySize, qrDisplaySize, { fit: "contain" })
    .png()
    .toBuffer();

  // Composite QR on top of the base template
  const qrLeft = Math.round((WIDTH_PX - qrDisplaySize) / 2);
  const qrTop = 760; // Below the instruction text

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
  input: VinylTemplateInput
): Promise<Buffer> {
  const fullVinyl = await generateVinylPng(input);

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
