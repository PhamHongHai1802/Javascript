const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const User = require("./models/User");
const Task = require("./models/Task");

const app = express();

/* =============================
   MIDDLEWARE & VIEW ENGINE
============================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

/* =============================
   CONNECT MONGODB
============================= */
mongoose
  .connect("mongodb://localhost:27017/todoDB")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

/* =============================
   TẠO USER (password hash trong model)
============================= */
app.post("/users", async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/* =============================
   TẠO TASK (1 task thuộc 1 user)
============================= */
app.post("/tasks", async (req, res) => {
  try {
    const task = await Task.create(req.body);
    res.json(task);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/* =============================
   getAllTasks
============================= */
app.get("/tasks", async (req, res) => {
  const tasks = await Task.find().populate("userId", "username fullName");
  res.json(tasks);
});

/* =============================
   Lấy task theo username
============================= */
app.get("/tasks/user/:username", async (req, res) => {
  const user = await User.findOne({ username: req.params.username });
  if (!user) return res.json([]);

  const tasks = await Task.find({ userId: user._id });
  res.json(tasks);
});

/* =============================
   Task trong ngày hiện tại
============================= */
app.get("/tasks/today", async (req, res) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const tasks = await Task.find({
    createdAt: { $gte: start, $lte: end },
  });

  res.json(tasks);
});

/* =============================
   Task chưa hoàn thành
============================= */
app.get("/tasks/undone", async (req, res) => {
  const tasks = await Task.find({ done: false });
  res.json(tasks);
});

/* =============================
   Task của user họ 'Nguyễn'
============================= */
app.get("/tasks/nguyen", async (req, res) => {
  const users = await User.find({
    fullName: { $regex: /^Nguyễn/i },
  });

  const userIds = users.map((u) => u._id);

  const tasks = await Task.find({
    userId: { $in: userIds },
  }).populate("userId", "fullName");

  res.json(tasks);
});

/* =============================
    TRANG CHÍNH (EJS)
============================= */
app.get("/", async (req, res) => {
  const tasks = await Task.find().lean();

  const total = tasks.length;
  const done = tasks.filter((t) => t.done).length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  res.render("index", { tasks, percent });
});

/* =============================
    THÊM TASK TỪ FORM
============================= */
app.post("/add-task", async (req, res) => {
  try {
    const user = await User.findOne();

    if (!user) {
      return res.send("⚠️ Chưa có user trong database. Hãy tạo user trước.");
    }

    await Task.create({
      title: req.body.title,
      userId: user._id,
    });

    res.redirect("/");
  } catch (err) {
    res.send(err.message);
  }
});

/* =============================
    XÓA TASK
============================= */
app.post("/delete-task/:id", async (req, res) => {
  await Task.findByIdAndDelete(req.params.id);
  res.redirect("/");
});

/* =============================
    START SERVER
============================= */
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));