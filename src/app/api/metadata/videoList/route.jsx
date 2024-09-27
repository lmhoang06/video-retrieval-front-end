import { prisma } from "@/app/api/metadata/database";

export async function GET() {
  let results = await prisma.videoMetadata.findMany({
    select: {
      videoName: true,
    },
  });

  return new Response(JSON.stringify(results), { status: 200 });
}
