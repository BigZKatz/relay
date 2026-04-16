"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export function DemoLoginForm({ defaultEmail }: { defaultEmail: string }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    const result = await signIn("demo", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid demo credentials.");
      setLoading(false);
    } else {
      window.location.href = "/";
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        name="email"
        type="email"
        defaultValue={defaultEmail}
        className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-2.5 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Email"
        required
      />
      <input
        name="password"
        type="password"
        className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-2.5 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Demo password"
        required
      />
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium text-sm py-2.5 px-4 rounded-lg transition-colors"
      >
        {loading ? "Signing in…" : "Sign in with Demo Account"}
      </button>
    </form>
  );
}
