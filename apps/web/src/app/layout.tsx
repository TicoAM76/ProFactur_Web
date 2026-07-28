import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "FacturTaller | Gestión integral para talleres",
    template: "%s | FacturTaller",
  },
  description:
    "Gestión integral para talleres. Del vehículo a la factura, todo bajo control. Una solución de RN Soluciones Digitales.",
  applicationName: "FacturTaller",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      {
        url: "/brand/favicon.ico",
        sizes: "any",
      },
      {
        url: "/brand/facturtaller-symbol.svg",
        type: "image/svg+xml",
      },
      {
        url: "/brand/icon-32.png",
        sizes: "32x32",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/brand/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
