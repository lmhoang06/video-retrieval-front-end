"strict";

import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import axios from "axios";
import pLimit from "p-limit";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [images, setImages] = useState([]);
  const [queryResult, setQueryResult] = useState([]);
  // Cache for per-video objects (stores unique class names array per keyframe id)
  const videoDetectionsCache = useRef(new Map());
  // Cache for per-keyframe objects (stores unique class names array per keyframe id)
  const keyframeObjectsCache = useRef(new Map());
  // Cache for full detections per keyframe (array of { class_name, bbox_xywhn, confidence })
  const keyframeDetectionsCache = useRef(new Map());

  const getKeyframeDetections = useCallback(async (videoName, frameName, retryCount = 0) => {
    const key = `${videoName}-${frameName}`;
    if (keyframeDetectionsCache.current.has(key)) {
      return keyframeDetectionsCache.current.get(key);
    }

    // Check if the whole video's detections are cached
    if (videoDetectionsCache.current.has(videoName)) {
      const allDetections = videoDetectionsCache.current.get(videoName);
      const detections = allDetections[frameName] || [];
      keyframeDetectionsCache.current.set(key, detections);
      return detections;
    }

    // Fetch the entire JSON for the video
    try {
      const url = `${process.env.NEXT_PUBLIC_OBJECTS_SERVER}/${videoName.slice(0, 3)}/${videoName}.json`;
      const { data } = await axios.get(url);
      
      const allDetections = (data && typeof data === 'object') ? data : {};
      videoDetectionsCache.current.set(videoName, allDetections);

      // Now get the specific frame's detections
      const detections = allDetections[frameName] || [];
      keyframeDetectionsCache.current.set(key, detections);
      return detections;
    } catch (error) {
      if (retryCount < 2) {
        await new Promise((r) => setTimeout(r, 120));
        return await getKeyframeDetections(videoName, frameName, retryCount + 1);
      }
      console.error(`Error fetching detections for ${videoName}-${frameName} from new API:`, error?.message || error);
      // Cache empty to avoid hammering on repeated failures
      videoDetectionsCache.current.set(videoName, {}); // Cache empty object for the video
      keyframeDetectionsCache.current.set(key, []);
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
      
      // Group missing keyframes by video
      const keyframesByVideo = {};
      for (const id of missing) {
        const [videoName, frameName] = id.split('-');
        if (!keyframesByVideo[videoName]) {
          keyframesByVideo[videoName] = [];
        }
        keyframesByVideo[videoName].push({ id, frameName });
      }

      const limit = pLimit(8);
      await Promise.all(
        Object.keys(keyframesByVideo).map((videoName) =>
          limit(async () => {
            try {
                // This will fetch and cache the whole video json
                await getKeyframeDetections(videoName, keyframesByVideo[videoName][0].frameName);
                // Now populate the cache for all requested frames of this video
                const allDetections = videoDetectionsCache.current.get(videoName) || {};
                for (const { id, frameName } of keyframesByVideo[videoName]) {
                    const dets = allDetections[frameName] || [];
                    keyframeDetectionsCache.current.set(id, dets);
                    const classes = Array.from(new Set(dets.map((d) => d?.class_name).filter(Boolean)));
                    keyframeObjectsCache.current.set(id, classes);
                }
            } catch (e) {
              // On first attempt, bubble up to allow a full retry; on retry, mark empty to avoid loops
              if (retryCount >= 1) {
                for (const { id } of keyframesByVideo[videoName]) {
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
  }, [getKeyframeDetections]);

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
          src: `${process.env.NEXT_PUBLIC_IMAGE_SERVER}/${imageData.videoName.slice(0, 3)}/${imageData.videoName}/${paddedFrameName}.avif`,
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
