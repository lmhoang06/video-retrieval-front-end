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
  const [bbox, setBbox] = useState([]); //normalized bounding boxes with xywhn
  const [showObjects, setShowObjects] = useState(false);
  const [showPreviewVideo, setShowPreviewVideo] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const bboxResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/objects/${videoName}-${frameIndex}`
      );

        setBbox(
          bboxResponse.data.objects.map(({ class_name: className, bbox_xywhn: xywhn, confidence }) => {
            let [x, y, w, h] = xywhn;
            return { x, y, w, h, label: className, confidence };
          })
        );
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [videoName, frameIndex]);

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
            onClick={() => setShowObjects(!showObjects)}
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
          <div className="fixed bottom-0.5 right-0.5">
            <IconButton
              variant="gradient"
              color="red"
              className="!absolute top-1 right-1 -translate-y-full w-5 h-5 rounded-full text-white z-40"
              size="sm"
              onClick={() => setShowPreviewVideo(false)}
            >
              &#10005;
            </IconButton>
          </div>
        )}
      </div>
    </Dialog>
  );
}
