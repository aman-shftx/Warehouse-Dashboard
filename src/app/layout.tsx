import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { SidebarProvider } from "@/components/layout/SidebarContext";
import { SearchProvider } from "@/components/layout/SearchContext";

export const metadata: Metadata = {
  title: "Warehouse Inventory Dashboard",
  description: "Fast read-only warehouse inventory and sourcing mirror",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="bg-slate-50 flex h-screen w-screen overflow-hidden antialiased text-slate-900">
        <SidebarProvider>
          <SearchProvider>
            <Sidebar />
            <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
              <Header />
              <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto overflow-x-hidden">
                {children}
              </main>
            </div>
          </SearchProvider>
        </SidebarProvider>
      </body>
    </html>
  );
}
