"use client";

import { Slider } from "@material-tailwind/react";
import React, { useCallback, useState, useEffect } from "react";
import { useGallery } from "@/contexts/galleryContext";
import ImagesPerPageManager from "./manageImagePerPage";
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import Image from "next/image";
import {
  Button,
  Typography,
  Card,
  Spinner,
  Avatar,
  Popover,
  PopoverHandler,
  PopoverContent,
} from "@material-tailwind/react";
import axios from "axios";

const MS_GRAPH_API = "https://graph.microsoft.com/v1.0";

const getUserAvatar = async (accessToken) => {
  try {
    const response = await axios.get(`${MS_GRAPH_API}/me/photos/48x48/$value`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      responseType: "blob",
      timeout: 2500,
    });
    return URL.createObjectURL(response.data);
  } catch (error) {
    console.error(`Error fetching image data: ${error.message}`);
    return undefined;
  }
};

function MicrosoftAccount({ className }) {
  const { instance, accounts, inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [isClient, setIsClient] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState("/default_avatar.png");

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      (async () => {
        const accessToken = (
          await instance.acquireTokenSilent({
            scopes: ["User.ReadBasic.All", "Files.ReadWrite.All"],
            account: accounts[0],
          })
        )?.accessToken;

        const avatar = await getUserAvatar(accessToken);
        setAvatarSrc(avatar || "/default_avatar.png");
      })();
    }
  }, [accounts, instance, isAuthenticated]);

  const popoverContent = () => {
    // Show a loading state or placeholder until the client-side state is ready
    if (!isClient) {
      return (
        <Card className="w-full h-full p-4 items-center justify-center">
          <Spinner color="blue" className="w-8 h-8" />
        </Card>
      );
    }

    if (accounts.length > 0) {
      return (
        <div className="flex flex-col items-center justify-center gap-2 w-full h-full">
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
            size="sm"
          >
            Logout
          </Button>
        </div>
      );
    } else {
      return (
        <Button
          className="w-full flex items-center justify-center gap-2 px-3"
          color="light-blue"
          ripple
          onClick={() =>
            instance.loginPopup({
              scopes: ["User.ReadBasic.All", "Files.ReadWrite.All"],
            })
          }
          loading={inProgress == "login"}
          size="sm"
        >
          <Image
            src="/Microsoft_Logo.svg"
            alt="Microsoft Logo"
            width="0"
            height="0"
            className="bg-white w-8 h-8"
          />
          Login with Microsoft Account
        </Button>
      );
    }
  };

  return (
    <Popover placement="left-end">
      <PopoverHandler>
        <Avatar
          src={avatarSrc}
          withBorder
          color="light-blue"
          alt="avatar"
          size="md"
        />
      </PopoverHandler>
      <PopoverContent className="z-20">{popoverContent()}</PopoverContent>
    </Popover>
  );
}

export default function GallerySetting({ className }) {
  const { imagesPerRow, setImagesPerRow } = useGallery();

  const handleOnChangeImgsPerRow = (event) =>
    setImagesPerRow(event.target.value / 20 + 5);

  return (
    <div className={className}>
      {/* Grid Layout Control */}
      <div className="flex flex-row w-full h-full gap-2 mb-1">
        {/* Control number of images per page */}
        <ImagesPerPageManager className="w-fit" />

        {/* Control number of image per row in page */}
        <Slider
          color="blue"
          value={(imagesPerRow - 5) * 20}
          min={0}
          max={100}
          step={20}
          onChange={handleOnChangeImgsPerRow}
          className="self-center"
        />

        {/* MS Account */}
        <MicrosoftAccount />
      </div>
    </div>
  );
}
