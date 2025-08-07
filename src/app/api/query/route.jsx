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

const objectURLToBlob = async (objectURL) => {
  try {
    // Fetch the objectURL to get the Blob
    const response = await fetch(objectURL);

    // Check if the response is OK
    if (!response.ok) {
      throw new Error(`Failed to fetch the object URL: ${response.statusText}`);
    }

    // Convert response to Blob
    const blob = await response.blob();
    return blob;
  } catch (error) {
    console.error("Error converting objectURL to Blob:", error);
    return null;
  }
};

async function imageQuery(query, topk) {
  const formData = new FormData();
  formData.append("query", await objectURLToBlob(query));
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

async function processStage(stage) {
  switch (stage.type) {
    case "text":
      return await textQuery(stage.queryData.text, stage.queryData.topk);
    case "image":
      return await imageQuery(stage.queryData.image, stage.queryData.topk);
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
    if (["text", "image", "objects", "metadata"].includes(stage.type)) {
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
      groupedStages?.objects &&
      groupedStages?.objects.length > 0;
      i++
    ) {
      const objectsStage = groupedStages.objects.shift();
      stagePromises.push(processStage(objectsStage));
    }
    if (groupedStages?.objects && groupedStages.objects.length === 0)
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
