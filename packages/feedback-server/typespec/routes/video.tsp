import "@typespec/http";
import "@typespec/rest";
import "../models/video.tsp";

using Http;
using Rest;

namespace FeedbackServer.Routes;

@route("/api/v1/videos")
@tag("Videos")
interface VideoRoutes {
  /**
   * Initialize a video upload
   */
  @post
  @route("/init")
  @summary("Initialize video upload")
  initUpload(
    @body body: Models.InitVideoUploadRequest,
  ): {
    @statusCode statusCode: 201;
    @body body: Models.InitVideoUploadResponse;
  };

  /**
   * Upload a video chunk
   */
  @put
  @route("/{videoId}/chunks/{chunkNumber}")
  @summary("Upload video chunk")
  uploadChunk(
    @path videoId: string,
    @path chunkNumber: int32,
    @header contentType: "application/octet-stream",
    @body chunk: bytes,
  ): Models.ChunkUploadResponse;

  /**
   * Complete video upload
   */
  @post
  @route("/{videoId}/complete")
  @summary("Complete video upload")
  completeUpload(
    @path videoId: string,
    @body body: Models.CompleteVideoUploadRequest,
  ): Models.Video;

  /**
   * Get video metadata
   */
  @get
  @route("/{videoId}")
  @summary("Get video metadata")
  get(
    @path videoId: string,
  ): Models.Video | {
    @statusCode statusCode: 404;
    @body body: {
      error: string;
      message: string;
    };
  };

  /**
   * Get video stream
   */
  @get
  @route("/{videoId}/stream")
  @summary("Stream video")
  stream(
    @path videoId: string,
    @header range?: string,
  ): {
    @header contentType: string;
    @header acceptRanges: "bytes";
    @header contentRange?: string;
    @body body: bytes;
  } | {
    @statusCode statusCode: 404;
    @body body: {
      error: string;
      message: string;
    };
  };

  /**
   * Get video thumbnail
   */
  @get
  @route("/{videoId}/thumbnail")
  @summary("Get video thumbnail")
  thumbnail(
    @path videoId: string,
  ): {
    @header contentType: "image/jpeg";
    @body body: bytes;
  } | {
    @statusCode statusCode: 404;
    @body body: {
      error: string;
      message: string;
    };
  };

  /**
   * Delete video
   */
  @delete
  @route("/{videoId}")
  @summary("Delete video")
  delete(
    @path videoId: string,
  ): {
    @statusCode statusCode: 204;
  } | {
    @statusCode statusCode: 404;
    @body body: {
      error: string;
      message: string;
    };
  };

  /**
   * List videos for a project
   */
  @get
  list(
    /** Project ID filter */
    @query projectId?: string,

    /** Session ID filter */
    @query sessionId?: string,

    /** Status filter */
    @query status?: Models.VideoStatus,

    /** Page number */
    @query page?: int32 = 1,

    /** Items per page */
    @query pageSize?: int32 = 20,
  ): {
    data: Models.Video[];
    total: int64;
    page: int32;
    pageSize: int32;
    hasMore: boolean;
  };
}
