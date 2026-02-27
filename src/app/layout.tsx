import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";
import { getSystemSettings } from "@/lib/settings";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const settings = getSystemSettings();
  return {
    title: settings.general.appName || "IT Support",
    description: settings.general.companyName ? `${settings.general.companyName} IT Ticketing Support` : "IT Ticketing Support Information System",
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = getSystemSettings();

  return (
    <html lang={settings.general?.language || "id"} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof Node === 'function' && Node.prototype) {
                const originalRemoveChild = Node.prototype.removeChild;
                Node.prototype.removeChild = function(child) {
                  if (child.parentNode !== this) {
                    if (console) {
                      console.warn('Cannot remove a child from a different parent', child, this);
                    }
                    return child;
                  }
                  return originalRemoveChild.apply(this, arguments);
                };
                
                const originalInsertBefore = Node.prototype.insertBefore;
                Node.prototype.insertBefore = function(newNode, referenceNode) {
                  if (referenceNode && referenceNode.parentNode !== this) {
                    if (console) {
                      console.warn('Cannot insert before a reference node from a different parent', referenceNode, this);
                    }
                    return newNode;
                  }
                  return originalInsertBefore.apply(this, arguments);
                };
              }
            `,
          }}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <Providers settings={settings}>
          {children}
          <Toaster position="top-right" richColors />
        </Providers>
      </body>
    </html>
  );
}
