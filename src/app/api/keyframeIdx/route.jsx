import fs from "fs/promises";
import path from "path";
import { parse } from "csv-parse/sync";

export async function GET(request) {
  const searchParams = request.nextUrl.searchParams;
  const videoName = searchParams.get("videoName");
  const frameName = searchParams.get("frameName");

  if (!videoName || !frameName) {
    return Response.json(
      { error: "Missing videoName or frameName parameter" },
      { status: 400 }
    );
  }

  const frameNumber = parseInt(frameName.replace(/\.jpg$/, ''), 10);

  if (isNaN(frameNumber)) {
    return Response.json(
      { error: "Invalid frameName format" },
      { status: 400 }
    );
  }

  try {
    const filePath = path.join(
      process.cwd(),
      "public/map-keyframes",
      `${videoName}.csv`
    );
    const fileContent = await fs.readFile(filePath, "utf-8");

    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });

    const matchingRecord = records.find(
      (record) => parseInt(record.n, 10) === frameNumber
    );

    if (matchingRecord) {
      return Response.json(
        { frameIdx: parseInt(matchingRecord.frame_idx, 10) },
        { status: 200 }
      );
    } else {
      return Response.json({ error: "Frame not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("Error reading or parsing CSV file:", error);
    return esponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
