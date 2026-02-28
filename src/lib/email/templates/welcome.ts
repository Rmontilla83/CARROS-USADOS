import { APP_NAME, APP_URL } from "@/lib/constants";

export function welcomeEmail(name: string): { subject: string; html: string } {
  return {
    subject: `Bienvenido a ${APP_NAME}`,
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;">
        <!-- Header -->
        <tr>
          <td style="background-color:#1B4F72;padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:bold;">${APP_NAME}</h1>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <h2 style="margin:0 0 16px;color:#1B4F72;font-size:22px;">¡Bienvenido, ${name}!</h2>
            <p style="margin:0 0 16px;color:#4a4a4a;font-size:15px;line-height:1.6;">
              Ya eres parte de la plataforma de venta de vehículos usados más innovadora de Venezuela.
              Tu carro es tu mejor vitrina, y nosotros te ayudamos a mostrarlo.
            </p>
            <p style="margin:0 0 24px;color:#4a4a4a;font-size:15px;line-height:1.6;">
              Publica tu vehículo en minutos, recibe un vinil QR profesional y deja que los compradores
              te encuentren escaneando desde la calle.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
              <tr><td style="background-color:#27AE60;border-radius:8px;">
                <a href="${APP_URL}/dashboard/publish" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:16px;font-weight:bold;text-decoration:none;">
                  Publicar mi carro
                </a>
              </td></tr>
            </table>
          </td>
        </tr>
        <!-- Footer -->
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
