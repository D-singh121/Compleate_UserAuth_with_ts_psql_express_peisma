import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import userRoutes from "./routes/user.routes";

// Load environment variables
dotenv.config();

const port = process.env.PORT || 3000;
const app = express();

// middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

// test routes
app.get("/", (req, res) => {
  res.send("Hello World");
});
// routes
app.use("/api/v1", userRoutes);

// server listening
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
