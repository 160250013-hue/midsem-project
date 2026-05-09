import dotenv from "dotenv";
import app from "./app.js";

dotenv.config();

console.log("CLIENT ID:", process.env.GOOGLE_CLIENT_ID);
console.log("SECRET:", process.env.GOOGLE_CLIENT_SECRET);

// Log OAuth env availability at startup without printing sensitive values.
console.log("[auth/google] env check", {
  GOOGLE_CLIENT_ID: Boolean(process.env.GOOGLE_CLIENT_ID),
  GOOGLE_CLIENT_SECRET: Boolean(process.env.GOOGLE_CLIENT_SECRET),
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL || "missing"
});

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
