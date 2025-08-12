import axios from "axios";

const API_BASE_URL = "https://eventretrieval.one/api/v1";

export default async function submitFrame(video_id, frame, sessionID) {
  if (
    video_id === undefined ||
    video_id === null ||
    frame === undefined ||
    frame === null
  ) {
    throw new Error("video_id or frame is valid!!!");
  }

  if (sessionID === undefined || sessionID === null) {
    const { data } = await axios.post(`${API_BASE_URL}/login`, {
      username: process.env.AIC_USERNAME,
      password: process.env.AIC_PASSWORD,
    });
    sessionID = data.sessionID;
  }

  const { data } = await axios.get(`${API_BASE_URL}/submit`, {
    params: { item: video_id, frame, sessionID },
  });

  return data;
}
