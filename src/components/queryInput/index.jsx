"use client";

import { Button, Textarea, Card } from "@material-tailwind/react";
import React, { useState } from "react";
import { Input } from "@material-tailwind/react";
import { useApp } from "@/contexts/appContext";
import { useMsal } from "@azure/msal-react";
import { toast, Bounce } from "react-toastify";
import axios from "axios";
import "react-toastify/dist/ReactToastify.css";

export default function InputQuery({ className }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const { topk, setTopk, queryImage } = useApp();
  const { instance, accounts } = useMsal();

  const handleOnClick = async () => {
    const accessToken = (
      await instance.acquireTokenSilent({
        scopes: ["User.ReadBasic.All", "Files.ReadWrite.All"],
        account: accounts[0],
      })
    )?.accessToken;

    if (!accessToken) {
      throw Error("Invalid access token!");
    }

    try {
      await queryImage(accessToken, query, "text");
      toast.success("Query Image Success!", {
        autoClose: 4500,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: "light",
        transition: Bounce,
      });
    } catch {
      toast.error("Error!", {
        autoClose: 4500,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: "light",
        transition: Bounce,
      });
    }
  };

  const handleTranslateClick = async () => {
    setLoading(true);
    const translationResponse = await axios.post("/api/translateToEN", {
      text: query,
    });

    const translatedText = await translationResponse["data"];
    setQuery(translatedText);
    setLoading(false);
  };

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
      />

      <Button
        variant="outlined"
        color="blue"
        className="p-2 justify-center"
        onClick={handleTranslateClick}
        loading={loading}
      >
        Translate To English
      </Button>

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
