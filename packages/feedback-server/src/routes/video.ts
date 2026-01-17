/**
 * Video routes
 */

import { Hono } from "hono";

export const videoRouter = new Hono();

// TODO: Implement routes based on TypeSpec definitions
// See typespec/routes/video.tsp

videoRouter.post("/init", (c) => {
  return c.json({ message: "Init video upload - TODO" }, 201);
});

videoRouter.put("/:videoId/chunks/:chunkNumber", (c) => {
  const { videoId, chunkNumber } = c.req.param();
  return c.json({ message: `Upload chunk ${chunkNumber} for ${videoId} - TODO` });
});

videoRouter.post("/:videoId/complete", (c) => {
  const videoId = c.req.param("videoId");
  return c.json({ message: `Complete upload ${videoId} - TODO` });
});

videoRouter.get("/:videoId", (c) => {
  const videoId = c.req.param("videoId");
  return c.json({ message: `Get video ${videoId} - TODO` });
});

videoRouter.get("/:videoId/stream", (c) => {
  const videoId = c.req.param("videoId");
  return c.json({ message: `Stream video ${videoId} - TODO` });
});

videoRouter.get("/:videoId/thumbnail", (c) => {
  const videoId = c.req.param("videoId");
  return c.json({ message: `Get thumbnail ${videoId} - TODO` });
});

videoRouter.delete("/:videoId", (c) => {
  const videoId = c.req.param("videoId");
  return c.json({ message: `Delete video ${videoId} - TODO` }, 204);
});

videoRouter.get("/", (c) => {
  return c.json({ message: "List videos - TODO" });
});
