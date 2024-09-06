"use client";

import React, { useState, useEffect } from "react";
import Settings from "../settings";
import InputQuery from "../queryInput";
import { Button, Typography, Card, Spinner } from "@material-tailwind/react";
import { useMsal } from "@azure/msal-react";
import Image from "next/image";

function MicrosoftAccount({ className }) {
  const { instance, accounts, inProgress } = useMsal();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Show a loading state or placeholder until the client-side state is ready
  if (!isClient) {
    return (
      <div className={className}>
        <Card className="w-full h-full p-4 items-center justify-center">
          <Spinner color="blue" className="w-8 h-8" />
        </Card>
      </div>
    );
  }

  if (accounts.length > 0) {
    return (
      <div className={className}>
        <Card className="flex flex-col items-center justify-center gap-2 w-full h-full p-4">
          <div className="flex flex-row w-full justify-center gap-3">
            <Image
              src="/Microsoft_Logo.svg"
              alt="Microsoft Logo"
              width="0"
              height="0"
              className="w-8 h-8"
              priority
            />
            <Typography className="self-center" variant="h5">
              Microsoft Account
            </Typography>
          </div>
          <p>{accounts[0].name}</p>
          <Button
            className="w-full"
            color="light-blue"
            ripple
            onClick={() => instance.logoutPopup()}
            loading={inProgress == "logout"}
          >
            Logout
          </Button>
        </Card>
      </div>
    );
  } else {
    return (
      <div className={className}>
        <Button
          className="w-full flex items-center justify-center gap-2 px-1"
          color="light-blue"
          ripple
          onClick={() =>
            instance.loginPopup({
              scopes: ["User.ReadBasic.All", "Files.ReadWrite.All"],
            })
          }
          loading={inProgress == "login"}
        >
          <Image
            src="/Microsoft_Logo.svg"
            alt="Microsoft Logo"
            width={24}
            height={24}
            className="bg-white"
          />
          Login with Microsoft Account
        </Button>
      </div>
    );
  }
}

export default function Sidebar({ className }) {
  return (
    <Card className={className + " gap-4 p-2"}>
      {/* Sidebar's header */}
      <div className="flex flex-row gap-2 max-w-full w-full">
        <div className="relative">
          <Image
            src="/Falchion_Logo.png"
            alt="Logo"
            fill
            sizes="100px"
            style={{ position: "", objectFit: "contain" }}
          />
        </div>
        <div>
          <Settings />
        </div>
      </div>
      <MicrosoftAccount />

      {/* Input query */}
      <InputQuery />
    </Card>
  );
}
