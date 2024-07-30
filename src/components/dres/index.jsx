"use client";

import React, { useEffect } from "react";
import axios from "axios";
import { Textarea } from "@material-tailwind/react";

export default function Dres({ className, sessionId, setSessionId }) {
  const fetchSessionId = async () => {
    const { data } = await axios.post(
      "https://eventretrieval.one/api/v1/login",
      {
        username: process.env.AIC_USERNAME,
        password: process.env.AIC_PASSWORD,
      }
    );

    setSessionId(data.sessionId);
  };

  useEffect(() => {
    fetchSessionId();
  }, []);

  return (
    <div className={className}>
      <Textarea
        variant="outlined"
        size="md"
        label="DRES Session ID"
        color="blue"
        value={sessionId}
        onChange={(event) => setSessionId(event.target.value)}
        className="w-full"
      />
    </div>
  );
}
