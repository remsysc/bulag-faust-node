import { NextFunction, Request, RequestHandler, Response } from "express";
import * as postService from "./post.services";
import { catchAsync } from "@/common/utils/catchAsync";
import { assertAuthenticated } from "@/common/utils/assertAuthenticated";

export const create = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    assertAuthenticated(req);
    const postData = req.body;
    const newPost = await postService.createPost(postData, req.user.userId);
    res.status(201).json(newPost);
  },
);

export const getAllPosts: RequestHandler = catchAsync(async (req, res) => {
  const requestingUserId = req.user?.userId;
  const filters = req.filters ?? {};

  // Unauthenticated users and users viewing someone else's posts only see published content.
  // An authenticated user can see their own non-published posts by explicitly filtering by their authorId.
  if (!requestingUserId || filters.authorId !== requestingUserId) {
    filters.status = "published";
  }

  const posts = await postService.getAllPosts(req.pageable, filters);
  res.status(200).send({ posts });
});

export const getPostById: RequestHandler = catchAsync(async (req, res) => {
  const post = await postService.getPostById(
    req.params.postId as string,
    req.user?.userId,
  );
  res.status(200).json(post);
});

export const deletePost = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    assertAuthenticated(req);
    await postService.deletePostById(
      req.params.postId as string,
      req.user.userId,
    );
    res.status(204).send();
  },
);
