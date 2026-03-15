import { Router } from "express";
import * as authController from "../controller/auth.controller";
import { validate } from "../middlewares/validator.middleware";
import { registerSchema, loginSchema } from "../validator/auth.validator";

const router = Router();

router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);

export default router;
