import { AI_DISCLAIMER } from "@/lib/ai/system-prompt";

export function AIDisclaimer() {
  return (
    <div className="border-t border-border px-4 py-2">
      <p className="mx-auto max-w-3xl text-[11px] leading-relaxed text-muted-foreground">
        {AI_DISCLAIMER}
      </p>
    </div>
  );
}
