import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "AeroShield | AI-Powered Flight Delay Insurance",
  description:
    "Get paid before you leave the gate. AI-augmented parametric travel insurance on Flare Network with instant payouts.",
  keywords: [
    "flight insurance",
    "delay protection",
    "parametric insurance",
    "Flare Network",
    "blockchain insurance",
    "AI insurance",
    "travel protection",
  ],
  authors: [{ name: "AeroShield Team" }],
  openGraph: {
    title: "AeroShield | AI-Powered Flight Delay Insurance",
    description: "Get paid before you leave the gate. Instant payouts for flight delays.",
    url: "https://aeroshield.io",
    siteName: "AeroShield",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "AeroShield - Flight Delay Insurance",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AeroShield | AI-Powered Flight Delay Insurance",
    description: "Get paid before you leave the gate. Instant payouts for flight delays.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#E8356D",
          colorBackground: "#0a0a0a",
          colorText: "#ffffff",
          colorInputBackground: "#1a1a1a",
          colorInputText: "#ffffff",
        },
        elements: {
          formButtonPrimary: "bg-gradient-to-r from-[#E8356D] to-[#7B61FF] hover:opacity-90",
          card: "bg-gray-900 border-gray-800",
          headerTitle: "text-white",
          headerSubtitle: "text-gray-400",
          socialButtonsBlockButton: "bg-gray-800 border-gray-700 text-white hover:bg-gray-700",
          formFieldInput: "bg-gray-800 border-gray-700 text-white",
          footerActionLink: "text-[#E8356D] hover:text-[#7B61FF]",
        },
      }}
    >
      <html lang="en" className="dark">
        <body className={`${inter.variable} font-sans antialiased`}>
          <Providers>
            {children}
            <Toaster
              position="bottom-right"
              toastOptions={{
                className: "!bg-gray-900 !text-white !border !border-gray-800",
                duration: 4000,
              }}
            />
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
