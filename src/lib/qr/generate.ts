import QRCode from "qrcode";
import { APP_URL } from "@/lib/constants";

/**
 * Generate a QR code PNG buffer pointing to a vehicle's public URL.
 * Uses high error correction (H) for better scanning with vinyl stickers.
 */
export async function generateQrBuffer(
  slug: string,
  size: number = 1200
): Promise<Buffer> {
  const url = `${APP_URL}/${slug}`;

  const buffer = await QRCode.toBuffer(url, {
    type: "png",
    width: size,
    margin: 2,
    errorCorrectionLevel: "H",
    color: {
      dark: "#1B4F72",
      light: "#FFFFFF",
    },
  });

  return buffer;
}

/**
 * Generate a QR code as a data URL (useful for client-side previews).
 */
export async function generateQrDataUrl(slug: string): Promise<string> {
  const url = `${APP_URL}/${slug}`;

  return QRCode.toDataURL(url, {
    width: 400,
    margin: 2,
    errorCorrectionLevel: "H",
    color: {
      dark: "#1B4F72",
      light: "#FFFFFF",
    },
  });
}
