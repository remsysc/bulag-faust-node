import { Category, Prisma } from "@prisma/client";
import * as categoryRepository from "./category.repository";
import { NotFoundException } from "@/common/errors/NotFoundException";
import { Pageable } from "@/common/types/entities";
import { DuplicateResourceException } from "@/common/errors/DuplicateResourceException";
import { isPrismaError } from "@/common/utils/isPrismaError";

export const findAll = async (pageable: Pageable) => {
  return categoryRepository.findAll(pageable);
};

export const findById = async (id: string): Promise<Category> => {
  const category = await categoryRepository.findById(id);
  if (!category) throw new NotFoundException("Category not found");
  return category;
};

export const createCategory = async (name: string): Promise<Category> => {
  try {
    return categoryRepository.createCategory(name);
  } catch (err) {
    if (isPrismaError(err, "P2002")) {
      const target = err.meta?.target;
      if (Array.isArray(target) && target.includes("name")) {
        throw new DuplicateResourceException("Category", "name");
      }
    }
    throw err;
  }
};

export const updateCategoryById = async (
  id: string,
  name: string,
): Promise<Category> => {
  try {
    const category = await categoryRepository.updateCategoryById(id, name);
    return category;
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      const target = err.meta?.target;
      if (Array.isArray(target) && target.includes("name")) {
        throw new DuplicateResourceException("Category", "name");
      }
    } else if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      throw new NotFoundException("Category not found");
    }
    throw err;
  }
};

export const deleteCategoryById = async (id: string): Promise<void> => {
  try {
    await categoryRepository.deleteById(id);
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      throw new NotFoundException("Category not found");
    }
    throw err;
  }
};
