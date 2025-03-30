import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import { execSync } from "child_process";
import userRoutes from "./routes/user.routes";
import errorHandler from "./middlewares/errorHandler";

// Load environment variables
dotenv.config();

const port = process.env.PORT || 3000;
const app = express();

// Middleware setup
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Function to apply Prisma migrations automatically
const applyMigrations = async () => {
  try {
    console.log("🚀 Applying database migrations...");
    execSync("npx prisma migrate deploy", { stdio: "inherit" });
    console.log("✅ Migrations applied successfully.");
  } catch (error) {
    console.error("❌ Error applying migrations:", error);
    process.exit(1); // Exit process on migration failure
  }
};

// Test route
app.get("/", (req, res) => {
  res.send("Hello World");
});

// API routes
app.use("/api/v1", userRoutes);

// Error handling middleware
app.use(errorHandler);

// Apply migrations and start server
applyMigrations().then(() => {
  app.listen(port, () => {
    console.log(`🚀 Server is running on port ${port}`);
  });
});

export default app;
