require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { sequelize } = require("./models");

const categoryRoutes = require("./routes/categoryRoutes");
const todoRoutes = require("./routes/todoRoutes");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/categories", categoryRoutes);
app.use("/api/todos", todoRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Todo API is working" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  try {
    await sequelize.authenticate();
    console.log("DB connected");
  } catch (err) {
    console.error("DB NOT CONNECTED:", err.message);
  }
});
