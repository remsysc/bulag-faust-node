import { catchAsync } from "@/common/utils/catchAsync";
import * as categoryService from "./category.service";
import { RequestHandler, Request, Response } from "express";
import { UUID } from "node:crypto";
import { assertAuthenticated } from "@/common/utils/assertAuthenticated";

export const getCategories = catchAsync(async (req: Request, res: Response) => {
  const categories = await categoryService.findAll(req.pageable);
  res.status(200).json({
    categories,
  });
});

export const getCategoryById = catchAsync(
  async (req: Request, res: Response) => {
    const categoryId = req.params.categoryId as string;
    const category = await categoryService.findById(categoryId);
    res.status(200).json({
      category,
    });
  },
);

export const createCategory = catchAsync(
  async (req: Request, res: Response) => {
    assertAuthenticated(req);
    const category = await categoryService.createCategory(req.body.name);
    res.status(201).json({
      category,
    });
  },
);

export const updateCategory = catchAsync(
  async (req: Request, res: Response) => {
    assertAuthenticated(req);
    const categoryId = req.params.categoryId as string;
    const category = await categoryService.updateCategoryById(
      categoryId,
      req.body.name,
    );
    res.status(200).json({
      category,
    });
  },
);

export const deleteCategory = catchAsync(
  async (req: Request, res: Response) => {
    assertAuthenticated(req);
    const categoryId = req.params.categoryId as UUID;
    await categoryService.deleteCategoryById(categoryId);
    res.status(204).send();
  },
);
