import { APP_NAME, APP_URL } from "@/lib/constants";

export function alertMatchEmail(
  name: string,
  alertLabel: string,
  vehicleTitle: string,
  price: number,
  slug: string,
  unsubscribeToken: string
): { subject: string; html: string } {
  const vehicleUrl = `${APP_URL}/${slug}`;
  const unsubscribeUrl = `${APP_URL}/api/alerts/unsubscribe?token=${unsubscribeToken}`;
  const formattedPrice = price.toLocaleString("en-US");

  return {
    subject: `Nuevo vehículo: ${vehicleTitle} — $${formattedPrice}`,
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
            <p style="margin:0 0 8px;color:#9ca3af;font-size:12px;text-transform:uppercase;letter-spacing:1px;">
              Alerta: ${alertLabel}
            </p>
            <h2 style="margin:0 0 16px;color:#1B4F72;font-size:22px;">
              ${vehicleTitle}
            </h2>
            <p style="margin:0 0 8px;color:#27AE60;font-size:28px;font-weight:bold;">
              $${formattedPrice}
            </p>
            <p style="margin:0 0 24px;color:#4a4a4a;font-size:15px;line-height:1.6;">
              Hola ${name}, se acaba de publicar un vehículo que coincide con tu alerta
              <strong>"${alertLabel}"</strong>. Haz clic abajo para verlo.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
              <tr><td style="background-color:#27AE60;border-radius:8px;">
                <a href="${vehicleUrl}" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:16px;font-weight:bold;text-decoration:none;">
                  Ver vehículo
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
            <p style="margin:0 0 8px;color:#9ca3af;font-size:12px;">
              ${APP_NAME} — Tu carro es tu mejor vitrina
            </p>
            <a href="${unsubscribeUrl}" style="color:#9ca3af;font-size:11px;text-decoration:underline;">
              Pausar esta alerta
            </a>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  };
}
