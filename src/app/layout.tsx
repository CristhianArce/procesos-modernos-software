import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tablero de sensores eléctricos",
  description: "Nodos, sensores, lecturas y alertas de una red eléctrica",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
