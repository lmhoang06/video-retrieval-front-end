"use client";

import { Button, Textarea, Card } from "@material-tailwind/react";
import React, { useState } from "react";
import submitQuery from "@/libs/query";
import { Input } from "@material-tailwind/react";
import { useApp } from "@/contexts/appContext";
import { useMsal } from "@azure/msal-react";
import processQueryResult from "./processQueryResult";

export default function InputQuery({ className }) {
  const [query, setQuery] = useState("");
  const [topk, setTopk] = useState(10);
  const { setImages } = useApp();
  const { instance, accounts } = useMsal();

  const handleOnClick = async () => {
    const results = await submitQuery(query, topk);

    const accessToken = (
      await instance.acquireTokenSilent({
        scopes: ["User.ReadBasic.All"],
        account: accounts[0],
      })
    )?.accessToken;

    if (!accessToken) {
      throw Error("Invalid access token!");
    }

    setImages(await processQueryResult(accessToken, results, 24));
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
