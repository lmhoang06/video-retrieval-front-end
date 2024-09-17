"use client";

import { Button, Card, IconButton } from "@material-tailwind/react";
import React, { useState } from "react";
import { useApp } from "@/contexts/appContext";
import { useMsal } from "@azure/msal-react";
import { toast, Bounce } from "react-toastify";
import axios from "axios";
import "react-toastify/dist/ReactToastify.css";
import StageInput from "./stageInput";
import { IconPlus } from "@/libs/icon";

export default function InputQuery({ className }) {
  const [stages, setStages] = useState([]);
  const { setImages, setAccessToken } = useApp();
  const { instance, accounts } = useMsal();

  const handleOnClick = async () => {
    if (stages.length == 0) {
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

    let requestData = stages.map((stage) => stage.value);
    let response = await axios.post("/api/query", { query: requestData });

    const accessToken = (
      await instance.acquireTokenSilent({
        scopes: ["User.ReadBasic.All", "Files.ReadWrite.All"],
        account: accounts[0],
      })
    )?.accessToken;

    if (!accessToken) {
      throw new Error("Invalid access token!");
    }
    setAccessToken(accessToken);
    
    setImages(
      response.data.map(({ videoName, frameName, distance }) => ({
        videoName: videoName,
        frameName: parseInt(
          frameName.replace(".jpg", "").replace(/^0+/, ""),
          10
        ),
        similarityScore: distance,
        loaded: false,
      }))
    );
  };

  const handleUpdate = (stageId, value) => {
    setStages((prevStages) => {
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

  const handleAddStage = () => {
    const newId = Math.max(...stages.map((stage) => stage.id), 0) + 1;
    const newStage = {
      id: newId,
      name: `Stage ${stages.length + 1}`,
      value: "",
    };
    setStages((prevStages) => [...prevStages, newStage]);
  };

  const handleRemoveStage = (stageId) => {
    setStages((prevStages) =>
      prevStages
        .filter((stage) => stage.id !== stageId)
        .map((stage, index) => ({ ...stage, name: `Stage ${index + 1}` }))
    );
  };

  return (
    <Card className={className + " gap-4 p-2 overflow-y-auto"} shadow={false}>
      <div className="sticky top-0 z-50">
        <Button
          variant="outlined"
          color="blue"
          className="p-2 w-full !bg-white"
          onClick={handleOnClick}
        >
          Submit Query
        </Button>
      </div>

      <div className="gap-4 p-2 max-h-[77vh] overflow-y-auto">
        {stages.map((stage) => (
          <div key={stage.id} className="relative">
            <IconButton
              variant="gradient"
              color="red"
              className="!absolute top-1 right-1 w-5 h-5 rounded-full text-white z-40"
              size="sm"
              onClick={() => handleRemoveStage(stage.id)}
            >
              &#10005;
            </IconButton>
            <StageInput
              stageName={stage.name}
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
            onClick={handleAddStage}
          >
            <IconPlus />
          </IconButton>
        </div>
      </div>
    </Card>
  );
}
