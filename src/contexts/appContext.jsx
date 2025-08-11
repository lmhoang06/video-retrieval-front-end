"strict";

import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import axios from "axios";
import pLimit from "p-limit";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [images, setImages] = useState([]);
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
  }, [getKeyframeDetections]);

  // Batch fetch detections for multiple keyframes; hydrates caches and returns detections per requested id in order
  const getBatchKeyframeDetections = useCallback(async (keyframeIds, retryCount = 0) => {
    try {
      if (!Array.isArray(keyframeIds) || keyframeIds.length === 0) return [];

      // Determine which ids are missing from cache
      const missing = keyframeIds.filter((id) => !keyframeDetectionsCache.current.has(id));

      // Fetch missing in chunks to avoid overly large payloads
      const chunkSize = 196;
      const chunks = [];
      for (let i = 0; i < missing.length; i += chunkSize) {
        const chunk = missing.slice(i, i + chunkSize);
        if (chunk.length > 0) chunks.push(chunk);
      }

      const limit = pLimit(8);
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
      const imagesToLoad = images.slice(startIndex, endIndex);
      const updatedImages = [];
      const changedIndices = [];
      
      // Process all images first without state updates
      for (let i = 0; i < imagesToLoad.length; i++) {
        const imageData = imagesToLoad[i];
        const actualIndex = startIndex + i;
        
        // Skip already loaded images
        if (imageData.loaded) {
          updatedImages.push(imageData);
          continue;
        }
        
        // Create image URL directly without extra function calls
        const paddedFrameName = imageData.frameName.toString().padStart(6, "0");
        const updatedImage = {
          ...imageData,
          src: `${process.env.NEXT_PUBLIC_IMAGE_SERVER}/${imageData.videoName}/${paddedFrameName}.avif`,
          loaded: true
        };
        
        updatedImages.push(updatedImage);
        if (!imageData.loaded) {
          changedIndices.push(actualIndex);
        }
      }
      
      // Only update state if any images changed
      if (changedIndices.length > 0) {
        setImages(prevImages => {
          const newImages = [...prevImages];
          for (let i = 0; i < updatedImages.length; i++) {
            newImages[startIndex + i] = updatedImages[i];
          }
          return newImages;
        });
      }
      
      return updatedImages;
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
