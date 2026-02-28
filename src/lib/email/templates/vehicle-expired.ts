import { APP_NAME, APP_URL } from "@/lib/constants";

export function vehicleExpiredEmail(
  name: string,
  brand: string,
  model: string,
  year: number,
  vehicleId: string
): { subject: string; html: string } {
  const vehicleTitle = `${brand} ${model} ${year}`;
  const renewUrl = `${APP_URL}/dashboard/vehicles/${vehicleId}`;

  return {
    subject: `Tu publicación de ${vehicleTitle} ha vencido`,
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
            <h2 style="margin:0 0 16px;color:#E74C3C;font-size:22px;">Tu publicación ha vencido</h2>
            <p style="margin:0 0 16px;color:#4a4a4a;font-size:15px;line-height:1.6;">
              Hola ${name}, la publicación de tu <strong>${vehicleTitle}</strong> ha expirado
              y ya no es visible para los compradores.
            </p>
            <p style="margin:0 0 24px;color:#4a4a4a;font-size:15px;line-height:1.6;">
              ¿Aún no has vendido tu vehículo? Renueva la publicación para volver a aparecer
              en el catálogo y seguir recibiendo visitas.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
              <tr><td style="background-color:#27AE60;border-radius:8px;">
                <a href="${renewUrl}" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:16px;font-weight:bold;text-decoration:none;">
                  Renovar publicación
                </a>
              </td></tr>
            </table>
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
