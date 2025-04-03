import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRouter";
import cohortRouter from "./routes/cohortRoute";
import studentRouter from "./routes/studentsRoute";
import teacherRouter from "./routes/teacherRoute";

const app = express();

app.use(cors());
app.use(helmet());
app.use(compression());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/cohort", cohortRouter);
app.use("/api/students", studentRouter);
app.use("/api/teachers", teacherRouter);


export default app;
