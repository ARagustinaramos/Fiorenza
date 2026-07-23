import Home from "../../page";

export default function ProductoPage({ params }) {
  return <Home initialCode={params.codigo} />;
}