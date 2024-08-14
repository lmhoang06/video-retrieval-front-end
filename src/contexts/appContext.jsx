import React, { createContext, useContext, useState } from "react";

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
    }
  });

  const value = {
    images,
    setImages,
    sessionId,
    setSessionId,
    settings,
    setSettings,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);
