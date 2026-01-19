#! /usr/bin/env bun
import { serve } from "bun";
import { readFileSync, existsSync } from "fs";
import { join, extname } from "path";

const PORT = parseInt(process.env.PORT || "5173");
const DIST_DIR = "/app/dist";

const mimeTypes: Record<string, string> = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

serve({
  port: PORT,
  fetch(req) {
    const url = new URL(req.url);
    let pathname = url.pathname;

    // Health check endpoint
    if (pathname === "/health") {
      return new Response(JSON.stringify({ status: "ok" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Try to serve the requested file
    let filePath = join(DIST_DIR, pathname);

    // If path is a directory or doesn't exist, try index.html (SPA fallback)
    if (!existsSync(filePath) || pathname === "/") {
      filePath = join(DIST_DIR, "index.html");
    }

    try {
      const content = readFileSync(filePath);
      const ext = extname(filePath);
      const contentType = mimeTypes[ext] || "application/octet-stream";

      return new Response(content, {
        headers: { "Content-Type": contentType },
      });
    } catch (e) {
      // Fallback to index.html for SPA routing
      try {
        const indexContent = readFileSync(join(DIST_DIR, "index.html"));
        return new Response(indexContent, {
          headers: { "Content-Type": "text/html" },
        });
      } catch {
        return new Response("Not Found", { status: 404 });
      }
    }
  },
});

console.log(`WebUI server running on port ${PORT}`);
