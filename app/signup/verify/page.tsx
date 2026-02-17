"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Suspense } from "react";

function VerifyForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") || "";

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Auto-focus first input
    const firstInput = document.getElementById("code-0");
    if (firstInput) firstInput.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const digits = value.replace(/\D/g, "").split("").slice(0, 6);
      const newCode = [...code];
      digits.forEach((d, i) => {
        if (index + i < 6) newCode[index + i] = d;
      });
      setCode(newCode);
      const nextIndex = Math.min(index + digits.length, 5);
      const nextInput = document.getElementById(`code-${nextIndex}`);
      if (nextInput) nextInput.focus();
      return;
    }

    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      if (prevInput) prevInput.focus();
      const newCode = [...code];
      newCode[index - 1] = "";
      setCode(newCode);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join("");

    if (fullCode.length !== 6) {
      setError("Please enter the full 6-digit code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: fullCode }),
      });

      if (!res.ok) {
        const text = await res.text();
        setError(text || "Invalid code");
        setLoading(false);
        return;
      }

      setSuccess(true);

      // Redirect to login after verification
      setTimeout(() => {
        router.push("/login?verified=true");
      }, 1500);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: "resend-only", name: "" }),
      });
    } catch {
      // Silently fail on resend
    }
  };

  return (
    <div className="relative z-10 w-full max-w-[440px] mx-4">
      {/* Card glow border */}
      <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-b from-white/[0.12] to-white/[0.04]" />

      <div className={`relative rounded-2xl bg-[#111113]/80 backdrop-blur-2xl px-8 py-10 shadow-2xl shadow-black/40 transition-all duration-1000 ease-out ${
        mounted ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      }`}>
        {/* Success state */}
        {success ? (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/25">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white">Email Verified!</h2>
            <p className="mt-2 text-sm text-zinc-400">Signing you in automatically...</p>
            <div className="mt-4">
              <svg className="h-5 w-5 animate-spin text-blue-400" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className={`mb-8 transition-all duration-700 delay-200 ${mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg shadow-blue-500/25">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-white">
                Check your email
              </h1>
              <p className="mt-1.5 text-sm text-zinc-400">
                We sent a 6-digit code to{" "}
                <span className="font-medium text-zinc-300">{email}</span>
              </p>
            </div>

            {/* Code Input */}
            <form onSubmit={handleSubmit}>
              <div className={`mb-6 flex justify-center gap-2.5 transition-all duration-700 delay-300 ${mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
                {code.map((digit, index) => (
                  <input
                    key={index}
                    id={`code-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className={`h-14 w-12 rounded-xl border text-center font-mono text-xl font-semibold outline-none transition-all ${
                      digit
                        ? "border-blue-500/50 bg-blue-500/10 text-white shadow-sm shadow-blue-500/10"
                        : "border-white/[0.08] bg-white/[0.03] text-white"
                    } focus:border-blue-500/50 focus:bg-blue-500/10 focus:ring-1 focus:ring-blue-500/25 placeholder:text-zinc-700`}
                    placeholder="·"
                  />
                ))}
              </div>

              {/* Error */}
              {error && (
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                  {error}
                </div>
              )}

              {/* Submit */}
              <div className={`transition-all duration-700 delay-400 ${mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
                <button
                  type="submit"
                  disabled={loading || code.join("").length !== 6}
                  className="group relative h-11 w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-0 transition-opacity group-hover:opacity-100" />
                  <span className="relative flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Verifying...
                      </>
                    ) : (
                      "Verify Email"
                    )}
                  </span>
                </button>
              </div>
            </form>

            {/* Resend */}
            <div className={`mt-6 text-center transition-all duration-700 delay-500 ${mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
              <p className="text-sm text-zinc-500">
                Didn&apos;t receive a code?{" "}
                <button
                  onClick={handleResend}
                  className="font-medium text-blue-400 transition-colors hover:text-blue-300"
                >
                  Resend
                </button>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0a0b]">
      {/* Animated gradient orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-cyan-600/20 blur-[120px] animate-pulse" />
        <div className="absolute -bottom-32 -right-32 h-[500px] w-[500px] rounded-full bg-blue-600/20 blur-[120px] animate-pulse [animation-delay:1s]" />
        <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/10 blur-[100px] animate-pulse [animation-delay:2s]" />
      </div>

      {/* Noise texture overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
      }} />

      {/* Grid lines */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '64px 64px',
      }} />

      <Suspense fallback={
        <div className="flex items-center justify-center">
          <svg className="h-6 w-6 animate-spin text-blue-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      }>
        <VerifyForm />
      </Suspense>
    </div>
  );
}
