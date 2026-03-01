import { AI_DISCLAIMER } from "@/lib/ai/system-prompt";

export function AIDisclaimer() {
  return (
    <p className="text-[10px] leading-tight text-muted-foreground/60 text-center py-1">
      {AI_DISCLAIMER}
    </p>
  );
}
