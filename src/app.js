// src/app.js : Express 앱 파일 (API 라우팅)

import express from "express";
import cors from "cors";

import healthRouter from "./routes/health.route.js";
import metaRouter from "./temp/meta.route.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/health", healthRouter);
app.use("/meta", metaRouter);

export default app;