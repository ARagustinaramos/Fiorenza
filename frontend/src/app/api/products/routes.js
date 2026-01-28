import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    
    const authHeader = req.headers.get("authorization");
    
    const backendBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

    const backendUrl = `${backendBase}/products?${searchParams.toString()}`;

    const headers = {
      "Content-Type": "application/json",
    };
    
    if (authHeader) {
      headers["Authorization"] = authHeader;
    }

    const res = await fetch(backendUrl, {
      headers,
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Backend products error:", res.status, text);

      return NextResponse.json(
        { error: "Error obteniendo productos" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("API PRODUCTS ERROR:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
