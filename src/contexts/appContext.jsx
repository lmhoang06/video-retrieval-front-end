import React, { createContext, useContext, useState } from "react";

const AppContext = createContext(null);

let data = [
  {
    imageLink:
      "https://images.unsplash.com/photo-1499696010180-025ef6e1a8f9?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80",
  },
  {
    imageLink:
      "https://images.unsplash.com/photo-1432462770865-65b70566d673?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80",
  },
  {
    imageLink:
      "https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2560&q=80",
  },
  {
    imageLink:
      "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2940&q=80",
  },
  {
    imageLink:
      "https://images.unsplash.com/photo-1518623489648-a173ef7824f3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2762&q=80",
  },
  {
    imageLink:
      "https://images.unsplash.com/photo-1682407186023-12c70a4a35e0?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2832&q=80",
  },
  {
    imageLink:
      "https://demos.creative-tim.com/material-kit-pro/assets/img/examples/blog5.jpg",
  },
  {
    imageLink:
      "https://material-taillwind-pro-ct-tailwind-team.vercel.app/img/content2.jpg",
  },
  {
    imageLink:
      "https://images.unsplash.com/photo-1620064916958-605375619af8?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1493&q=80",
  },
];

data = [...data, ...data, ...data, ...data, ...data, ...data];

export function AppProvider({ children }) {
  const [images, setImages] = useState(
    data.map(({ imageLink }, index) => ({
      video_name: index.toString(),
      frame_idx: index,
      similarity_score: (100 - index - 1) / 100,
      src: imageLink,
    }))
  );
  const [sessionId, setSessionId] = useState(null);
  const [settings, setSettings] = useState({
    DRES: {
      username: process.env.AIC_USERNAME,
      password: process.env.AIC_PASSWORD,
      Login_URL: process.env.DRES_LOGIN_URL,
      Submit_URL: process.env.DRES_SUBMIT_URL,
    },
    imagesSource: "https://1b3e-35-221-154-22.ngrok-free.app/img"
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
