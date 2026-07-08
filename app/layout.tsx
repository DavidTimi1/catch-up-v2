import type { Metadata } from "next";
import { Inter, Kalam } from "next/font/google";
import "./globals.css";
import { ModalProvider } from "@/components/providers/modal-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ToastProvider } from "@/components/providers/toast-provider";
import { OfflineBanner } from "@/components/OfflineBanner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const kalam = Kalam({
  weight: ["300", "400", "700"],
  subsets: ["latin"],
  variable: "--font-kalam",
});

const SITEURL = process.env.NODE_ENV === 'development'? "http://localhost:3000" : process.env.NEXT_PUBLIC_SITEURL || undefined;

export const metadata: Metadata = {
  metadataBase: SITEURL,
  title: "Catchup",
  description: "AI-powered note walkthroughs at your speed.",
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png"
  },
  openGraph: {
    title: "Catchup",
    description: "AI-powered note walkthroughs at your speed.",
    siteName: "Catchup",
    images: [{url: "/banner-image.png"}, {url: "/main-image.png"}]
  },
  twitter: {
    card: "summary_large_image",
    site: "@davidtimi_1",
    creator: "@davidtimi_1",
    images: "/banner-image.png"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${kalam.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans text-stone-900 bg-transparent transition-colors">
        <ThemeProvider
          attribute="class"
          enableSystem
          enableColorScheme
          disableTransitionOnChange
        >
          <ToastProvider>
            <ModalProvider>
              <OfflineBanner />
              {children}
            </ModalProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
