import type { Metadata, Viewport } from "next";
import { Lexend } from "next/font/google";
import { DisplaySettings } from "@/components/display-settings";
import { PREFS_SCRIPT } from "@/lib/display-prefs";
import { PageTranslator } from "@/components/page-translator";
import { CurriculumLoader } from "@/components/curriculum-loader";
import "./globals.css";

// Loaded up front but only used when "Easy-read font" is on (see globals.css).
const lexend = Lexend({ subsets: ["latin"], variable: "--font-lexend", display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "Coding in Color — Learn",
    template: "%s · Coding in Color",
  },
  description:
    "Self-paced computer science and AI lessons from Coding in Color. Join with a class code — no account needed.",
};

export const viewport: Viewport = {
  themeColor: "#007A3D",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // data-* display attributes are set by PREFS_SCRIPT before React hydrates.
    <html lang="en" className={lexend.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: PREFS_SCRIPT }} />
      </head>
      <body className="min-h-dvh antialiased">
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        <CurriculumLoader />
        {children}
        <DisplaySettings />
        <PageTranslator />
      </body>
    </html>
  );
}
