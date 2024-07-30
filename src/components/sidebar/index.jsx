"use client";

import { Card } from "@material-tailwind/react";
import React from "react";
import Settings from "../settings";
import InputQuery from "../queryInput";

export default function Sidebar({ className }) {
  return (
    <Card className={className + " gap-4 p-2"}>
      {/* Sidebar's header */}
      <div className="flex flex-row gap-2 max-w-full w-full">
        <div>
          <img alt="Logo" src="/Falchion_Logo.png" />
        </div>
        <Settings />
      </div>

      {/* Input query */}
      <InputQuery />
    </Card>
  );
}
