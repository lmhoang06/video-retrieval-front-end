"strict";

import React, { createContext, useContext, useState, useCallback } from "react";
import axios from "axios";
import pLimit from "p-limit";
import ImageCache from "./imageCache";

const AppContext = createContext(null);
const cache = new ImageCache(4000);

const MS_GRAPH_API = "https://graph.microsoft.com/v1.0";

const DRIVE_ID_LIST = [
  "b!0y2sxeQGV0-UPjZAgg0zL6ijEoU73q5DuxNFsT_aO6GWFg1zpn0qTJyu2Zt16imE", // 10CL - LMH (L01 -> L22)
  "b!C7MJtUkO10-XYMQNroV5OKijEoU73q5DuxNFsT_aO6GWFg1zpn0qTJyu2Zt16imE", // 10CL - THMH (L23 -> L30)
];

const getImageData = async (
  accessToken,
  videoName,
  frameName,
  retryCount = 0
) => {
  if (!accessToken) throw new Error("No access token available");

  const l_id = parseInt(videoName.slice(1, 3), 10);
  if (24 < l_id) return null;

  const DRIVE_ID = l_id <= 22 ? DRIVE_ID_LIST[0] : DRIVE_ID_LIST[1];
  try {
    const apiResult = await axios.get(
      `${MS_GRAPH_API}/drives/${DRIVE_ID}/root:/AIC2024/Keyframes/${videoName}/${frameName}?select=@microsoft.graph.downloadUrl`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json;odata.metadata=none" // for reduce response payload
        },
        timeout: 2500,
      }
    );

    const response = await axios.get(
      apiResult.data["@microsoft.graph.downloadUrl"],
      {
        timeout: 2500,
        responseType: "blob",
      }
    );

    const objectURL = URL.createObjectURL(response.data);
    cache.saveObjectURL(objectURL, videoName, frameName);
    return objectURL;
  } catch (error) {
    console.error(`Error fetching image data: ${error.message}`);
    if (retryCount < 3) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return await getImageData(videoName, frameName, retryCount + 1);
    } else {
      return null;
    }
  }
};

const loadImage = async (accessToken, imageData) => {
  if (imageData?.loaded) return imageData;

  try {
    const objectURL =
      cache.getObjectURL(imageData.videoName, imageData.frameName) ||
      (await getImageData(
        accessToken,
        imageData.videoName,
        `${imageData.frameName.toString().padStart(3, "0")}.jpg`
      ));
      if (!objectURL) throw new Error("Get image failed!");
    return { ...imageData, src: objectURL, loaded: true };
  } catch (error) {
    console.error("Error loading image:", error);
    return { ...imageData, loadError: true };
  }
};

const loadImagesList = async (accessToken, images) => {
  const limit = pLimit(16);
  return await Promise.all(
    images.map((imageData) => limit(() => loadImage(accessToken, imageData)))
  );
};

export function AppProvider({ children }) {
  const [images, setImages] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [accessToken, setAccessToken] = useState("");

  const loadImages = useCallback(
    async (startIndex, endIndex) => {
      const loadedImages = await loadImagesList(
        accessToken,
        images.slice(startIndex, endIndex)
      );

      setImages((prevImages) => {
        const updatedImages = [...prevImages];

        let hasChanged = false;
        for (let i = 0; i < loadedImages.length; i++) {
          if (prevImages[startIndex + i]?.src !== loadedImages[i]?.src) {
            hasChanged = true;
            updatedImages[startIndex + i] = loadedImages[i];
          }
        }

        return hasChanged ? updatedImages : prevImages;
      });

      return loadedImages;
    },
    [images, accessToken]
  );

  const value = {
    images,
    setImages,
    sessionId,
    setSessionId,
    accessToken,
    setAccessToken,
    loadImages,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);
