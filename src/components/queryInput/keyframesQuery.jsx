"use client";

import { Card, Input, Typography } from "@material-tailwind/react";
import React, { useEffect, useMemo, useState, memo } from "react";

function KeyframesQuery({ className, onUpdate }) {
  const [imageIdQuery, setImageIdQuery] = useState("");
  const [textQuery, setTextQuery] = useState("");
  const [topK, setTopK] = useState(16);

  const normalizedTopK = useMemo(() => {
    const n = parseInt(topK, 10);
    return Number.isNaN(n) ? 16 : Math.max(16, n);
  }, [topK]);

  useEffect(() => {
    const args = {
      top_k: normalizedTopK,
      ...(imageIdQuery ? { image_id_query: imageIdQuery } : {}),
      ...(textQuery ? { text_query: textQuery } : {}),
    };
    onUpdate?.({ type: "keyframes", args });
  }, [imageIdQuery, textQuery, normalizedTopK, onUpdate]);

  const imageDisabled = textQuery.trim().length > 0;
  const textDisabled = imageIdQuery.trim().length > 0;

  return (
    <Card className={className + " p-3"} shadow={false}>
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3">
          <Input
            label="Image ID query"
            value={imageIdQuery}
            onChange={(e) => setImageIdQuery(e.target.value)}
            disabled={imageDisabled}
            crossOrigin="anonymous"
          />
          <Input
            label="Text query"
            value={textQuery}
            onChange={(e) => setTextQuery(e.target.value)}
            disabled={textDisabled}
            crossOrigin="anonymous"
          />
        </div>
        <div className="w-40">
          <Input
            type="number"
            min={16}
            label="Top K (min 16)"
            value={normalizedTopK}
            onChange={(e) => setTopK(e.target.value)}
            crossOrigin="anonymous"
          />
        </div>
        <Typography variant="small" color="blue-gray" className="opacity-70">
          Only one of Image ID or Text can be provided. Text must be in English. Top K must be at least 16.
        </Typography>
      </div>
    </Card>
  );
}

export default memo(KeyframesQuery);
