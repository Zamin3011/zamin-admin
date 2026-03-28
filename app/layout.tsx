import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Zamin Admin",
  description: "Admin Dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-100">
        <div className="flex h-screen overflow-hidden">

          {/* Sidebar */}
          <aside className="w-64 bg-gray-900 text-white p-5 flex flex-col">
            <h1 className="text-xl font-bold mb-8">Zamin Admin</h1>

            <nav className="space-y-2">

              <Link href="/">
                <div className="px-3 py-2 rounded hover:bg-gray-800 cursor-pointer">
                  Dashboard
                </div>
              </Link>

              <Link href="/devices">
                <div className="px-3 py-2 rounded hover:bg-gray-800 cursor-pointer">
                  Devices
                </div>
              </Link>

              <Link href="/distributors">
                <div className="px-3 py-2 rounded hover:bg-gray-800 cursor-pointer">
                  Distributors
                </div>
              </Link>

            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 p-6 overflow-y-auto">
            {children}
          </main>

        </div>
      </body>
    </html>
  );
}