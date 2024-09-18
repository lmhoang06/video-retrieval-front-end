"use client";

import { Input, Textarea, Button, Card } from "@material-tailwind/react";
import React, { useState, useCallback, useEffect, memo } from "react";
import { toast, Bounce } from "react-toastify";
import axios from "axios";

const TextQuery = ({ className, onUpdate }) => {
  const [topk, setTopk] = useState(0);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTranslateClick = useCallback(async () => {
    setLoading(true);
    try {
      const translationResponse = await axios.post("/api/translateToEN", {
        text: query,
      });
      setQuery(translationResponse.data);
    } catch (error) {
      console.error("Translation Error:", error);
      toast.error("Error translating text. Please try again.", {
        autoClose: 4500,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: "light",
        transition: Bounce,
      });
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    onUpdate(topk, query);
  }, [topk, query, onUpdate]);

  return (
    <Card className={className + " gap-4"}>
      {/* Top K */}
      <Input
        label="Top K"
        type="number"
        title="Top K"
        min={5}
        max={180}
        value={topk}
        onChange={(event) => setTopk(event.target.value)}
        containerProps={{
          className: "!min-w-0",
        }}
      />

      {/* Text query */}
      <Textarea
        variant="outlined"
        color="blue"
        rows="7"
        label="Text query"
        title="Text query"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        containerProps={{
          className: "!min-w-0",
        }}
      />

      <Button
        variant="outlined"
        color="blue"
        className="p-2 justify-center"
        onClick={handleTranslateClick}
        loading={loading}
      >
        {loading ? "Translating..." : "Translate To English"}
      </Button>
    </Card>
  );
};

export default memo(TextQuery);
