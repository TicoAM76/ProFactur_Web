import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Profactur DEMO | Gestión y facturación",
  description:
    "Entorno demostrativo de Profactur para gestión de facturas, clientes y vehículos.",
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
