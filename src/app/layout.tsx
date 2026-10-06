import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Globale Pare-Brise Maroc | Gestion Atelier & Tiers-Payant",
  description: "Application de gestion pour centre de remplacement de pare-brise au Maroc (Facturation, Stock, Quittances d'Assurance, Bons de Sortie)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-slate-50 text-slate-900 font-sans">
        {children}
      </body>
    </html>
  );
}
