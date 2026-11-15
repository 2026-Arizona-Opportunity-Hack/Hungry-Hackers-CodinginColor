import type { Metadata, Viewport } from "next";
import { CurriculumLoader } from "@/components/curriculum-loader";
import "./globals.css";

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
    <html lang="en">
      <body className="min-h-dvh antialiased">
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        <CurriculumLoader />
        {children}
      </body>
    </html>
  );
}
