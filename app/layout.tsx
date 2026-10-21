import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/context/AuthContext";
import { SubscriptionProvider } from "@/lib/context/SubscriptionContext";
import { InvoiceStoreProvider } from "@/lib/store/invoiceStore";
import { SettingsStoreProvider } from "@/lib/store/settingsStore";

export const metadata: Metadata = {
  title: "IziFacture — Solution SaaS de Facturation B2B",
  description: "La solution de facturation et de gestion commerciale B2B de référence pour l'Afrique francophone (UEMOA & CEMAC).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full antialiased dark">
      <body className="min-h-screen bg-[#0B0C10] text-slate-100 selection:bg-[#D4AF37] selection:text-black">
        <AuthProvider>
          {/* Providers globaux : 1 seule initialisation, 0 requête réseau lors des navigations */}
          <SubscriptionProvider>
            <InvoiceStoreProvider>
              <SettingsStoreProvider>
                {children}
              </SettingsStoreProvider>
            </InvoiceStoreProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
