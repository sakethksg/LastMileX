import type { Metadata } from "next";
import "./globals.css";
import { APP_DESCRIPTION, APP_NAME } from "@/config/constants";
import { AuthProvider } from "@/context/auth-context";
import { NavProvider } from "@/context/nav-context";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark bg-canvas text-ink">
      <body className="antialiased min-h-screen bg-canvas text-ink flex flex-col font-sans selection:bg-product-terraform selection:text-white">
        <AuthProvider>
          <NavProvider>
            <Navbar />
            <div className="flex flex-1 w-full relative bg-canvas">
              {children}
            </div>
            <Footer />
          </NavProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
