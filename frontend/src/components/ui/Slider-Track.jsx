import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "./utils";

function SliderTrack() {
  return (
    <SliderPrimitive.Track
      data-slot="slider-track"
      className={cn(
        "bg-muted relative grow overflow-hidden rounded-full data-[orientation=horizontal]:h-4 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5"
      )}
    >
      <SliderPrimitive.Range
        data-slot="slider-range"
        className="bg-primary absolute data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full"
      />
    </SliderPrimitive.Track>
  );
}

export { SliderTrack };
