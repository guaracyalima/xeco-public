import type { Metadata, Viewport } from "next";
import { Work_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { AnalyticsProvider } from "@/contexts/AnalyticsContext";
import { LikedCompanyProvider } from "@/contexts/LikedCompanyContext";
import { LikedProductProvider } from "@/contexts/LikedProductContext";
import { AnalyticsConsentBanner } from "@/components/analytics/AnalyticsConsentBanner";
import { PWAInstallPrompt } from "@/components/pwa/PWAInstallPrompt";
import { PWARegister } from "@/components/pwa/PWARegister";

const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Xeco - Sistema Público",
  description: "Área pública do sistema Xeco - Gestão e organização",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Xeco",
  },
  applicationName: "Xeco",
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#FB6F72",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
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
                    <PWARegister />
                    {children}
                    <AnalyticsConsentBanner />
                    <PWAInstallPrompt />
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

