import { PrismaClient } from "@prisma/client-metatdata";

const prismaClientSingleton = () => {
  return new PrismaClient();
};

declare global {
  var prismaMetadata: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalThis.prismaMetadata ?? prismaClientSingleton();

globalThis.prismaMetadata = prisma;
