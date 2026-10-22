"use client";

import React from "react";

interface Props {
  region: string;
}

export default function GembaAnalyticsView({ region }: Props) {
  const src = `/gemba-analytics.html?region=${encodeURIComponent(region)}`;
  return (
    <iframe
      src={src}
      style={{ width: "100%", height: "100vh", border: "none", display: "block" }}
      title="GEMBA Analytics"
    />
  );
}
