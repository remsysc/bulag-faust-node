import { Router } from "express";
import * as categoryController from "./category.controller";
import { authenticateToken } from "@/common/middlewares/auth.middleware";
import { requireRole } from "@/common/middlewares/requireRole.middleware";
import { validate } from "@/common/middlewares/validator.middleware";
import {
  paginationSchema,
  paramsIdSchema,
} from "@/common/schemas/common.schemas";

const router = Router();

router.get("/", validate(paginationSchema), categoryController.getCategories);
router.get(
  "/:categoryId",
  validate(paramsIdSchema("categoryId")),
  categoryController.getCategoryById,
);
router.post(
  "/",
  authenticateToken,
  requireRole("ROLE_ADMIN"),
  categoryController.createCategory,
);
router.put(
  "/:categoryId",
  authenticateToken,
  requireRole("ROLE_ADMIN"),
  validate(paramsIdSchema("categoryId")),
  categoryController.updateCategory,
);
router.delete(
  "/:categoryId",
  authenticateToken,
  requireRole("ROLE_ADMIN"),
  validate(paramsIdSchema("categoryId")),
  categoryController.deleteCategory,
);

export default router;
