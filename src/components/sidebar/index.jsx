"use client";

import React from "react";
import Settings from "../settings";
import InputQuery from "../queryInput";
import { Card } from "@material-tailwind/react";
import Image from "next/image";

export default function Sidebar({ className }) {
  return (
    <Card className={className + " gap-4 p-3"}>
      {/* Sidebar's header */}
      <div className="flex flex-row gap-2 max-w-full w-full">
        <div className="relative">
          <Image
            src="/Falchion_Logo.png"
            alt="Logo"
            fill
            sizes="100%"
            style={{ position: "", objectFit: "contain" }}
            quality={75}
          />
        </div>
        {/* <div>
          <Settings />
        </div> */}
      </div>

      {/* Input query */}
      <InputQuery />
    </Card>
  );
}
