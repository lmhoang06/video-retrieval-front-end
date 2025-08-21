"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  memo,
  useCallback,
} from "react";
import {
  Dialog,
  Typography,
  Button,
  IconButton,
} from "@material-tailwind/react";
import submitFrame from "@/libs/submit";
import { useGallery } from "@/contexts/galleryContext";
import { useApp } from "@/contexts/appContext";
import { toast, Bounce } from "react-toastify";
import axios from "axios";
import "react-toastify/dist/ReactToastify.css";
import Image from "next/image";

const boxStyle = (box) => ({
  left: `${(box.x - box.w / 2) * 100}%`,
  top: `${(box.y - box.h / 2) * 100}%`,
  width: `${box.w * 100}%`,
  height: `${box.h * 100}%`,
  borderColor: box.color,
});

const ImageWithBoundingBoxes = memo(
  ({ className, boxes = [], src, showObjects = true }) => {
    const imgRef = useRef(null);

    const scaledBoxes = useMemo(() => {
      const img = imgRef.current;
      if (!img || !img.complete) return [];

      return boxes.map((box) => ({
        x: box.x,
        y: box.y,
        w: box.w,
        h: box.h,
        label: box.label,
        confidence: box.confidence,
        color: "green",
      }));
    }, [boxes]);

    return (
      <div className={className}>
        <div className="relative">
          <Image
            ref={imgRef}
            src={src}
            width="0"
            height="0"
            className="w-full h-full object-cover"
            alt="Bigger image"
            unoptimized
          />
          {showObjects &&
            scaledBoxes.map((box, index) => (
              <div
                key={index}
                className="absolute border-2"
                style={boxStyle(box)}
              >
                <div className="absolute top-0 left-0 bg-green-500/50 text-white px-1 py-0.5 text-xs -translate-y-full">
                  {box.label} ({box.confidence.toFixed(2)})
                </div>
              </div>
            ))}
        </div>
      </div>
    );
  }
);

ImageWithBoundingBoxes.displayName = "ImageWithBoundingBoxes";


