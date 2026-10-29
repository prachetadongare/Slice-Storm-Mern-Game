require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();

app.use(cors());
app.use(express.json());

const allowedOrigins = [
  "http://localhost:5173",
  "https://slice-storm-game-git-master-pracheta-dongares-projects.vercel.app/",
];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());

app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "Slice Storm API is running",
  });
});

app.use("/api/auth", require("./routes/authRoutes"));

async function startServer() {
  await connectDB();

  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
