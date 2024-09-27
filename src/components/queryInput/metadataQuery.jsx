"use client";

import {
  Card,
  Input,
} from "@material-tailwind/react";
import React, { useState, useEffect, memo } from "react";
// import axios from "axios";

function MetadataQuery({ className, onUpdate }) {
  const [chosenVideos, setChosenVideos] = useState([]);
  // const [videoList, setVideoList] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // useEffect(() => {
  //   (async function getVideoList() {
  //     setVideoList((await axios.get("/api/metadata/videoList")).data);
  //   })();
  // }, []);

  useEffect(() => {
    let queryData = {};

    if (chosenVideos.length > 0) queryData.videoNames = chosenVideos;
    if (startDate) queryData.startDate = startDate;
    if (endDate) queryData.endDate = endDate;
    
    onUpdate(queryData);
  }, [chosenVideos, startDate, endDate, onUpdate]);

  return (
    <Card className={className}>
      {/* Set start and end date */}
      <div className="flex flex-col gap-2 mt-4">
        <Input
          label="Start date"
          type="date"
          variant="outlined"
          color="light-blue"
          defaultValue={startDate}
          onChange={(event) => setStartDate(event.target.value)}
        />
        <Input
          label="End date"
          type="date"
          variant="outlined"
          color="light-blue"
          defaultValue={endDate}
          onChange={(event) => setEndDate(event.target.value)}
        />
      </div>
    </Card>
  );
}

export default memo(MetadataQuery);
