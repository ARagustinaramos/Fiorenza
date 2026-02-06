import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "./utils";

function SliderThumb({ className, ...props }) {
  return (
    <SliderPrimitive.Thumb
      data-slot="slider-thumb"
      className={cn("size-3 rounded-full bg-primary", className)}
      {...props}
    />
  );
}

export { SliderThumb };