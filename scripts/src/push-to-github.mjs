/**
 * Pushes all project files to GitHub via the REST API (no git CLI needed).
 * Handles empty repos by initializing with a README first.
 */

import { execSync } from "child_process";
import { readFileSync } from "fs";
import path from "path";

const OWNER = "harshiniii-20";
const REPO = "your-repo";
const BRANCH = "main";
const TOKEN = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
const ROOT = "/home/runner/workspace";

if (!TOKEN) {
  console.error("GITHUB_PERSONAL_ACCESS_TOKEN is not set");
  process.exit(1);
}

async function api(endpoint, options = {}) {
  const res = await fetch(`https://api.github.com${endpoint}`, {
    ...options,
    headers: {
      Authorization: `token ${TOKEN}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.github.v3+json",
      ...(options.headers ?? {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${res.status}: ${body.message ?? JSON.stringify(body)}`);
  return body;
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function createBlob(content) {
  return api(`/repos/${OWNER}/${REPO}/git/blobs`, {
    method: "POST",
    body: JSON.stringify({
      content: Buffer.from(content).toString("base64"),
      encoding: "base64",
    }),
  });
}

function getFiles() {
  return execSync(
    `find . -type f \
      ! -path './.git/*' \
      ! -path '*/node_modules/*' \
      ! -path '*/dist/*' \
      ! -path '*/.local/*' \
      ! -path '*/pnpm-lock.yaml' \
      ! -path '*/tsconfig.tsbuildinfo' \
      ! -path '*/.cache/*' \
      ! -path '*/public/images/*' \
      ! -name '*.log' \
      -print`,
    { cwd: ROOT }
  ).toString().trim().split("\n").map(f => f.replace(/^\.\//, "")).filter(Boolean);
}

async function run() {
  console.log("🚀 Pushing SecureWatch to GitHub...\n");

  // Step 1: Initialize the repo with a README if it's empty
  let baseSha = null;
  let baseTreeSha = null;

  try {
    const ref = await api(`/repos/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`);
    baseSha = ref.object.sha;
    const commit = await api(`/repos/${OWNER}/${REPO}/git/commits/${baseSha}`);
    baseTreeSha = commit.tree.sha;
    console.log(`✓ Branch '${BRANCH}' exists — base: ${baseSha.slice(0, 7)}`);
  } catch {
    console.log("Branch not found — initializing repo with README...");

    // Use simple contents API to create the first file (initializes the repo)
    await api(`/repos/${OWNER}/${REPO}/contents/README.md`, {
      method: "PUT",
      body: JSON.stringify({
        message: "chore: initialize repository",
        content: Buffer.from(
          "# SecureWatch — Security Intelligence Dashboard\n\nFull-stack security platform. See full commit for details.\n"
        ).toString("base64"),
        branch: BRANCH,
      }),
    });

    await sleep(1500); // Wait for GitHub to process

    const ref = await api(`/repos/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`);
    baseSha = ref.object.sha;
    const commit = await api(`/repos/${OWNER}/${REPO}/git/commits/${baseSha}`);
    baseTreeSha = commit.tree.sha;
    console.log(`✓ Repo initialized, base commit: ${baseSha.slice(0, 7)}`);
  }

  // Step 2: Upload blobs (process sequentially to avoid rate limits)
  const files = getFiles();
  console.log(`\n📦 Uploading ${files.length} files...\n`);

  const treeItems = [];
  let done = 0;
  let skipped = 0;

  for (const relPath of files) {
    const absPath = path.join(ROOT, relPath);
    try {
      const content = readFileSync(absPath);
      let attempts = 0;
      let blob;
      while (attempts < 3) {
        try {
          blob = await api(`/repos/${OWNER}/${REPO}/git/blobs`, {
            method: "POST",
            body: JSON.stringify({
              content: content.toString("base64"),
              encoding: "base64",
            }),
          });
          break;
        } catch (err) {
          attempts++;
          if (attempts >= 3) throw err;
          await sleep(500 * attempts);
        }
      }
      treeItems.push({ path: relPath, mode: "100644", type: "blob", sha: blob.sha });
      done++;
      if (done % 25 === 0) process.stdout.write(`  ${done}/${files.length}...\n`);
    } catch (err) {
      skipped++;
      if (skipped <= 5) console.warn(`  ⚠ Skipped ${relPath}: ${err.message.slice(0, 80)}`);
    }

    // Small delay between uploads to avoid secondary rate limits
    await sleep(50);
  }

  console.log(`\n✅ ${done} files uploaded${skipped > 0 ? `, ${skipped} skipped` : ""}`);

  // Step 3: Create git tree
  console.log("\n🌲 Creating tree...");
  const tree = await api(`/repos/${OWNER}/${REPO}/git/trees`, {
    method: "POST",
    body: JSON.stringify({ tree: treeItems, base_tree: baseTreeSha }),
  });
  console.log(`   Tree: ${tree.sha.slice(0, 7)}`);

  // Step 4: Create commit
  console.log("📝 Creating commit...");
  const commit = await api(`/repos/${OWNER}/${REPO}/git/commits`, {
    method: "POST",
    body: JSON.stringify({
      message: "feat: SecureWatch — Security Intelligence Dashboard\n\n- Speech Emotion Recognition (SER) with real-time emotion timeline\n- Login Attempt Visualization with charts and IP geolocation\n- AI-Based Anomaly Detection with risk scoring & recommendations\n- Blockchain-Based immutable audit logs (SHA-256 proof-of-work)\n- JWT authentication (admin/admin123, operator/operator123)\n- React + TailwindCSS frontend (dark cyberpunk theme)\n- Node.js + Express 5 + PostgreSQL + Drizzle ORM backend\n- Audio file upload support for SER analysis",
      tree: tree.sha,
      parents: [baseSha],
      author: {
        name: "harshiniii-20",
        email: "harshiniii-20@users.noreply.github.com",
        date: new Date().toISOString(),
      },
    }),
  });
  console.log(`   Commit: ${commit.sha.slice(0, 7)}`);

  // Step 5: Update branch
  console.log(`🔗 Updating branch '${BRANCH}'...`);
  await api(`/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`, {
    method: "PATCH",
    body: JSON.stringify({ sha: commit.sha, force: true }),
  });

  console.log(`\n🎉 Done! View at: https://github.com/${OWNER}/${REPO}`);
}

run().catch(err => {
  console.error("\n❌ Failed:", err.message);
  process.exit(1);
});
