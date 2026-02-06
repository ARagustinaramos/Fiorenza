"use client";

import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/");
      } else if (roles && !roles.includes(user.rol)) {
        router.replace("/");
      }
    }
  }, [user, loading, roles, router]);

  if (loading || !user) return null;

  return children;
}
