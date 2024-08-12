"use client";

import { Button, Textarea, Card } from "@material-tailwind/react";
import React, { useState } from "react";
import submitQuery from "@/libs/query";
import { Input } from "@material-tailwind/react";
import { useApp } from "@/contexts/appContext";
import axios from "axios";
import { useMsal } from "@azure/msal-react";
import pLimit from "p-limit";

const MS_GRAPH_API = "https://graph.microsoft.com/v1.0";
const DRIVE_ID =
  "b!0y2sxeQGV0-UPjZAgg0zL6ijEoU73q5DuxNFsT_aO6GWFg1zpn0qTJyu2Zt16imE";

const getImageData = async (accessToken, videoName, frameName) => {
  const api_result = await axios.get(
    `${MS_GRAPH_API}/drives/${DRIVE_ID}/root:/AIC2024/Keyframes/${videoName}/${frameName}?$select=@microsoft.graph.downloadUrl`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      timeout: 2500,
    }
  );

  const response = await axios.get(
    api_result.data["@microsoft.graph.downloadUrl"],
    {
      timeout: 2500,
      responseType: "arraybuffer",
    }
  );

  return (
    "data:image/jpeg;base64," +
    Buffer.from(response.data, "binary").toString("base64")
  );
};

export default function InputQuery({ className }) {
  const [query, setQuery] = useState("");
  const [topk, setTopk] = useState(10);
  const { setImages } = useApp();
  const { instance, accounts } = useMsal();

  const handleOnClick = async () => {
    let result = await submitQuery(query, topk);

    const accessToken = (
      await instance.acquireTokenSilent({
        scopes: ["User.ReadBasic.All"],
        account: accounts[0],
      })
    )?.accessToken;

    if (!accessToken) {
      throw Error("Invalid access token!");
    }

    result = result.filter(
      ({ video }) =>
        !(
          1 <= parseInt(video.slice(1, 3), 10) &&
          parseInt(video.slice(1, 3), 10) <= 20
        )
    );

    const processResult = async ({ video, frame_name, distance }) => {
      return {
        video_name: video,
        frame_idx: parseInt(
          frame_name.replace(".jpg", "").replace(/^0+/, ""),
          10
        ),
        similarity_score: distance,
        src: await getImageData(accessToken, video, frame_name),
      };
    };

    const processInBatches = async (items, batchSize) => {
      const limit = pLimit(batchSize);
      const results = await Promise.all(
        items.map((item) => limit(() => processResult(item)))
      );
      return results.sort((a, b) => b.distance - a.distance);
    };

    setImages(await processInBatches(result, 24));
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
