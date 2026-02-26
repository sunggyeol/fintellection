"use client";

import dynamic from "next/dynamic";

const SparklineCore = dynamic(() => import("./SparklineCore"), {
  ssr: false,
  loading: () => <div className="h-8 w-20" />,
});

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  positive?: boolean;
}

export function Sparkline(props: SparklineProps) {
  return <SparklineCore {...props} />;
}
