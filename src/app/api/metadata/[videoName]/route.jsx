import { prisma } from "@/app/api/metadata/database";

export async function GET({ params }) {
  const videoName = params.videoName;

  let results = await prisma.videoMetadata.findFirst({
    where: {
      videoName: {
        equals: videoName,
      },
    },
  });

  delete results.id;

  return new Response(JSON.stringify(results), { status: 200 });
}
