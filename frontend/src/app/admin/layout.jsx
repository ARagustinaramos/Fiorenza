"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import AdminSidebar from "../../components/AdminSiderbar";
import { Navbar } from "../../components/Navbar";

export default function AdminLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user || (user.rol !== "ADMIN" && user.rol !== "admin")) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading) {
    return null;
  }

  if (!user || (user.rol !== "ADMIN" && user.rol !== "admin")) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
     
      <Navbar />

      <div className="flex flex-1">
       
        <AdminSidebar />

        <main className="flex-1 bg-gray-100 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
