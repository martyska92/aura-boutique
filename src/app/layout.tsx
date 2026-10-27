import type { Metadata, Viewport } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";

const playfair = Playfair_Display({
  subsets: ["latin", "latin-ext"],
  variable: "--font-serif",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "AURA Boutique K.B. | Ekskluzywna Odzież Damska",
  description:
    "AURA Boutique K.B. - wyjątkowy butik z damską odzieżą. Odkryj kolekcje sukienek, kompletów, swetrów, okryć i dodatków. Butik w Żmigrodzie i sklep online.",
  keywords: [
    "AURA Boutique",
    "AURA Boutique K.B.",
    "odzież damska Żmigród",
    "sukienki damskie",
    "komplety damskie",
    "elegancka odzież damska",
    "butik online",
  ],
  authors: [{ name: "AURA Boutique K.B." }],
  icons: {
    icon: "/images/brand/aura-logo.png",
    shortcut: "/images/brand/aura-logo.png",
    apple: "/images/brand/aura-logo.png",
  },
  openGraph: {
    title: "AURA Boutique K.B. | Ekskluzywna Odzież Damska",
    description: "Styl, który zachwyca, ceny, które kuszą — jakość, którą poczujesz. Butik w Żmigrodzie i sklep online.",
    images: ["/images/brand/aura-logo.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl" className={`${playfair.variable} ${jakarta.variable}`}>
      <body className="min-h-screen flex flex-col bg-[#FAF6F1] text-[#241D1B] antialiased selection:bg-[#ECCDC7] selection:text-[#542823]">
        <CartProvider>
          <div className="flex flex-col min-h-screen">
            {children}
          </div>
        </CartProvider>
      </body>
    </html>
  );
}
