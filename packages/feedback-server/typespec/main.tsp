import "@typespec/http";
import "@typespec/rest";
import "@typespec/openapi3";

import "./models/feedback.tsp";
import "./models/video.tsp";
import "./routes/feedback.tsp";
import "./routes/video.tsp";
import "./routes/health.tsp";

using Http;
using Rest;

@service({
  title: "Feedback Server API",
  version: "1.0.0",
})
@server("http://localhost:3000", "Local development server")
namespace FeedbackServer;
