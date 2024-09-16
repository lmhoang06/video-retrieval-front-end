import { prisma } from "@/app/api/metadata/database";

export async function GET(request, { params }) {
  const videoName = params.videoName;
  const frameName = params.frameName;

  const frameNumber = parseInt(frameName.replace(/\.jpg$/, ""), 10);

  if (isNaN(frameNumber)) {
    return Response.json(
      { error: "Invalid frameName format" },
      { status: 400 }
    );
  }

  let results = await prisma.frameData.findFirst({
    where: {
      videoMetadata: {
        videoName: {
          equals: videoName,
        },
      },
      n: {
        equals: frameNumber,
      },
    },
  });

  return new Response(JSON.stringify(results), { status: 200 });
}
