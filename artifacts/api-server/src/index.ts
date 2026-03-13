import app from "./app";

// Default to 3001 locally; Replit sets PORT automatically
const port = Number(process.env["PORT"] ?? 3001);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  if (!process.env["PORT"]) {
    console.log(`  API: http://localhost:${port}/api/healthz`);
  }
});
