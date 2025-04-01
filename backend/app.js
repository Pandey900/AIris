import express from "express";
import morgan from "morgan";
import connect from "./db/db.js";
import userRoutes from "./routes/user.routes.js";
import projectRoutes from "./routes/project.routes.js";
import messageRoutes from "./routes/message.routes.js";
import cookieParser from "cookie-parser";
import cors from "cors";
connect();
// Create express app
const app = express();
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/users", userRoutes);
app.use("/projects", projectRoutes);
app.use("/messages", messageRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Hello from server!" });
});
export default app;
