const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();

app.use(cors());
app.use(express.json());

app.use("/api/todos", require("./routes/todoRoutes"));

module.exports = app;
