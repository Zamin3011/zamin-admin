"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const login = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/");
    } catch (err) {
      alert("Login failed");
    }
  };

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="bg-white p-6 rounded-xl shadow w-[350px]">

        <h2 className="text-xl font-bold mb-4 text-center">
          Admin Login
        </h2>

        <input
          type="email"
          placeholder="Email"
          className="border p-2 w-full mb-3 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="border p-2 w-full mb-3 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={login}
          className="bg-blue-600 text-white w-full p-2 rounded"
        >
          Login
        </button>

      </div>
    </div>
  );
}