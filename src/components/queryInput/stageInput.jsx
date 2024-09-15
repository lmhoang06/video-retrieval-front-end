"use client";

import {
  Tabs,
  TabsHeader,
  Tab,
  TabsBody,
  TabPanel,
  Typography,
  Card,
} from "@material-tailwind/react";
import React, { useState, useCallback, memo } from "react";
import TextQuery from "./textQuery";
import ImageQuery from "./imageQuery";
import ObjectsQuery from "./objectsQuery";

const StageInput = ({ stageName, className, onUpdate }) => {
  const [currentTab, setCurrentTab] = useState("text");
  const [textData, setTextData] = useState({});
  const [imageData, setImageData] = useState({});
  const [objectData, setObjectData] = useState([]);

  const getFormData = useCallback(() => {
    switch (currentTab) {
      case "text":
        return { type: "text", queryData: textData };
      case "image":
        return { type: "image", queryData: imageData };
      case "objects":
        return { type: "objects", queryData: objectData };
      default:
        return null;
    }
  }, [currentTab, textData, imageData, objectData]);

  onUpdate(getFormData());

  const handleTextDataUpdate = (topk, text) => {
    setTextData({
      text: text,
      topk: topk,
    });
    onUpdate(getFormData());
  };

  const handleImageDataUpdate = (topk, image) => {
    setImageData({
      image: image,
      topk: topk,
    });
    onUpdate(getFormData());
  };

  const handleObjectDataUpdate = (objects) => {
    setObjectData(
      objects.reduce(
        (acc, { className, number }) => ({ ...acc, [className]: number }),
        {}
      )
    );
    onUpdate(getFormData());
  };

  const queryType = [
    {
      label: "Text",
      value: "text",
      desc: <TextQuery onUpdate={handleTextDataUpdate} />,
    },
    {
      label: "Image",
      value: "image",
      desc: <ImageQuery onUpdate={handleImageDataUpdate} />,
    },
    {
      label: "Objects",
      value: "objects",
      desc: <ObjectsQuery onUpdate={handleObjectDataUpdate} />,
    },
  ];

  return (
    <div className={className}>
      <Card>
        <Typography
          variant="lead"
          color="light-blue"
          className="w-full text-center text-lg mb-4"
        >
          {stageName}
        </Typography>
        <Tabs value="text">
          <TabsHeader
            className="bg-transparent border-2 border-light-blue-600"
            indicatorProps={{
              className: "bg-gray-900/10 shadow-none !text-gray-900",
            }}
          >
            {queryType.map(({ label, value }) => (
              <Tab
                key={value}
                value={value}
                onClick={(e) => setCurrentTab(value)}
              >
                {label}
              </Tab>
            ))}
          </TabsHeader>
          <TabsBody>
            {queryType.map(({ value, desc }) => (
              <TabPanel key={value} value={value}>
                {desc}
              </TabPanel>
            ))}
          </TabsBody>
        </Tabs>
      </Card>
    </div>
  );
};

export default memo(StageInput);
