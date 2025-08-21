"use client";

import { Button, Card, IconButton } from "@material-tailwind/react";
import React, { useEffect, useMemo, useState } from "react";
import pLimit from "p-limit";
import { useApp } from "@/contexts/appContext";
import { toast, Bounce } from "react-toastify";
import axios from "axios";
import "react-toastify/dist/ReactToastify.css";
import SubqueryInput from "./subqueryInput";
import { IconPlus } from "@/libs/icon";
import ObjectsQuery from "./objectsQuery";

export default function InputQuery({ className }) {
  const [subqueries, setSubqueries] = useState([]);
  const [objectsCollapsed, setObjectsCollapsed] = useState(true);
  const [objectsFilter, setObjectsFilter] = useState([]);
  const { setImages, setQueryResult, queryResult, getKeyframeObjects, getBatchKeyframeDetections } = useApp();

  const validateSubquery = (subquery) => {
    const { value } = subquery || {};
    if (!value || typeof value !== "object") {
      return `"${subquery?.name ?? "Subquery"}" is empty.`;
    }
    const { type, args } = value;
    if (!type || !args) return `"${subquery.name}" is invalid.`;

    const topK = parseInt(args.top_k, 10);
    const ensureTopK = Number.isNaN(topK) ? 0 : topK;

    if (type === "keyframes") {
      const hasImg =
        typeof args.image_id_query === "string" &&
        args.image_id_query.trim().length > 0;
      const hasText =
        typeof args.text_query === "string" && args.text_query.trim().length > 0;
      if (!hasImg && !hasText) return `${subquery.name}: Provide Image ID or Text query.`;
      if (hasImg && hasText) return `${subquery.name}: Only one of Image ID or Text is allowed.`;
      if (ensureTopK < 16) return `${subquery.name}: top_k must be at least 16.`;
      return null;
    }

    if (type === "scenes" || type === "asr") {
      const hasText =
        typeof args.query === "string" && args.query.trim().length > 0;
      if (!hasText) return `${subquery.name}: Text query is required.`;
      if (ensureTopK < 16) return `${subquery.name}: top_k must be at least 16.`;
      return null;
    }

    return `${subquery.name}: Unsupported query type "${type}".`;
  };

  const handleOnClick = async () => {
    if (subqueries.length == 0) {
      toast.error("Please add at least one query!", {
        autoClose: 4500,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: "light",
        transition: Bounce,
      });
      return;
    }

    // Validate stages
    for (const stage of subqueries) {
      const error = validateSubquery(stage);
      if (error) {
        toast.error(error, {
          autoClose: 4500,
          pauseOnHover: false,
          draggable: true,
          progress: undefined,
          theme: "light",
          transition: Bounce,
        });
        return;
      }
    }

    const requestData = subqueries.map((stage) => stage.value);

    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/search`, 
      requestData
    );

    try {
      setQueryResult(response.data);
      
      const images = response.data["keyframes"] || [];
      setImages(
        images.map((keyframe_id) => ({
          videoName: keyframe_id.split("-")[0],
          frameName: parseInt(keyframe_id.split("-")[1], 10),
          loaded: false,
        }))
      );
      toast.success("Query Completed!", {
        autoClose: 4500,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: "light",
        transition: Bounce,
      });
    } catch (err) {
      toast.error("Query Failed!", {
        autoClose: 4500,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: "light",
        transition: Bounce,
      });
      console.error(err);
      throw new Error("Query Image Failed!");
    }
  };

  const handleExportTop100 = () => {
    try {
      const ids = Array.isArray(queryResult?.keyframes)
        ? queryResult.keyframes.slice(0, 100)
        : [];
      if (ids.length === 0) {
        toast.info("No results to export.", {
          autoClose: 3000,
          pauseOnHover: false,
          draggable: true,
          theme: "light",
          transition: Bounce,
        });
        return;
      }

      const content = ids.join("\n");
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "top100.txt";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export failed:", e);
      toast.error("Failed to export results.", {
        autoClose: 3500,
        pauseOnHover: false,
        draggable: true,
        theme: "light",
        transition: Bounce,
      });
    }
  };

  const handleUpdate = (stageId, value) => {
    setSubqueries((prevStages) => {
      const updatedStages = prevStages.map((stage) => {
        if (stage.id === stageId && stage.value !== value) {
          return { ...stage, value };
        }
        return stage;
      });

      if (JSON.stringify(prevStages) !== JSON.stringify(updatedStages)) {
        return updatedStages;
      }

      return prevStages;
    });
  };

  const handleAddSubquery = () => {
    const newId = Math.max(...subqueries.map((stage) => stage.id), 0) + 1;
    const newSubquery = {
      id: newId,
      name: `Subquery ${subqueries.length + 1}`,
      value: null,
    };
    setSubqueries((prevStages) => [...prevStages, newSubquery]);
  };

  const handleRemoveSubquery = (subqueryId) => {
    setSubqueries((prevStages) =>
      prevStages
        .filter((stage) => stage.id !== subqueryId)
        .map((stage, index) => ({ ...stage, name: `Subquery ${index + 1}` }))
    );
  };

  // Derive and apply object filter to images without mutating original queryResult
  useEffect(() => {
  let cancelled = false;
  const applyFilter = async () => {
      try {
        const keyframes = queryResult?.keyframes || [];
        if (!Array.isArray(keyframes) || keyframes.length === 0) return;

        // If no filter selected, show all keyframes as images
        if (!objectsFilter || objectsFilter.length === 0) {
          if (cancelled) return;
          setImages(
            keyframes.map((keyframe_id) => ({
              videoName: keyframe_id.split("-")[0],
              frameName: parseInt(keyframe_id.split("-")[1], 10),
              loaded: false,
            }))
          );
          return;
        }

        // With filter: batch fetch detections for missing keyframes, then apply OR semantics from cache
        // Trigger batch fetch (it internally avoids fetching cached ids)
        await getBatchKeyframeDetections(keyframes);

        const limit = pLimit(16);
        const results = await Promise.all(
          keyframes.map((keyframe_id) =>
            limit(async () => {
              const [videoName, frameStr] = keyframe_id.split("-");
              const frameName = parseInt(frameStr, 10);
              const classes = await getKeyframeObjects(videoName, frameName);
              const matches = classes?.some((c) => objectsFilter.includes(c)); // OR logic
              return matches ? { videoName, frameName, loaded: false } : null;
            })
          )
        );

        if (cancelled) return;
        setImages(results.filter(Boolean));
      } catch (e) {
        console.error("Apply object filter failed:", e);
      }
    };

    applyFilter();
    return () => {
      cancelled = true;
    };
  }, [objectsFilter, queryResult, getKeyframeObjects, setImages, getBatchKeyframeDetections]);

  return (
    <Card className={className + " gap-4 p-2 overflow-y-auto divide-y-2 divide-blue-500"} shadow={false}>
      <div className="sticky top-0 z-50">
        <Button
          variant="outlined"
          color="blue"
          className="p-2 w-full !bg-white"
          onClick={handleOnClick}
        >
          Submit Query
        </Button>
        <div className="mt-2">
          <Button
            variant="outlined"
            color="green"
            className="p-2 w-full !bg-white"
            onClick={handleExportTop100}
          >
            Export Top 100 IDs
          </Button>
        </div>
      </div>

      <div className="flex-1 p-2 max-h-[77vh] overflow-y-auto">
        {subqueries.map((stage) => (
          <div key={stage.id} className="relative mt-4">
            <IconButton
              variant="gradient"
              color="red"
              className="!absolute top-1 right-1 w-5 h-5 rounded-full text-white z-40"
              size="sm"
              onClick={() => handleRemoveSubquery(stage.id)}
            >
              &#10005;
            </IconButton>
            <SubqueryInput
              subqueryName={stage.name}
              value={stage.value}
              onUpdate={(value) => handleUpdate(stage.id, value)}
            />
          </div>
        ))}
        <div className="flex mt-3 place-content-center">
          <IconButton
            variant="outlined"
            className="rounded-full"
            size="sm"
            onClick={handleAddSubquery}
          >
            <IconPlus />
          </IconButton>
        </div>
      </div>

      {/* Objects Query - single, collapsible, excluded from request */}
      <div>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-blue-gray-700">Objects Filter</span>
          <Button
            variant="text"
            color="blue"
            className="p-2"
            onClick={() => setObjectsCollapsed((v) => !v)}
          >
            {objectsCollapsed ? "Expand" : "Collapse"}
          </Button>
        </div>
        {!objectsCollapsed && (
          <div className="mt-2">
            <ObjectsQuery onUpdate={setObjectsFilter} />
          </div>
        )}
      </div>
    </Card>
  );
}
