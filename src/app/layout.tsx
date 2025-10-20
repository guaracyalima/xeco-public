import type { Metadata } from "next";
import { Work_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { AnalyticsProvider } from "@/contexts/AnalyticsContext";
import { LikedCompanyProvider } from "@/contexts/LikedCompanyContext";
import { LikedProductProvider } from "@/contexts/LikedProductContext";
import { AnalyticsConsentBanner } from "@/components/analytics/AnalyticsConsentBanner";

const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Xeco - Sistema Público",
  description: "Área pública do sistema Xeco - Gestão e organização",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${workSans.variable} font-sans antialiased`}>
        <AuthProvider>
          <AnalyticsProvider>
            <FavoritesProvider>
              <LikedCompanyProvider>
                <LikedProductProvider>
                  <CartProvider>
                    {children}
                    <AnalyticsConsentBanner />
                  </CartProvider>
                </LikedProductProvider>
              </LikedCompanyProvider>
            </FavoritesProvider>
          </AnalyticsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

