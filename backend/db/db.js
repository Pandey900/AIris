import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

function connect() {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
      console.log("Database connected");
    })
    .catch((error) => {
      console.log("Error connecting to database", error.message);
    });
}
export default connect;
