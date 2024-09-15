"use client";

import { Input, Button, Card, ButtonGroup } from "@material-tailwind/react";
import React, { useState, useEffect, useCallback, memo } from "react";
import "react-toastify/dist/ReactToastify.css";
import Image from "next/image";

const ImageQuery = ({ initialImage = null, onUpdate }) => {
  const [topk, setTopk] = useState(0);
  const [image, setImage] = useState(null);

  useEffect(() => {
    if (initialImage) {
      setImage(initialImage);
    }
  }, [initialImage]);

  // Debounce effect to avoid excessive rendering
  useEffect(() => {
    if (!image) return;
    onUpdate(topk, image);
  }, [topk, image, onUpdate]);

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setImage(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setImage(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto gap-4">
      <Input
        label="Top K"
        type="number"
        title="Top K"
        min={5}
        max={180}
        value={topk}
        onChange={(event) => setTopk(event.target.value)}
      />
      {!image ? (
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {/* <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" /> */}
          <div className="mt-4 flex text-sm leading-6 text-gray-600">
            <label
              htmlFor="file-upload"
              className="relative cursor-pointer rounded-md bg-white font-semibold text-blue-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 hover:text-blue-500"
            >
              <span>Upload a file</span>
              <Input
                id="file-upload"
                name="file-upload"
                type="file"
                className="sr-only"
                onChange={handleImageChange}
                accept="image/*"
                containerProps={{
                  className: "min-w-0 min-h-0 !sr-only",
                }}
              />
            </label>
            <p className="pl-1">or drag and drop</p>
          </div>
          <p className="text-xs leading-5 text-gray-600">
            PNG, JPG, GIF up to 10MB
          </p>
        </div>
      ) : (
        <div className="relative">
          <Image
            src={image}
            height="0"
            width="0"
            alt="Uploaded image"
            className="w-full h-fit object-contain rounded-lg"
          />
        </div>
      )}

      {image && (
        <ButtonGroup variant="outlined" color="blue" className="mt-4">
          <Button
            className="p-2 justify-center"
            onClick={() => document.getElementById("file-upload").click()}
          >
            Replace Image
            <Input
              id="file-upload"
              name="file-upload"
              type="file"
              onChange={handleImageChange}
              accept="image/*"
              hidden
              containerProps={{
                className: "min-w-0 min-h-0 !sr-only",
              }}
            />
          </Button>
          <Button className="p-2 justify-center" onClick={handleRemoveImage}>
            Remove Image
          </Button>
        </ButtonGroup>
      )}
    </Card>
  );
};

export default memo(ImageQuery);
