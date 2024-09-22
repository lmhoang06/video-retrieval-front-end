import { prisma } from "@/app/api/objects/database";

export default async function objectsQuery(queryData) {
    // Extract keys (class names)
    const classNameList = Object.keys(queryData);
  
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
        
        for (const [className, expectedCount] of Object.entries(queryData)) {
          if (!actualCounts.get(className)) {
            return false;
          }

          if (Number(expectedCount) == 0) {
            continue;
          }
          if (actualCounts.get(className) !== Number(expectedCount)) {
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