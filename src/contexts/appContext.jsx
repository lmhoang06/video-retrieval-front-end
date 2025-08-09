"strict";

import React, { createContext, useContext, useState, useCallback, useRef } from "react";
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
  // Cache for per-keyframe objects (stores unique class names array per keyframe id)
  const keyframeObjectsCache = useRef(new Map());
  // Cache for full detections per keyframe (array of { class_name, bbox_xywhn, confidence })
  const keyframeDetectionsCache = useRef(new Map());

  const getKeyframeDetections = useCallback(async (videoName, frameName, retryCount = 0) => {
    try {
      const key = `${videoName}-${frameName}`;
      if (keyframeDetectionsCache.current.has(key)) {
        return keyframeDetectionsCache.current.get(key);
      }

      const { data } = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/objects/${key}`,
      );

      const detections = Array.isArray(data) ? data : (Array.isArray(data?.objects) ? data.objects : []);
      keyframeDetectionsCache.current.set(key, detections);
      // Also hydrate objects cache (class names) for consistency
      const classNames = Array.from(new Set(detections.map((d) => d?.class_name).filter(Boolean)));
      keyframeObjectsCache.current.set(key, classNames);
      return detections;
    } catch (error) {
      if (retryCount < 2) {
        await new Promise((r) => setTimeout(r, 120));
        return await getKeyframeDetections(videoName, frameName, retryCount + 1);
      }
      console.error(`Error fetching detections for ${videoName}-${frameName}:`, error?.message || error);
      const key = `${videoName}-${frameName}`;
      if (!keyframeDetectionsCache.current.has(key)) keyframeDetectionsCache.current.set(key, []);
      if (!keyframeObjectsCache.current.has(key)) keyframeObjectsCache.current.set(key, []);
      return [];
    }
  }, []);

  const getKeyframeObjects = useCallback(async (videoName, frameName, retryCount = 0) => {
    try {
      const key = `${videoName}-${frameName}`;
      // If detections are cached, derive classes directly
      if (keyframeDetectionsCache.current.has(key)) {
        const detections = keyframeDetectionsCache.current.get(key) || [];
        const classNames = Array.from(new Set(detections.map((d) => d?.class_name).filter(Boolean)));
        keyframeObjectsCache.current.set(key, classNames);
        return classNames;
      }
      if (keyframeObjectsCache.current.has(key)) {
        return keyframeObjectsCache.current.get(key);
      }

      // Fetch detections and derive class names
      const detections = await getKeyframeDetections(videoName, frameName);
      const classNames = Array.from(new Set(detections.map((d) => d?.class_name).filter(Boolean)));
      keyframeObjectsCache.current.set(key, classNames);
      return classNames;
    } catch (error) {
      if (retryCount < 2) {
        await new Promise((r) => setTimeout(r, 120));
        return await getKeyframeObjects(videoName, frameName, retryCount + 1);
      }
      console.error(`Error fetching objects for ${videoName}-${frameName}:`, error?.message || error);
      // Cache empty to avoid hammering on repeated failures in the same session
      const key = `${videoName}-${frameName}`;
      if (!keyframeObjectsCache.current.has(key)) keyframeObjectsCache.current.set(key, []);
      return [];
    }
  }, []);

  // Batch fetch detections for multiple keyframes; hydrates caches and returns detections per requested id in order
  const getBatchKeyframeDetections = useCallback(async (keyframeIds, retryCount = 0) => {
    try {
      if (!Array.isArray(keyframeIds) || keyframeIds.length === 0) return [];

      // Determine which ids are missing from cache
      const missing = keyframeIds.filter((id) => !keyframeDetectionsCache.current.has(id));

      // Fetch missing in chunks to avoid overly large payloads
      const chunkSize = 128;
      const chunks = [];
      for (let i = 0; i < missing.length; i += chunkSize) {
        const chunk = missing.slice(i, i + chunkSize);
        if (chunk.length > 0) chunks.push(chunk);
      }

      const limit = pLimit(4);
      await Promise.all(
        chunks.map((chunk) =>
          limit(async () => {
            try {
              const { data } = await axios.post(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/objects`,
                { keyframe_ids: chunk },
              );

              // Accept either a plain mapping or a { results: mapping }
              const container = (data && typeof data === "object" && !Array.isArray(data)) ? data : {};
              const mapping = (container.results && typeof container.results === "object" && !Array.isArray(container.results))
                ? container.results
                : container;

              for (const id of chunk) {
                const raw = mapping[id];
                const dets = Array.isArray(raw)
                  ? raw
                  : (Array.isArray(raw?.objects) ? raw.objects : []);
                keyframeDetectionsCache.current.set(id, dets);
                const classes = Array.from(new Set(dets.map((d) => d?.class_name).filter(Boolean)));
                keyframeObjectsCache.current.set(id, classes);
              }
            } catch (e) {
              // On first attempt, bubble up to allow a full retry; on retry, mark empty to avoid loops
              if (retryCount >= 1) {
                for (const id of chunk) {
                  if (!keyframeDetectionsCache.current.has(id)) keyframeDetectionsCache.current.set(id, []);
                  if (!keyframeObjectsCache.current.has(id)) keyframeObjectsCache.current.set(id, []);
                }
              }
              throw e;
            }
          })
        )
      );

      // Build ordered result
      return keyframeIds.map((id) => keyframeDetectionsCache.current.get(id) || []);
    } catch (error) {
      if (retryCount < 1) {
        await new Promise((r) => setTimeout(r, 200));
        return await getBatchKeyframeDetections(keyframeIds, retryCount + 1);
      }
      console.error("Batch fetch detections failed:", error?.message || error);
      // Ensure all requested are present in cache to prevent repeated attempts
      for (const id of keyframeIds) {
        if (!keyframeDetectionsCache.current.has(id)) keyframeDetectionsCache.current.set(id, []);
        if (!keyframeObjectsCache.current.has(id)) keyframeObjectsCache.current.set(id, []);
      }
      return keyframeIds.map(() => []);
    }
  }, []);

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
  // Lazily fetch and cache list of object class names for a keyframe
  getKeyframeObjects,
  // Expose detections fetcher for components that need boxes
  getKeyframeDetections,
  getBatchKeyframeDetections,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);
