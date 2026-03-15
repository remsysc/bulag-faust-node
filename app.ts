import express, { NextFunction, Request, Response } from "express";
import "./src/db/index";
import { AppError } from "./src/errors/AppError";
import { errorHandler } from "./src/middlewares/errorHandler.middleware";

const app = express();
const PORT = process.env.PORT || 3000;

// Parse incoming JSON bodies
app.use(express.json());

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

app.use((req: Request, res: Response, next: NextFunction) => {
  const err = new AppError(`Cannot ${req.method} ${req.path}`, 404);
  next(err);
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
