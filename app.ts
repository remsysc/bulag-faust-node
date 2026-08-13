import prisma from "@/common/db/prisma";
import { RouteNotFoundException } from "@/common/errors/RouteNotFoundException";
import { errorHandler } from "@/common/middlewares/errorHandler.middleware";
import authRoutes from "@/modules/auth/auth.routes";
import categoryRoutes from "@/modules/category/category.routes";
import tagRoutes from "@/modules/tag/tag.routes";
import userRoutes from "@/modules/user/user.routes";
import postRoutes from "@/modules/post/post.routes";
import express, { NextFunction, Request, Response } from "express";
import { config, JWT_SECRET } from "@/config/config";

const app = express();
const PORT = process.env.PORT || 3000;
const secret = config.JWT_SECRET;

prisma.$connect().then(() => console.log("Database connected"));

// Parse incoming JSON bodies
app.use(express.json());

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/category", categoryRoutes);
app.use("/api/v1/tag", tagRoutes);
app.use("/api/v1/post", postRoutes);

app.use((req: Request, res: Response, next: NextFunction) => {
  const err = new RouteNotFoundException(`Cannot ${req.method} ${req.path}`);
  next(err);
});

app.use(errorHandler);
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

//TODO: REWRITE ALL SCHEMA VALIDATOR SERVICES to use prisma specific, create a utility helper for try catch for service
//TODO: FIX EXCEPTIONS NAMING AND USE A GENERIC CLASS AND GIVE IT A STRUCTURE,
// TODO:  FIX the ownership of public posts, ie  a unauthorized user can only see the public / published post of  a user
// while the owner can view all the posts
