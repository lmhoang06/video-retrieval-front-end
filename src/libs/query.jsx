import axios from "axios";

export default async function submitQuery(textQuery = "", topK = 20) {
  let result = await axios.post(
    "https://nxquang-al-atiso-clip-full-api.hf.space/retrieval",
    {
      query_text: textQuery,
      topk: topK,
    },
    {
      headers: {
        "ngrok-skip-browser-warning": "nothing",
      },
    }
  );

  return result["data"]["details"];
}
