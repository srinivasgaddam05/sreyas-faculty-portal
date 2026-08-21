import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SREYAS - Faculty Knowledge Portal",
  description: "Institutional knowledge assistant for SREYAS faculty",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
