require("dotenv").config();
const express = require("express");
const path = require("path");

const todoRoutes = require("./routes/todoRoutes");
const { notFound } = require("./controllers/errorController");

const app = express();

// указание шаблонизатора
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

// middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public"))); // если понадобится

// роуты
app.use("/", todoRoutes);

// 404
app.use(notFound);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
