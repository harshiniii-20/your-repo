import express, { type Express } from "express";
import cors from "cors";
import router from "./routes";

const app: Express = express();

// Allow requests from the local Vite dev server and any Replit preview domain
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
];

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow no-origin requests (curl, Postman) and matching origins
      if (!origin || allowedOrigins.includes(origin) || origin.includes("replit.dev")) {
        cb(null, true);
      } else {
        cb(null, true); // permissive for dev — tighten in production
      }
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "10mb" })); // 10 MB to handle base64 audio uploads
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
