
import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SessionProvider } from "@/context/session-context";
import { UserProvider } from "@/contexts/UserContext";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Mapa Político",
  description: "Plataforma para líderes políticos gerenciarem suas bases, missões e comunicação.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased")}>
        <SessionProvider>
            <UserProvider>
                {children}
                <Toaster />
            </UserProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