export default function ImageDetail({ imageData, open, handleOpen }) {
  const { videoName, frameName: frameIndex, src } = imageData;
  const { sessionId } = useGallery();
  const { getKeyframeDetections } = useApp();
  const [bbox, setBbox] = useState([]); //normalized bounding boxes with xywhn
  const [showObjects, setShowObjects] = useState(false);
  const [showPreviewVideo, setShowPreviewVideo] = useState(false);
  // Video metadata state (fetched from NEXT_PUBLIC_METADATA_SERVER)
  const [videoMeta, setVideoMeta] = useState({ fps: null, url: null, name: null });
  const [metaLoading, setMetaLoading] = useState(false);

  // Fetch per-video metadata (fps and url)
  useEffect(() => {
    let cancelled = false;
    const fetchMeta = async () => {
      if (!videoName) return;
      try {
        setMetaLoading(true);
        const base = process.env.NEXT_PUBLIC_METADATA_SERVER;
        const prefix = videoName.slice(0, 3);
        const metaUrl = `${base}/${prefix}/${videoName}.json`;
        const { data } = await axios.get(metaUrl);
        if (cancelled) return;
        const fps = typeof data?.fps === "string" ? parseFloat(data.fps) : Number(data?.fps);
        const url = data?.url ?? null;
        setVideoMeta({ fps: Number.isFinite(fps) ? fps : null, url, name: videoName });
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load video metadata", err);
          setVideoMeta({ fps: null, url: null, name: videoName });
        }
      } finally {
        if (!cancelled) setMetaLoading(false);
      }
    };
    // Only fetch when preview is toggled on, and metadata not yet loaded for this video
    if (!showPreviewVideo) return () => { cancelled = true; };
    if (videoMeta?.name === videoName && (videoMeta.url || videoMeta.fps)) {
      return () => { cancelled = true; };
    }
    fetchMeta();
    return () => {
      cancelled = true;
    };
  }, [videoName, showPreviewVideo]);

  // Use metadata fps with a safe fallback
  const FPS = videoMeta.fps || 25;

  // Lazy load boxes only when toggled on or when image changes while showing
  useEffect(() => {
    let cancelled = false;
    const maybeLoadBoxes = async () => {
      if (!showObjects) return;
      try {
        const detections = await getKeyframeDetections(videoName, frameIndex);
        if (cancelled) return;
        const boxes = (Array.isArray(detections) ? detections : []).map(
          ({ class_name: className, bbox_xywhn: xywhn, confidence }) => {
            const [x, y, w, h] = xywhn || [];
            return { x, y, w, h, label: className, confidence };
          }
        );
        setBbox(boxes);
      } catch (error) {
        if (!cancelled) console.error("Error fetching detections:", error);
      }
    };
    maybeLoadBoxes();
    return () => { cancelled = true; };
  }, [showObjects, videoName, frameIndex, getKeyframeDetections]);

  const handleSubmit = useCallback(() => {
    const data = submitFrame(videoName, frameIndex, sessionId);
    const status = data?.submission;

    if (status === "true" || status === "TRUE") {
      toast.success("Accepted", {
        autoClose: 4500,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: "light",
        transition: Bounce,
      });
    }

    if (status === "WRONG") {
      toast.error("Wrong answer", {
        autoClose: 4500,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: "light",
        transition: Bounce,
      });
    }
  }, [frameIndex, videoName, sessionId]);

  // Use video URL from metadata
  const videoSrc = videoMeta.url || "";

  // Helpers to support YouTube embed when URL is a watch link
  const getYouTubeEmbedUrl = useCallback((rawUrl, startSec) => {
    if (!rawUrl) return null;
    try {
      const u = new URL(rawUrl);
      const host = u.hostname.toLowerCase();
      let videoId = null;
      if (host.includes("youtube.com")) {
        // Typical: https://www.youtube.com/watch?v=VIDEO_ID
        if (u.pathname === "/watch") {
          videoId = u.searchParams.get("v");
        } else if (u.pathname.startsWith("/embed/")) {
          videoId = u.pathname.split("/")[2] || null;
        } else if (u.pathname.startsWith("/shorts/")) {
          videoId = u.pathname.split("/")[2] || null;
        }
      } else if (host === "youtu.be") {
        // Short link: https://youtu.be/VIDEO_ID
        videoId = u.pathname.replace("/", "");
      }
      if (!videoId) return null;
      const start = Number.isFinite(startSec) ? Math.max(0, Math.floor(startSec)) : 0;
      const params = new URLSearchParams({
        start: String(start),
        autoplay: "1",
        rel: "0",
        modestbranding: "1",
        controls: "1",
      });
      return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
    } catch (_) {
      return null;
    }
  }, []);

  const startSeconds = useMemo(() => {
    const idx = Number(frameIndex);
    return Number.isFinite(idx) && FPS ? Math.max(0, Math.floor(idx / FPS)) : 0;
  }, [frameIndex, FPS]);

  const youtubeEmbedUrl = useMemo(() => getYouTubeEmbedUrl(videoSrc, startSeconds), [videoSrc, startSeconds, getYouTubeEmbedUrl]);

  return (
    <Dialog
      open={open}
      size="xl"
      className="bg-gray-300 flex flex-row"
      handler={() => {
        setShowPreviewVideo(false);
        handleOpen();
      }}
      animate={{
        mount: { scale: 1, y: 0 },
        unmount: { scale: 1, y: 0 },
      }}
    >
      {/* <img className="w-1/2" src={src} alt={`${video_name}_${frame_idx}`} /> */}
      <ImageWithBoundingBoxes
        className="w-1/2"
        src={src}
        boxes={bbox}
        showObjects={showObjects}
      />
      <div className="w-1/2 flex-col p-3">
        <Typography variant="h4" color="blue">
          Video name: {videoName}
        </Typography>
        <Typography variant="h4" color="blue">
          Frame index: {frameIndex}
        </Typography>
        {/* Function button */}
        <div className="flex gap-2">
          <Button
            color="blue"
            ripple
            variant="gradient"
            onClick={handleSubmit}
            size="sm"
          >
            Submit
          </Button>
          <Button
            color="blue"
            ripple
            variant="gradient"
            size="sm"
            onClick={() => setShowObjects((v) => !v)}
          >
            {showObjects ? "Hide objects" : "Show objects"}
          </Button>
          <Button
            color="blue"
            ripple
            variant="gradient"
            size="sm"
            onClick={() => setShowPreviewVideo(true)}
          >
            Show preview video
          </Button>
        </div>
        {showPreviewVideo && (
          <div className="fixed bottom-1 right-1">
            <IconButton
              variant="gradient"
              color="red"
              className="!absolute top-0.5 right-0.5 -translate-y-full w-5 h-5 rounded-full text-white z-40"
              size="sm"
              onClick={() => setShowPreviewVideo(false)}
            >
              &#10005;
            </IconButton>
            {videoSrc ? (
              youtubeEmbedUrl ? (
                <iframe
                  src={youtubeEmbedUrl}
                  title={`Preview ${videoName}`}
                  className="w-[36rem] h-[20.25rem] mt-1" /* 16:9 height for 36rem width: 36 * 9/16 = 20.25 */
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <video
                  src={videoSrc}
                  controls
                  autoPlay
                  onLoadedMetadata={(e) => {
                    if (FPS) {
                      e.currentTarget.currentTime = Number(frameIndex) / FPS;
                    }
                  }}
                  className="w-[36rem] h-auto mt-1"
                />
              )
            ) : (
              <div className="w-[36rem] h-auto mt-1 p-3 bg-white/70 text-sm text-red-600 rounded">
                {metaLoading ? "Loading video metadata..." : "Video preview not available."}
              </div>
            )}
          </div>
        )}
      </div>
    </Dialog>
  );
}
