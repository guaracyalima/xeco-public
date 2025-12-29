import type { Metadata, Viewport } from "next";
import { Work_Sans } from "next/font/google";
import "./globals.css";
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { AnalyticsProvider } from "@/contexts/AnalyticsContext";
import { LikedCompanyProvider } from "@/contexts/LikedCompanyContext";
import { LikedProductProvider } from "@/contexts/LikedProductContext";
import { LocationProvider } from "@/contexts/LocationContext";
import { AnalyticsConsentBanner } from "@/components/analytics/AnalyticsConsentBanner";
import { PWAInstallPrompt } from "@/components/pwa/PWAInstallPrompt";
import { PWARegister } from "@/components/pwa/PWARegister";
import { DeepLinkHandler } from "@/components/DeepLinkHandler";
import { ToastContainer } from 'react-toastify';

const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Xuxum - Sistema Público",
  description: "Área pública do sistema Xuxum - Gestão e organização",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Xuxum",
  },
  applicationName: "Xuxum",
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
          <LocationProvider>
            <AnalyticsProvider>
              <FavoritesProvider>
                <LikedCompanyProvider>
                  <LikedProductProvider>
                    <CartProvider>
                      <PWARegister />
                      <DeepLinkHandler />
                      {children}
                      <AnalyticsConsentBanner />
                      <PWAInstallPrompt />
                      <ToastContainer
                        position="top-right"
                        autoClose={3000}
                        hideProgressBar={false}
                        newestOnTop
                        closeOnClick
                        rtl={false}
                        pauseOnFocusLoss
                        draggable
                        pauseOnHover
                        theme="light"
                        className="toast-container"
                      />
                    </CartProvider>
                  </LikedProductProvider>
                </LikedCompanyProvider>
              </FavoritesProvider>
            </AnalyticsProvider>
          </LocationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

