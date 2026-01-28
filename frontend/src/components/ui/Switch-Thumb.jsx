import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "./utils";

function SwitchThumb() {
  return (
    <SwitchPrimitive.Thumb
      data-slot="switch-thumb"
      className={cn(
        "bg-card dark:data-[state=unchecked]:bg-card-foreground dark:data-[state=checked]:bg-primary-foreground pointer-events-none block size-4 rounded-full ring-0 transition-transform data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0"
      )}
    />
  );
}

export { SwitchThumb };
