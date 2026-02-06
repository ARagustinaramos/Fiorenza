"use client";

import { Toaster as Sonner } from "sonner";
import { useToasterTheme } from "./use-toaster-theme";

function Toaster(props) {
  const theme = useToasterTheme();

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      style={{
        "--normal-bg": "var(--popover)",
        "--normal-text": "var(--popover-foreground)",
        "--normal-border": "var(--border)",
      }}
      {...props}
    />
  );
}

export { Toaster };
