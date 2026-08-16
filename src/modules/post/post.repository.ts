import prisma from "@/common/db/prisma";
import { Post, Category, Tag, Prisma } from "@prisma/client";
import { CreatePostInput, UpdatePostInput } from "./post.schema";
import {
  FindAllOptions,
  PostResponse,
  postResponseSelect,
  PostWithRelations,
  postWithRelationsArgs,
} from "./post.types";
import { PageResponse } from "@/common/types/entities";

export const findAll = async ({
  filters,
  pageable,
}: FindAllOptions): Promise<PageResponse<PostResponse>> => {
  //get only posts where deletedAt is null
  const where: Prisma.PostWhereInput = {
    deletedAt: null,
  };
  //filters

  if (filters?.status) where.status = filters.status;
  if (filters?.authorId) where.authorId = filters.authorId;
  if (filters?.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { content: { contains: filters.search, mode: "insensitive" } },
    ];
  }
  if (filters?.categoryId) {
    where.postCategories = {
      some: {
        categoryId: filters.categoryId,
      },
    };
  }
  if (filters?.tagId) {
    where.postTags = {
      some: {
        tagId: filters.tagId,
      },
    };
  }
  const [posts, meta] = await prisma.post
    .paginate({
      where,
      select: postResponseSelect,
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
    content: posts,
    page: meta.currentPage,
    size: pageable.size,
    totalElements: meta.totalCount!,
    totalPages: meta.pageCount!,
    last: meta.isLastPage,
    first: meta.isFirstPage,
    numberOfElements: posts.length,
  };
};

export const findById = async (id: string): Promise<Post | null> => {
  return await prisma.post.findUnique({
    where: { id, deletedAt: null },
  });
};

export const findByIdWithRelations = async (
  id: string,
): Promise<PostWithRelations | null> => {
  return await prisma.post.findFirst({
    where: { id, deletedAt: null },
    include: postWithRelationsArgs.include,
  });
};

export const findCategoriesByPostId = async (
  postId: string,
): Promise<Category[]> => {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      postCategories: {
        include: { category: true },
      },
    },
  });
  return post?.postCategories.map((pc) => pc.category) ?? [];
};

export const findTagsByPostId = async (postId: string): Promise<Tag[]> => {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      postTags: {
        include: { tag: true },
      },
    },
  });
  return post?.postTags.map((pt) => pt.tag) ?? [];
};

export const createPost = async (
  input: CreatePostInput & { authorId: string },
): Promise<Post> => {
  const { title, content, authorId, categoryIds = [], tagIds = [] } = input;

  return await prisma.post.create({
    data: {
      title,
      content,
      author: {
        connect: { id: authorId },
      },
      postCategories: {
        create: categoryIds.map((id) => ({
          category: { connect: { id } },
        })),
      },
      postTags: {
        create: tagIds.map((id) => ({
          tag: { connect: { id } },
        })),
      },
    },
  });
};

export const updatePost = async (
  input: UpdatePostInput,
): Promise<PostWithRelations> => {
  const { postId, title, content, categoryIds, tagIds } = input;

  return await prisma.post.update({
    where: {
      id: postId,
      deletedAt: null,
    },
    data: {
      title,
      content,
      postCategories: categoryIds
        ? {
            deleteMany: {},
            create: categoryIds.map((id: string) => ({
              category: { connect: { id } },
            })),
          }
        : undefined,
      postTags: tagIds
        ? {
            deleteMany: {},
            create: tagIds.map((id: string) => ({
              tag: { connect: { id } },
            })),
          }
        : undefined,
    },
    include: postWithRelationsArgs.include,
  });
};

export const deleteById = async (
  id: string,
  authorId: string,
): Promise<void> => {
  await prisma.post.update({
    where: { id, deletedAt: null, authorId },
    data: {
      deletedAt: new Date(),
    },
  });
};

export const attachCategories = async (
  postId: string,
  categoryIds: string[],
): Promise<void> => {
  if (categoryIds.length === 0) return;
  await prisma.postCategory.createMany({
    data: categoryIds.map((categoryId) => ({
      postId,
      categoryId,
    })),
  });
};

export const attachTags = async (
  postId: string,
  tagIds: string[],
): Promise<void> => {
  if (tagIds.length === 0) return;
  await prisma.postTag.createMany({
    data: tagIds.map((tagId) => ({
      postId,
      tagId,
    })),
  });
};
