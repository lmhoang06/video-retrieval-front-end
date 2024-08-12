"use client";

import axios from "axios";
import pLimit from "p-limit";

const MS_GRAPH_API = "https://graph.microsoft.com/v1.0";

const DRIVE_ID_LIST = [
  "b!0y2sxeQGV0-UPjZAgg0zL6ijEoU73q5DuxNFsT_aO6GWFg1zpn0qTJyu2Zt16imE", // 10CL - LMH (L21 -> L36)
  "b!C7MJtUkO10-XYMQNroV5OKijEoU73q5DuxNFsT_aO6GWFg1zpn0qTJyu2Zt16imE", // 10CL - THMH (L01 -> L10)
];

const getImageData = async (accessToken, videoName, frameName) => {
  const l_id = parseInt(videoName.slice(1, 3), 10);

  if (10 < l_id && l_id < 21) return null;
  
  const DRIVE_ID = 20 < l_id ? DRIVE_ID_LIST[0] : DRIVE_ID_LIST[1];
  try {
    const apiResult = await axios.get(
      `${MS_GRAPH_API}/drives/${DRIVE_ID}/root:/AIC2024/Keyframes/${videoName}/${frameName}?$select=@microsoft.graph.downloadUrl`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        timeout: 2500,
      }
    );

    const response = await axios.get(
      apiResult.data["@microsoft.graph.downloadUrl"],
      {
        timeout: 2500,
        responseType: "arraybuffer",
      }
    );

    return `data:image/jpeg;base64,${Buffer.from(
      response.data,
      "binary"
    ).toString("base64")}`;
  } catch (error) {
    console.error(`Error fetching image data: ${error.message}`);
    return null;
  }
};

const processResult = async (item, accessToken) => {
  try {
    const videoName = item.video;
    const frameName = item.frame_name;
    const distance = item.distance;

    const src = await getImageData(accessToken, videoName, frameName);

    return {
      video_name: videoName,
      frame_idx: parseInt(frameName.replace(".jpg", "").replace(/^0+/, ""), 10),
      similarity_score: distance,
      src: src,
    };
  } catch (error) {
    console.error(`Error processing result: ${error}`);
    return null;
  }
};

export default async function processQueryResult(
  accessToken,
  queryResult,
  processBatchSize
) {
  const limit = pLimit(processBatchSize);

  const results = await Promise.all(
    queryResult.map((item) => limit(() => processResult(item, accessToken)))
  );

  return results
    .filter(Boolean)
    .filter(({ src }) => Boolean(src))
    .sort((a, b) => b.similarity_score - a.similarity_score);
}
