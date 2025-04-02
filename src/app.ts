import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRouter";

const app = express();

app.use(cors());
app.use(helmet());
app.use(compression());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
export default app;
