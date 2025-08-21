"use client";

import {
  Tabs,
  TabsHeader,
  Tab,
  Typography,
  Card,
} from "@material-tailwind/react";
import React, { useState, memo } from "react";
import KeyframesQuery from "./keyframesQuery";
import ScenesQuery from "./scenesQuery";
import AsrQuery from "./asrQuery";

const SubqueryInput = ({ subqueryName, className, onUpdate }) => {
  const [currentTab, setCurrentTab] = useState("keyframes");

  const tabs = [
    { label: "Keyframes", value: "keyframes" },
    { label: "Scenes", value: "scenes" },
    { label: "ASR", value: "asr" },
  ];

  const renderActive = () => {
    switch (currentTab) {
      case "keyframes":
        return <KeyframesQuery onUpdate={onUpdate} />;
      case "scenes":
        return <ScenesQuery onUpdate={onUpdate} />;
      case "asr":
        return <AsrQuery onUpdate={onUpdate} />;
      default:
        return null;
    }
  };

  return (
    <div className={className}>
      <Card>
        <Typography
          variant="lead"
          color="light-blue"
          className="w-full text-center text-lg mb-2"
        >
          {subqueryName}
        </Typography>
        <Tabs value={currentTab} className="mx-1">
          <TabsHeader
            className="bg-transparent border-2 border-light-blue-600"
            indicatorProps={{
              className: "bg-gray-900/10 shadow-none !text-gray-900 !transform-none",
            }}
            translate="no"
          >
            {tabs.map(({ label, value }) => (
              <Tab
                key={value}
                value={value}
                onClick={() => setCurrentTab(value)}
                className="text-sm font-semibold"
              >
                {label}
              </Tab>
            ))}
          </TabsHeader>
        </Tabs>
        {renderActive()}
      </Card>
    </div>
  );
};

export default memo(SubqueryInput);
