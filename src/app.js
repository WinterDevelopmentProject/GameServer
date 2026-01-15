const express = require("express");
const cors = require("cors");

const healthRouter = require("./routes/health.route");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/health", healthRouter);

module.exports = app;