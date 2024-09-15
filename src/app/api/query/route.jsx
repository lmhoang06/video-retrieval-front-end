/**
 * Muti-stage query REST API
 * User can give muti-stage query with different
 * This API will get request as an object with query parameter.
 * Query parameter is a list consist all stages for query. Each stage is an object consist information about query.
 * Stages are processed from first one (index 0) to last one.
 * Example stage object:
 * {
 *  type: text || image || objects
 *  queryData: {
 *      text: ... // for CLIP
 *      objects: {...} // for Objects
 *  }
 * }
 */

/**
 * Query data for each type:
 * text: {
 *  text: string,
 *  topk: int
 * }
 *
 * image: {
 *  image: image blob,
 *  topk: int
 * }
 *
 * objects: {
 *  objects: {
 *    className: number,
 *    ...
 *  }
 * }
 */

import axios from "axios";
import { prisma } from "@/app/api/objects/database";

async function textQuery(query, topk) {
  const formData = new FormData();
  formData.append("query", query);
  formData.append("queryType", "text");
  formData.append("topk", topk);

  const results = await axios.post(
    "https://oriskany-clip-api.hf.space/retrieval",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
        "ngrok-skip-browser-warning": "nothing",
      },
    }
  );

  if (results["status"] != 200 && results["status"] != 302) {
    throw Error("Text query with CLIP API failed!");
  }

  return results["data"]["details"].map(({ videoName, frameName }) => ({
    videoName,
    frameName,
  }));
}

async function convertBase64ToImage(src) {
  // Check if the string is a base64 string
  const isBase64 = /^[A-Za-z0-9+\/=]+$/.test(src);

  // Check if the string is a base64-encoded image
  const isBase64Image = /^data:image\/(jpg|jpeg|png|gif|bmp|svg);base64,/.test(
    src
  );

  if (isBase64 || isBase64Image) {
    // Convert base64 string to image
    return await fetch(src).then((res) => res.blob());
  } else {
    // Return original string
    return src;
  }
}

async function imageQuery(query, topk) {
  const formData = new FormData();
  formData.append("query", await convertBase64ToImage(query));
  formData.append("queryType", "image");
  formData.append("topk", topk);

  const results = await axios.post(
    "https://oriskany-clip-api.hf.space/retrieval",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
        "ngrok-skip-browser-warning": "nothing",
      },
    }
  );

  if (results["status"] != 200 && results["status"] != 302) {
    throw Error("Text query with CLIP API failed!");
  }

  return results["data"]["details"].map(({ videoName, frameName }) => ({
    videoName,
    frameName,
  }));
}

async function objectsQuery(objects) {
  const body = objects;

  // Extract keys (class names) and their corresponding values (counts)
  const classNameList = Object.keys(body);

  let images = await prisma.frames.findMany({
    select: {
      frameName: true,
      videos: {
        select: {
          videoName: true,
        },
      },
      objects: {
        select: {
          className: true,
          confidence: true,
          xywhn: true,
        },
      },
    },
    where: {
      AND: classNameList.map((className) => ({
        objects: {
          some: {
            className: className,
          },
        },
      })),
    },
  });

  images = images
    .filter(({ objects }) => {
      const actualCounts = new Map();

      objects.forEach((obj) => {
        actualCounts.set(
          obj.className,
          (actualCounts.get(obj.className) || 0) + 1
        );
      });

      for (const [className, expectedCount] of Object.entries(body)) {
        if (actualCounts.get(className) == undefined) {
          return false;
        }
        if (expectedCount == 0) {
          return true;
        }
        if (actualCounts.get(className) !== expectedCount) {
          return false;
        }
      }

      return true;
    })
    .map(({ videos: { videoName }, frameName }) => ({
      videoName: videoName,
      frameName: frameName,
    }));

  return images;
}

async function processStage(stage) {
  switch (stage.type) {
    case "text":
      return await textQuery(stage.queryData.text, stage.queryData.topk);
    case "image":
      return await imageQuery(stage.queryData.image, stage.queryData.topk);
    case "objects":
      return await objectsQuery(stage.queryData);
    default:
      console.warn(`Skipping unsupported stage type: ${stage.type}`);
  }

  return [];
}

export async function POST(request) {
  const body = await request.json();
  const { query: stages } = body;
  const maxObjectCalls = 2,
    maxTextImageCalls = 1;

  if (stages.length === 0) {
    return new Response(JSON.stringify("No stage to process!"), {
      status: 400,
    });
  }

  let results = [];
  let resultSet = new Set();
  let isFirstValidStage = true;

  // Group stages by type
  const groupedStages = stages.reduce((acc, stage) => {
    if (["text", "image", "objects"].includes(stage.type)) {
      acc[stage.type] = acc[stage.type] || [];
      acc[stage.type].push(stage);
    }
    return acc;
  }, {});

  // Process grouped stages
  while (Object.keys(groupedStages).length > 0) {
    const stagePromises = [];

    // Process objects queries
    for (
      let i = 0;
      i < maxObjectCalls &&
      groupedStages.objects &&
      groupedStages.objects.length > 0;
      i++
    ) {
      const objectsStage = groupedStages.objects.shift();
      stagePromises.push(processStage(objectsStage));
    }
    if (groupedStages.objects && groupedStages.objects.length === 0)
      delete groupedStages.objects;

    // Process text or image queries
    const textImageTypes = ["text", "image"].filter(
      (type) => groupedStages[type]
    );
    for (let i = 0; i < maxTextImageCalls && textImageTypes.length > 0; i++) {
      const type = textImageTypes[i % textImageTypes.length];
      const stage = groupedStages[type].shift();
      stagePromises.push(processStage(stage));
      if (groupedStages[type].length === 0) {
        delete groupedStages[type];
        textImageTypes.splice(textImageTypes.indexOf(type), 1);
      }
    }

    // Wait for current batch of stages to complete
    let stageResults = await Promise.all(stagePromises);

    // Process results
    for (const currentResults of stageResults) {
      if (isFirstValidStage) {
        results = currentResults;
        resultSet = new Set(
          results.map(({ videoName, frameName }) => `${videoName}:${frameName}`)
        );
        isFirstValidStage = false;
      } else {
        const newResultSet = new Set();
        for (const result of currentResults) {
          const id = `${result.videoName}:${result.frameName}`;
          if (resultSet.has(id)) {
            newResultSet.add(id);
          }
        }
        resultSet = newResultSet;
      }

      // If no results match across stages, we can exit early
      if (resultSet.size === 0) {
        return new Response(JSON.stringify([]), { status: 200 });
      }
    }
  }

  // Final filtering of results
  results = results.filter(({ videoName, frameName }) =>
    resultSet.has(`${videoName}:${frameName}`)
  );

  return new Response(JSON.stringify(results), { status: 200 });
}
