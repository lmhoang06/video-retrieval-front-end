import { prisma } from "@/app/api/database";

export async function GET(request) {
  const searchParams = request.nextUrl.searchParams;

  try {
    const videoName = searchParams.get("videoName");
    const frameName = searchParams.get("frameName");
    function addJpgExtension(str) {
      if (!str.toLowerCase().endsWith(".jpg")) {
        return str + ".jpg";
      }
      return str;
    }

    let objectsData = await prisma.objects.findMany({
      select: {
        className: true,
        confidence: true,
        xywhn: true,
        frames: {
          select: {
            frameName: true,
            videos: {
              select: {
                videoName: true,
              },
            },
          },
        },
      },
      where: {
        frames: {
          frameName: {
            equals: addJpgExtension(frameName),
          },
          videos: {
            videoName: {
              equals: videoName,
            },
          },
        },
      },
    });
    return new Response(JSON.stringify(objectsData), { status: 200 });
  } catch (err) {
    return new Response(err, { status: 500 });
  }
}
