import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { MobileNav } from "@/components/layout/MobileNav";
import { GlobalSearchProvider } from "@/hooks/useGlobalSearch";
import { AuthProvider } from "@/hooks/useAuth";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Fintellection",
  description:
    "Institutional-grade financial research powered by AI. Interactive charts, real-time data, and agentic analysis.",
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} overflow-x-hidden font-sans antialiased`}
      >
        <NuqsAdapter>
          <TooltipProvider delayDuration={300}>
            <AuthProvider>
              <GlobalSearchProvider>
                <div className="app-shell-height flex min-w-0 w-full overflow-hidden">
                  {/* Sidebar — desktop only, hidden on mobile */}
                  <Sidebar />

                  {/* Main content area */}
                  <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                    <TopBar />
                    <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
                      {children}
                    </main>
                    <MobileNav />
                  </div>
                </div>

                <GlobalSearch />
              </GlobalSearchProvider>
            </AuthProvider>
            <Toaster
              position="bottom-right"
              toastOptions={{
                style: {
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                },
              }}
            />
          </TooltipProvider>
        </NuqsAdapter>
        <Analytics />
      </body>
    </html>
  );
}
