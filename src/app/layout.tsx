import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ThemeProvider, { themeInitScript } from "@/components/ThemeProvider";
import LoadingProvider from "@/components/LoadingProvider";
import LoadingOverlay from "@/components/LoadingOverlay";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Admin - Kriva Pictures",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Runs before paint to avoid a light/dark flash on load */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen bg-bg text-text antialiased">
        <ThemeProvider>
          <LoadingProvider>
            {children}
            <LoadingOverlay />
          </LoadingProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
