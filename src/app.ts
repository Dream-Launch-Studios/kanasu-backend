import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";

import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRouter";
import cohortRouter from "./routes/cohortRoute";
import studentRouter from "./routes/studentsRoute";
import teacherRouter from "./routes/teacherRoute";
import anganwadiRouter from "./routes/anganwadiRoutes";
import topicRouter from "./routes/topicRoute";
import questionRouter from "./routes/questionRoute";
import studentResponseRouter from "./routes/studentResponseRoute";
import assessmentSessionRouter from "./routes/assessmentSessionRoute";
import csvImportRouter from "./routes/csvImportRoute";
import globalAssessmentRouter from "./routes/globalAssessmentRoute";

const app = express();

app.use(cors());
app.use(helmet());
app.use(compression());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/cohorts", cohortRouter);
app.use("/api/students", studentRouter);
app.use("/api/teachers", teacherRouter);
app.use("/api/anganwadis", anganwadiRouter);
app.use("/api/topics", topicRouter);
app.use("/api/questions", questionRouter);
app.use("/api/student-responses", studentResponseRouter);
app.use("/api/assessment-sessions", assessmentSessionRouter);
app.use("/api/csv-import", csvImportRouter);
app.use("/api/global-assessments", globalAssessmentRouter);

export default app;
