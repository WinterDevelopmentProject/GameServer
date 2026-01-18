// src/app.js : Express 앱 파일 (API 라우팅)

const express = require("express");
const cors = require("cors");

const healthRouter = require("./routes/health.route");
const metaRouter = require("./temp/meta.route");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/health", healthRouter);
app.use("/meta", metaRouter);

module.exports = app;