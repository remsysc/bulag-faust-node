import prisma from "@/common/db/prisma";
import { Pageable, PageResponse } from "@/common/types/entities";
import { buildPageResponse } from "@/common/utils/pageResponse";
import { Tag } from "@prisma/client";

export const findAll = async (
  pageable: Pageable,
): Promise<PageResponse<Tag>> => {
  const [tags, meta] = await prisma.tag
    .paginate({
      orderBy: {
        [pageable.sort?.field || "createdAt"]:
          pageable.sort?.direction || "desc",
      },
    })
    .withPages({
      limit: pageable.size,
      page: pageable.page,
      includePageCount: true,
    });

  return {
    content: tags,
    page: meta.currentPage,
    size: pageable.size,
    totalElements: meta.totalCount,
    totalPages: meta.pageCount,
    last: meta.isLastPage,
    first: meta.isFirstPage,
    numberOfElements: tags.length,
  };
};

export const findById = async (id: string): Promise<Tag> => {
  return await prisma.tag.findUniqueOrThrow({ where: { id } });
};

export const createTag = async (name: string): Promise<Tag> => {
  return await prisma.tag.create({ data: { name } });
};

export const deleteById = async (id: string): Promise<void> => {
  await prisma.tag.delete({ where: { id } });
};

export const existsById = async (id: string): Promise<boolean> => {
  const count = await prisma.tag.count({ where: { id } });
  return count > 0;
};
