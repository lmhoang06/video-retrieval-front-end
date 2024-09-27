import { prisma } from "@/app/api/metadata/database";

export default async function metadataQuery(query) {
  const { videoNames, startDate, endDate } = query;

  let whereClause = {};

  if (videoNames && Array.isArray(videoNames) && videoNames.length > 0) {
    whereClause.videoName = {
      in: videoNames,
    };
  }

  if (startDate || endDate) {
    whereClause.publishDate = {};

    if (startDate) {
      whereClause.publishDate.gte = startDate;
    }

    if (endDate) {
      whereClause.publishDate.lte = endDate;
    }
  }

  let results = await prisma.videoMetadata.findMany({
    select: {
      videoName: true,
      frameData: {
        select: {
          n: true,
        },
      },
    },
    where: whereClause,
  });

  results = results.reduce((prev, { videoName, frameData }) => {
    frameData.forEach(({ n }) => {
      prev.push({
        videoName: videoName,
        frameName: String(n).padStart(3, "0") + ".jpg",
      });
    });
    return prev;
  }, []);

  return results;
}
