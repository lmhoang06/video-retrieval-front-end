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
              width={32}
              height={32}
            />
            <Typography className="self-center" variant="h5">
              Microsoft Account
            </Typography>
          </div>
          <p>{accounts[0].name}</p>
          <Button
            className="w-full"
            color="light-blue"
            ripple={true}
            onClick={() =>
              instance.logoutRedirect({
                onRedirectNavigate: (url) => false,
              })
            }
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
          ripple={true}
          onClick={() => instance.loginPopup()}
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
        <div>
          <Image
            src="/Falchion_Logo.png"
            alt="Logo"
            fill={true}
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
