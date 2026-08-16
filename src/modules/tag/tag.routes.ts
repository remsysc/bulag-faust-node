import { Router } from "express";
import * as tagController from "./tag.controller";
import { authenticateToken } from "@/common/middlewares/auth.middleware";
import { requireRole } from "@/common/middlewares/requireRole.middleware";
import { validate } from "@/common/middlewares/validator.middleware";
import {
  paginationSchema,
  paramsIdSchema,
} from "@/common/schemas/common.schemas";
const router = Router();

router.get("/", validate(paginationSchema), tagController.getTags);
router.get(
  "/:tagId",
  validate(paramsIdSchema("tagId")),
  tagController.getTagById,
);
router.post("/", authenticateToken, tagController.createTag);
router.delete(
  "/:tagId",
  authenticateToken,
  validate(paramsIdSchema("tagId")),
  tagController.deleteById,
);

export default router;
