"use client";

import { Card, Input, Typography } from "@material-tailwind/react";
import React, { useEffect, useMemo, useState, memo } from "react";

function AsrQuery({ className, onUpdate }) {
  const [textQuery, setTextQuery] = useState("");
  const [topK, setTopK] = useState(16);

  const normalizedTopK = useMemo(() => {
    const n = parseInt(topK, 10);
    return Number.isNaN(n) ? 16 : Math.max(16, n);
  }, [topK]);

  useEffect(() => {
    const args = {
      text_query: textQuery,
      top_k: normalizedTopK,
    };
    onUpdate?.({ type: "asr", args });
  }, [textQuery, normalizedTopK, onUpdate]);

  return (
    <Card className={className + " p-3"} shadow={false}>
      <div className="flex flex-col gap-3">
        <Input
          label="Text query"
          value={textQuery}
          onChange={(e) => setTextQuery(e.target.value)}
          crossOrigin="anonymous"
        />
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
          Text query is required. Top K must be at least 16.
        </Typography>
      </div>
    </Card>
  );
}

export default memo(AsrQuery);
