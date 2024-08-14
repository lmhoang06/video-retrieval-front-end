"use client";

import React, { useState, useEffect, useRef } from "react";
import { Dialog, Typography, Button } from "@material-tailwind/react";
import submitFrame from "@/libs/submit";
import toast from "react-hot-toast";
import { useGallery } from "@/contexts/galleryContext";

const ImageWithBoundingBoxes = ({ className, boxes = [], src }) => {
  const [imgWidth, setImgWidth] = useState(0);
  const [imgHeight, setImgHeight] = useState(0);
  const [naturalWidth, setNaturalWidth] = useState(0);
  const [naturalHeight, setNaturalHeight] = useState(0);

  const imgRef = useRef(null);

  const handleImageLoad = () => {
    const img = imgRef.current;
    setImgWidth(img.width);
    setImgHeight(img.height);
    setNaturalWidth(img.naturalWidth);
    setNaturalHeight(img.naturalHeight);
  };

  useEffect(() => {
    const updateDimensions = () => {
      const img = imgRef.current;
      setImgWidth(img.width);
      setImgHeight(img.height);
    };
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const scaleWidth = imgWidth / naturalWidth;
  const scaleHeight = imgHeight / naturalHeight;

  const scaledBoxes = boxes.map((box) => {
    return {
      x: box.x * scaleWidth,
      y: box.y * scaleHeight,
      w: box.w * scaleWidth,
      h: box.h * scaleHeight,
      label: box.label,
      confidence: box.confidence,
      color: box.color || "green", // use default color if not specified
    };
  });

  const boxStyle = (box) => {
    return {
      left: `${box.x}px`,
      top: `${box.y}px`,
      width: `${box.w}px`,
      height: `${box.h}px`,
      borderColor: box.color, // use the box's color for the border
    };
  };

  return (
    <div className={className}>
      <div className="relative">
        <img
          ref={imgRef}
          src={src}
          onLoad={handleImageLoad}
          className="w-full h-full object-cover"
          alt="Bigger image"
        />
        {scaledBoxes.map((box, index) => (
          <div key={index} className="absolute border-2" style={boxStyle(box)}>
            <div className="absolute top-0 left-0 bg-red-500 text-white px-2 py-1 text-xs -translate-y-full">
              {box.label} ({box.confidence.toFixed(2)})
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function ImageDetail({ imageData, open, handleOpen }) {
  const { video_name, frame_idx, similarity_score, src } = imageData;
  const { sessionId } = useGallery();

  const handleSubmit = () => {
    const data = submitFrame(video_name, frame_idx, sessionId);
    const status = data?.submission;

    if (status === "true" || status === "TRUE") {
      toast.success("Accepted", {
        duration: 6000,
        position: "top-left",
      });
    }

    if (status === "WRONG") {
      toast.error("Wrong answer", {
        duration: 6000,
        position: "top-left",
      });
    }
  };
  const boxes = [];
  // const boxes = [
  //   {
  //     x: 89.4,
  //     y: 89.4,
  //     w: 379.95,
  //     h: 283.1,
  //     label: "Person",
  //     confidence: 0.95,
  //     color: "red", // specify a custom color
  //   },
  //   {
  //     x: 178.8,
  //     y: 29.8,
  //     w: 290.55,
  //     h: 119.2,
  //     label: "Car",
  //     confidence: 0.92,
  //   }, // no color specified, will use default color
  //   {
  //     x: 300,
  //     y: 200,
  //     w: 100,
  //     h: 50,
  //     label: "Object",
  //     confidence: 0.8,
  //     color: "blue", // specify a custom color
  //   },
  // ];
  return (
    <Dialog
      open={open}
      size="lg"
      className="bg-gray-300 flex flex-row overflow-hidden"
      handler={handleOpen}
      animate={{
        mount: { scale: 1, y: 0 },
        unmount: { scale: 1, y: 0 },
      }}
    >
      {/* <img className="w-1/2" src={src} alt={`${video_name}_${frame_idx}`} /> */}
      <ImageWithBoundingBoxes className="w-1/2" src={src} boxes={boxes} />
      <div className="w-1/2 flex-col p-3">
        <Typography variant="h4" color="blue">
          Video name: {video_name}
        </Typography>
        <Typography variant="h4" color="blue">
          Frame index: {frame_idx}
        </Typography>
        <Typography variant="h4" color="blue">
          Similarity score: {similarity_score}
        </Typography>
        {/* Function button */}
        <div className="flex gap-2">
          <Button
            color="blue"
            ripple={true}
            variant="gradient"
            onClick={handleSubmit}
            size="sm"
          >
            Submit
          </Button>
          <Button color="blue" ripple={true} variant="gradient" size="sm">
            KNN
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
