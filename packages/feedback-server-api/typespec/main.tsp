import "@typespec/http";
import "@typespec/rest";
import "@typespec/openapi3";
import "@typespec/openapi";
import "@typespec/json-schema";

import "./models/feedback.tsp";
import "./models/video.tsp";
import "./routes/feedback.tsp";
import "./routes/video.tsp";
import "./routes/health.tsp";
import "./websocket/events.tsp";
import "./websocket/commands.tsp";

using Http;
using Rest;
using OpenAPI;

/** Feedback Server API for collecting and managing user feedback with video recordings */
@service(#{ title: "Feedback Server API" })
@info(#{ version: "1.0.0" })
@server("http://localhost:3000", "Local development server")
namespace FeedbackServer;
