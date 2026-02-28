import { APP_NAME, APP_URL } from "@/lib/constants";

export function vehiclePublishedEmail(
  name: string,
  brand: string,
  model: string,
  year: number,
  slug: string
): { subject: string; html: string } {
  const vehicleTitle = `${brand} ${model} ${year}`;
  const vehicleUrl = `${APP_URL}/${slug}`;

  return {
    subject: `Tu ${vehicleTitle} fue publicado`,
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;">
        <tr>
          <td style="background-color:#1B4F72;padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:bold;">${APP_NAME}</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <h2 style="margin:0 0 16px;color:#27AE60;font-size:22px;">¡Tu vehículo fue publicado!</h2>
            <p style="margin:0 0 16px;color:#4a4a4a;font-size:15px;line-height:1.6;">
              Hola ${name}, tu <strong>${vehicleTitle}</strong> ya está visible para los compradores.
              La publicación estará activa por 60 días.
            </p>
            <p style="margin:0 0 24px;color:#4a4a4a;font-size:15px;line-height:1.6;">
              Comparte el enlace de tu vehículo o espera tu vinil QR para pegarlo en el carro.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
              <tr><td style="background-color:#27AE60;border-radius:8px;">
                <a href="${vehicleUrl}" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:16px;font-weight:bold;text-decoration:none;">
                  Ver mi publicación
                </a>
              </td></tr>
            </table>
            <p style="margin:24px 0 0;color:#9ca3af;font-size:13px;text-align:center;">
              Enlace directo: ${vehicleUrl}
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 40px;border-top:1px solid #e5e7eb;text-align:center;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">
              ${APP_NAME} — Tu carro es tu mejor vitrina
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  };
}
