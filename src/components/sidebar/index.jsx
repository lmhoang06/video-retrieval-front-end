"use client";

import { Card } from "@material-tailwind/react";
import React from "react";
import Settings from "../settings";
import InputQuery from "../queryInput";
import { Button } from "@material-tailwind/react";
import { useMsal } from "@azure/msal-react";
import { Typography } from "@material-tailwind/react";

function MicrosoftAccount({ className }) {
  const { instance, accounts, inProgress } = useMsal();

  if (accounts.length > 0) {
    return (
      <div className={className}>
        <Card className="w-full h-full p-4">
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <div className="flex flex-row w-full max-h-10 justify-center gap-3">
              <img
                src="/Microsoft_Logo.svg"
                alt="Microsoft Logo"
                className="h-8 w-8"
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
          </div>
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
          <img
            src="/Microsoft_Logo.svg"
            alt="Microsoft Logo"
            className="bg-white h-6 w-6"
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
          <img alt="Logo" src="/Falchion_Logo.png" />
        </div>
        <Settings />
      </div>
      <MicrosoftAccount />

      {/* Input query */}
      <InputQuery />
    </Card>
  );
}
