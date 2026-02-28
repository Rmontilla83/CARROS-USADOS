import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { APP_NAME, APP_URL } from "@/lib/constants";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1B4F72",
};

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — Vende tu carro con QR`,
    template: `%s | ${APP_NAME}`,
  },
  description:
    "Marketplace de vehículos usados en Venezuela. Publica tu carro por $20, recibe un vinil QR profesional y vende más rápido. Barcelona, Puerto La Cruz, Lechería.",
  keywords: [
    "carros usados",
    "vehículos usados Venezuela",
    "venta de carros",
    "QR",
    "Barcelona Anzoátegui",
    "Puerto La Cruz",
    "Lechería",
    "compra venta carros",
  ],
  authors: [{ name: APP_NAME }],
  creator: APP_NAME,
  metadataBase: new URL(APP_URL),
  openGraph: {
    type: "website",
    locale: "es_VE",
    siteName: APP_NAME,
    title: `${APP_NAME} — Vende tu carro con QR`,
    description:
      "Publica tu carro por $20, recibe un vinil QR y deja que los compradores escaneen para ver fotos, precio y detalles.",
    url: APP_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} — Vende tu carro con QR`,
    description:
      "Marketplace de vehículos usados con QR en Venezuela.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
