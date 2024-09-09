import { prisma } from "@/app/api/database";

export async function POST(request) {
  // Parse the request body to get the user-supplied object
  const body = await request.json();

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
      objects: {
        some: {
          className: {
            in: classNameList,
          },
        },
      },
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
        if (expectedCount !== 0 && actualCounts.get(className) !== expectedCount) {
          return false;
        }
      }

      return true;
    })
    .map(({ videos: { videoName }, frameName }) => ({
      videoName: videoName,
      frameName: frameName,
    }));

  return new Response(JSON.stringify(images), { status: 200 });
}
