"use client";

import { IconGear } from "@/libs/icon";
import React, { useEffect } from "react";
import { useState } from "react";
import {
  Dialog,
  DialogBody,
  DialogHeader,
  Button,
  Input,
  Typography,
} from "@material-tailwind/react";
import { useApp } from "@/contexts/appContext";
import axios from "axios";
import toast from "react-hot-toast";

function DRESSettings({ className }) {
  const { settings, setSettings, sessionId, setSessionId } = useApp();
  const [localSettings, setLocalSettings] = useState(settings.DRES);

  useEffect(() => {
    const fetchSessionId = async () => {
      try {
        const { data } = await axios.post(localSettings.Login_URL, {
          username: localSettings.username,
          password: localSettings.password,
        });

        setSessionId(data.sessionId);
      } catch {
        toast.error("Failed to fetch session ID from DRES system!");
      }
    };
    fetchSessionId();
  });

  const inputProps = {
    variant: "outlined",
    color: "blue",
  };

  const updateSettings = (key, value) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
    setSettings((prev) => ({ ...prev, DRES: localSettings }));
  };

  return (
    <div className={className}>
      <div className="flex flex-col gap-4">
        <Typography
          variant="h4"
          color="light-blue"
          textGradient={true}
          className="border-b-2 border-b-light-blue-400"
        >
          DRES Settings
        </Typography>

        {/* Manage DRES API URLs */}
        <div className="flex flex-col gap-2">
          <Typography
            variant="h5"
            color="light-blue"
            textGradient={true}
            className="border-b-2 border-b-light-blue-300"
          >
            DRES API URLs
          </Typography>
          <Input
            label="Login API URL"
            {...inputProps}
            defaultValue={localSettings.Login_URL}
            onBlur={(event) => updateSettings("Login_URL", event.target.value)}
          />
          <Input
            label="Submit API URL"
            {...inputProps}
            defaultValue={localSettings.Submit_URL}
            onBlur={(event) => updateSettings("Submit_URL", event.target.value)}
          />
        </div>

        {/* Manage DRES account */}
        <div className="flex flex-col gap-2">
          <Typography
            variant="h5"
            color="light-blue"
            textGradient={true}
            className="border-b-2 border-b-light-blue-300"
          >
            DRES account
          </Typography>
          <Input
            label="Username"
            {...inputProps}
            defaultValue={localSettings.username}
            onBlur={(event) => updateSettings("username", event.target.value)}
          />
          <Input
            label="Password"
            {...inputProps}
            defaultValue={localSettings.password}
            onBlur={(event) => updateSettings("password", event.target.value)}
          />
        </div>

        {/* Manage DRES session ID */}
        <div className="flex flex-col gap-2">
          <Typography
            variant="h5"
            color="light-blue"
            textGradient={true}
            className="border-b-2 border-b-light-blue-300"
          >
            DRES session ID
          </Typography>
          <Input
            label="Session ID"
            variant="outlined"
            color="blue"
            defaultValue={sessionId}
            onBlur={(event) => {
              setSessionId(event.target.value);
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default function Settings({ className }) {
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(!open);

  return (
    <div className={className}>
      <Button onClick={handleOpen} variant="outlined">
        <IconGear />
      </Button>
      <Dialog open={open} handler={handleOpen} size="md">
        <DialogHeader className="border-b-4 border-double border-blue-600 justify-center">
          <Typography variant="h2" color="blue" textGradient={true}>
            SETTINGS
          </Typography>
        </DialogHeader>
        <DialogBody>
          {/* DRES Settings */}
          <DRESSettings />
        </DialogBody>
      </Dialog>
    </div>
  );
}

/**
 * Available settings:
 * Manage DRES:
 * - DRES API URLs: Login, Submit
 * - Username and Password
 * - Session ID
 */
