"use client";

import "./globals.css";
import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export const metadata = {
  title: "Zamin Admin",
  description: "Admin Dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (!u) {
        router.push("/login");
      } else {
        setUser(u);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <html lang="en">
      <body className="bg-gray-100">

        {/* Wait until auth is checked */}
        {!user ? null : (
          <div className="flex h-screen overflow-hidden">

            {/* Sidebar */}
            <aside className="w-64 bg-gray-900 text-white p-5 flex flex-col">
              <h1 className="text-xl font-bold mb-8">
                Zamin Admin
              </h1>

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

              {/* 🔴 Logout Button */}
              <button
                onClick={() => signOut(auth)}
                className="mt-auto bg-red-600 hover:bg-red-700 text-white p-2 rounded"
              >
                Logout
              </button>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6 overflow-y-auto">
              {children}
            </main>

          </div>
        )}

      </body>
    </html>
  );
}
