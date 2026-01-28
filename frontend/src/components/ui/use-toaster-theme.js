import { useEffect } from "react";
import { useTheme } from "next-themes";

export function useToasterTheme() {
  const { theme } = useTheme();

  useEffect(() => {
    const toaster = document.querySelector("div[data-toast-root]");
    if (toaster) {
      toaster.style.backgroundColor = theme === "dark" ? "#111827" : "#f9fafb";
    }
  }, [theme]);
}