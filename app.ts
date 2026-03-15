import express, { NextFunction, Request, Response } from "express";
import "./src/db/index";
import { errorHandler } from "./src/middlewares/errorHandler.middleware";
import { RouteNotFoundException } from "./src/errors/RouteNotFoundException";
import authRoutes from "./src/routes/auth.routes";

const app = express();
const PORT = process.env.PORT || 3000;
const secret = process.env.JWT_SECRET;
if (!secret) throw new Error("JWT_SECRET is not defined");

// Parse incoming JSON bodies
app.use(express.json());

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/v1/auth", authRoutes);

app.use((req: Request, res: Response, next: NextFunction) => {
  const err = new RouteNotFoundException(`Cannot ${req.method} ${req.path}`);
  next(err);
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
