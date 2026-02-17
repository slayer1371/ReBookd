"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Redirects logged-in users to their role-appropriate page.
 * Use at the top of auth pages (login, signup) to prevent access.
 * Returns true if the user is being redirected (should show loading).
 */
export function useAuthGuard(): boolean {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status !== "authenticated") return;
    if (session?.user?.role === "BUSINESS") {
      router.replace("/biz/dashboard");
    } else {
      router.replace("/");
    }
  }, [status, session, router]);

  return status === "authenticated";
}
