"use client";

import { Button, Textarea, Card } from "@material-tailwind/react";
import React, { useState } from "react";
import submitQuery from "@/libs/query";
import { Input } from "@material-tailwind/react";
import { useApp } from "@/contexts/appContext";

export default function InputQuery({ className }) {
  const [query, setQuery] = useState("");
  const [topk, setTopk] = useState(10);
  const { setImages, settings } = useApp();

  const imagesSource = settings.imagesSource;

  const handleOnClick = async () => {
    let result = await submitQuery(query, topk);
    result = result.filter(({ video }) => !(11 <= parseInt(video.slice(1, 3), 10) && parseInt(video.slice(1, 3), 10) <= 20));
    setImages(
      result.map(({ video, frame_name, distance }) => 
        ({
        video_name: video,
        frame_idx: parseInt(frame_name.replace('.jpg', '').replace(/^0+/, ''), 10),
        similarity_score: distance,
        src: `${imagesSource}/${video}/${frame_name}`,
      })).sort((a, b) => b.distance - a.distance)
    );
  };

  return (
    <Card className={className + " gap-4"}>
      {/* Text query */}
      <Textarea
        label="Text query"
        color="blue"
        title="Text query"
        onChange={(event) => setQuery(event.target.value)}
      />

      {/* Top K */}
      <Input
        label="Top K"
        type="number"
        title="Top K"
        min={5}
        max={180}
        value={topk}
        onChange={(event) => setTopk(event.target.value)}
      />

      <Button
        variant="outlined"
        color="blue"
        className="p-2"
        onClick={handleOnClick}
      >
        Submit Query
      </Button>
    </Card>
  );
}
