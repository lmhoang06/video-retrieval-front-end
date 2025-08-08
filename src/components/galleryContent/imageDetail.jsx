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

const videosWith30FPS = [
  'L21_V001',
  'L21_V002',
  'L21_V005',
  'L21_V006',
  'L21_V007',
  'L21_V012',
  'L21_V013',
  'L21_V014',
  'L21_V015',
  'L21_V016',
  'L21_V019',
  'L21_V021',
  'L21_V022',
  'L21_V023',
  'L21_V026',
  'L21_V027',
  'L21_V028',
  'L21_V029',
  'L21_V030',
  'L22_V001',
  'L22_V004',
  'L22_V005',
  'L22_V006',
  'L22_V011',
  'L22_V012',
  'L22_V013',
  'L22_V014',
  'L22_V015',
  'L22_V018',
  'L22_V019',
  'L22_V020',
  'L22_V021',
  'L22_V022',
  'L22_V025',
  'L22_V026',
  'L22_V027',
  'L22_V028',
  'L22_V029',
  'L24_V017',
  'L24_V019',
  'L24_V020',
  'L24_V021',
  'L24_V022',
  'L24_V023',
  'L24_V024',
  'L24_V025',
  'L24_V027',
  'L24_V028',
  'L24_V029',
  'L24_V030',
  'L24_V031',
  'L24_V033',
  'L24_V035',
  'L24_V036',
  'L24_V037',
  'L24_V038',
  'L24_V039',
  'L24_V040',
  'L24_V041',
  'L24_V042',
  'L24_V045'
];

export default function ImageDetail({ imageData, open, handleOpen }) {
  const { videoName, frameName: frameIndex, src } = imageData;
  const { sessionId } = useGallery();
  const [bbox, setBbox] = useState([]); //normalized bounding boxes with xywhn
  const [showObjects, setShowObjects] = useState(false);
  const [showPreviewVideo, setShowPreviewVideo] = useState(false);
  const FPS = videoName === "L24_V044" ? 26.438 : (videosWith30FPS.includes(videoName) ? 30 : 25);

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

  // Add video source URL
  const videoSrc = `${process.env.NEXT_PUBLIC_BACKEND_URL}/videos/${videoName}`;

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
            <video
              src={videoSrc}
              controls
              autoPlay
              onLoadedMetadata={(e) => {
                e.currentTarget.currentTime = frameIndex / FPS;
              }}
              className="w-[36rem] h-auto mt-1"
            />
          </div>
        )}
      </div>
    </Dialog>
  );
}
