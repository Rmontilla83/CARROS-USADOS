import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "CarrosUsados - Vende tu carro con QR",
    template: "%s | CarrosUsados",
  },
  description:
    "Marketplace de vehículos usados en Venezuela. Publica tu carro, recibe un QR y vende más rápido.",
  keywords: [
    "carros usados",
    "vehículos",
    "Venezuela",
    "QR",
    "venta de carros",
    "Barcelona",
    "Anzoátegui",
  ],
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
