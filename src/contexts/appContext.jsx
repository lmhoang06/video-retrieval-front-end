import React, { createContext, useContext, useState } from "react";
import processQueryResult from "@/components/queryInput/processQueryResult";
import axios from "axios";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  /**
   * [{
   *  video_name: ...,
   *  frame_idx: ...,
   *  similarity_score: ...,
   *  src: ...
   * }, ...]
   */
  const [images, setImages] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [settings, setSettings] = useState({
    DRES: {
      username: process.env.AIC_USERNAME,
      password: process.env.AIC_PASSWORD,
      Login_URL: process.env.DRES_LOGIN_URL,
      Submit_URL: process.env.DRES_SUBMIT_URL,
    },
  });
  const [topk, setTopk] = useState(32);

  async function queryImage(accessToken, query, queryType) {
    const formData = new FormData();
    formData.append("query", query);
    formData.append("queryType", queryType);
    formData.append("topk", topk);

    let results = await axios.post(
      "https://oriskany-clip-api.hf.space/retrieval",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          "ngrok-skip-browser-warning": "nothing",
        },
      }
    );

    if (results["status"] != 200 || results["status"] != 302) {
      throw Error("Failed to kNN!");
    }

    results = results["data"]["details"];

    setImages(await processQueryResult(accessToken, results, 18));
  }

  const value = {
    images,
    setImages,
    sessionId,
    setSessionId,
    settings,
    setSettings,
    topk,
    setTopk,
    queryImage,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);
