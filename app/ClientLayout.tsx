"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter, usePathname } from "next/navigation";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const pathname = usePathname();

  // 🔐 Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 🚀 Handle redirects SAFELY
  useEffect(() => {
    if (!loading) {
      // Not logged in → go to login
      if (!user && pathname !== "/login") {
        router.push("/login");
      }

      // Logged in → block login page
      if (user && pathname === "/login") {
        router.push("/");
      }
    }
  }, [user, loading, pathname]);

  // ⏳ Loading state
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Checking authentication...</p>
      </div>
    );
  }

  // 🚫 Not logged in → only show login page
  if (!user) {
    return <>{children}</>;
  }

  // ✅ Logged in UI
  return (
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

        {/* Logout */}
        <button
          onClick={() => signOut(auth)}
          className="mt-auto bg-red-600 hover:bg-red-700 text-white p-2 rounded"
        >
          Logout
        </button>
      </aside>

      {/* Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        {children}
      </main>

    </div>
  );
}
