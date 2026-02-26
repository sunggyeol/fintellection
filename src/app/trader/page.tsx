"use client";

import { Bot, ArrowRight } from "lucide-react";
import { motion } from "motion/react";

export default function TraderPage() {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="text-center"
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4, ease: "easeOut" }}
          className="mx-auto mb-4 flex size-16 items-center justify-center bg-primary/10"
        >
          <Bot className="size-8 text-primary" />
        </motion.div>

        <h1 className="mb-2 text-xl font-semibold text-foreground">
          Agentic Trader
        </h1>
        <p className="mb-1 text-sm text-muted-foreground">
          AI-powered trade execution with human-in-the-loop approval.
        </p>
        <p className="mb-6 text-xs text-muted-foreground/70">
          Coming soon
        </p>

        <div className="mx-auto grid max-w-sm gap-3 text-left">
          {[
            "Automated portfolio rebalancing",
            "Signal-based entry & exit strategies",
            "Risk management guardrails",
          ].map((feature, i) => (
            <motion.div
              key={feature}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="flex items-center gap-2 text-xs text-muted-foreground"
            >
              <ArrowRight className="size-3 text-primary" />
              <span>{feature}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
