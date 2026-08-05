import { prisma } from "@/app/lib/prisma";

export class LineService {

  static slugify(name: string): string {

    return name
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  }

  static async findOrCreate(name?: string | null) {

    if (!name) {
      return null;
    }

    const slug = this.slugify(name);

    return prisma.productLine.upsert({

      where: {
        slug,
      },

      update: {
        name,
      },

      create: {
        name,
        slug,
      },

    });

  }

}