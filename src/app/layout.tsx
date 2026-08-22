import type { Metadata } from "next";
import "./globals.css";
import { APP_DESCRIPTION, APP_NAME } from "@/config/constants";
import { AuthProvider } from "@/context/auth-context";
import { Navbar } from "@/components/layout/Navbar";

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
    <html lang="en">
      <body className="antialiased min-h-screen bg-gray-50 text-gray-900 flex flex-col font-sans">
        <AuthProvider>
          <Navbar />
          <div className="flex flex-1 w-full">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
