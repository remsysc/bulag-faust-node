import { Tag } from "@prisma/client";
import * as tagRepository from "./tag.repository";
import { NotFoundException } from "@/common/errors/NotFoundException";
import { Pageable, PageResponse } from "@/common/types/entities";
import { Prisma } from "@prisma/client";
import { isPrismaError } from "@/common/utils/isPrismaError";
import { DuplicateResourceException } from "@/common/errors/DuplicateResourceException";

export const findAll = async (
  pageable: Pageable,
): Promise<PageResponse<Tag>> => {
  return await tagRepository.findAll(pageable);
};

export const findById = async (id: string): Promise<Tag> => {
  try {
    return tagRepository.findById(id);
  } catch (err) {
    throw new NotFoundException("Category not found");
  }
};

export const createTag = async (name: string): Promise<Tag> => {
  try {
    const tag = await tagRepository.createTag(name);
    return tag;
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      const target = err.meta?.target;
      if (Array.isArray(target) && target.includes("name")) {
        throw new DuplicateResourceException("Tag", "name");
      }
    }
    throw err;
  }
};

export const deleteById = async (id: string): Promise<void> => {
  const tag = await tagRepository.findById(id).catch((err) => {
    if (isPrismaError(err, "P2025")) {
      throw new NotFoundException("Tag not found");
    }
    throw err;
  });

  const postCount = await tagRepository.countPostsByTagId(id);
  if (postCount > 0) {
    //impl ConflictException
    throw new Error(
      `Cannot deactivate tag: ${postCount} post(s) still reference it`,
    );
  }
  await tagRepository.deactivateById(id);
};
