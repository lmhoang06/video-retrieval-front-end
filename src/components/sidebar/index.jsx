"use client";

import React from "react";
import InputQuery from "../queryInput";
import { Card } from "@material-tailwind/react";
import Image from "next/image";

export default function Sidebar({ className }) {
  return (
    <Card className={className + " gap-2"}>
      {/* Sidebar's header */}
      <div className="flex flex-row max-w-full w-full justify-center">
        <div className="relative">
          <Image
            src="/Logo.png"
            alt="Logo"
            fill
            sizes="100%"
            style={{ position: "", objectFit: "contain" }}
            quality={75}
          />
        </div>
      </div>

      {/* Input query */}
      <InputQuery className="h-full" />
    </Card>
  );
}
