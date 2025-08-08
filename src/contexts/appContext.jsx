"strict";

import React, { createContext, useContext, useState, useCallback } from "react";
import axios from "axios";
import pLimit from "p-limit";
import ImageCache from "./imageCache";

const AppContext = createContext(null);
const cache = new ImageCache(4000);

const getImageData = async (
  videoName,
  frameName,
  retryCount = 0
) => {
  try {
    const { data: arrayBuffer } = await axios.get(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/keyframes/${videoName}-${frameName}`,
      {
        timeout: 2500,
        responseType: "arraybuffer",
      }
    );
    const blob = new Blob([arrayBuffer], { type: "image/avif" });
    const response = { data: blob };

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

const loadImage = async (imageData) => {
  if (imageData?.loaded) return imageData;

  try {
    const objectURL =
      cache.getObjectURL(imageData.videoName, imageData.frameName) ||
      (await getImageData(
        imageData.videoName,
        imageData.frameName
      ));
      if (!objectURL) throw new Error(`Get image ${imageData.videoName}-${imageData.frameName} failed!`);
    return { ...imageData, src: objectURL, loaded: true };
  } catch (error) {
    console.error("Error loading image:", error);
    return { ...imageData, loadError: true };
  }
};

const loadImagesList = async (images) => {
  const limit = pLimit(16);
  return await Promise.all(
    images.map((imageData) => limit(() => loadImage(imageData)))
  );
};

export function AppProvider({ children }) {
  const [images, setImages] = useState([{
    "videoName": "L23_V001",
    "frameName": 2646,
    "loaded": false,
  }]);
  const [sessionId, setSessionId] = useState(null);
  const [queryResult, setQueryResult] = useState([]);

  const loadImages = useCallback(
    async (startIndex, endIndex) => {
      const loadedImages = await loadImagesList(
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
    [images]
  );

  const value = {
    images,
    setImages,
    sessionId,
    setSessionId,
    loadImages,
    queryResult,
    setQueryResult,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);
