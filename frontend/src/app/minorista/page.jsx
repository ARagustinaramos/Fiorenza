import { redirect } from "next/navigation";

export default function MinoristaPage({ searchParams }) {
  const internalCode = String(
    searchParams?.interno || searchParams?.producto || ""
  ).trim();

  if (internalCode) {
    redirect(`/?interno=${encodeURIComponent(internalCode)}#catalogo`);
  }

  redirect("/#catalogo");
}
