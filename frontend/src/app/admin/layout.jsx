"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import AdminSidebar from "../../components/AdminSiderbar";
import { Navbar } from "../../components/Navbar";

export default function AdminLayout({ children }) {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user || user.rol !== "ADMIN") {
      router.push("/");
    }
  }, [user, router]);

  if (!user || user.rol !== "ADMIN") {
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
