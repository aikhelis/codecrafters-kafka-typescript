// API handlers for different Kafka requests

import type { Request, ApiVersionsResponse } from "./protocol-types.js";
import { API_KEYS, ERROR_CODES } from "./protocol-types.js";
import { MessageFactory } from "./message-factory.js";

// Handler function type for API requests
type ApiHandler = (request: Request) => ApiVersionsResponse;

// Version range type for cleaner version definitions
interface VersionRange {
  min: number;
  max: number;
}

// --- Supported API Versions ---
// Registry of supported version ranges for each API - much more concise!
export const API_SUPPORTED_VERSION_RANGES: Record<number, VersionRange> = {
  [API_KEYS.API_VERSIONS]: { min: 0, max: 4 },
  // Add more APIs and their supported version ranges here as they are implemented
  // [API_KEYS.PRODUCE]: { min: 5, max: 11 },
  // [API_KEYS.FETCH]: { min: 0, max: 3 },
  // [API_KEYS.METADATA]: { min: 1, max: 12 },
};

// Utility function to check if a version is supported for a given API
function isVersionSupported(apiKey: number, version: number): boolean {
  const versionRange = API_SUPPORTED_VERSION_RANGES[apiKey];
  return versionRange ? (version >= versionRange.min && version <= versionRange.max) : false;
}

// --- API Handlers ---
// Handler for ApiVersions API
export const handleApiVersions: ApiHandler = (request: Request): ApiVersionsResponse => {
  const versionSupported = isVersionSupported(
      request.header.requestApiKey,
      request.header.requestApiVersion
  );

  if (!versionSupported) {
    return MessageFactory.createApiVersionsErrorResponse(
        request.header.correlationId,
        ERROR_CODES.UNSUPPORTED_VERSION
    );
  }

  // Build the API keys array from supported versions
  const apiKeys = [
    {
      apiKey: API_KEYS.API_VERSIONS,
      minVersion: API_SUPPORTED_VERSION_RANGES[API_KEYS.API_VERSIONS].min,
      maxVersion: API_SUPPORTED_VERSION_RANGES[API_KEYS.API_VERSIONS].max
    }
    // Add more supported APIs here as they are implemented
  ];

  return MessageFactory.createApiVersionsResponse(request.header.correlationId, apiKeys);
};

// Default handler for unsupported/unknown APIs
export const handleDefault: ApiHandler = (request: Request): ApiVersionsResponse => {
  return MessageFactory.createEmptyResponse(request.header.correlationId);
};

// Registry mapping API keys to their handlers
export const API_HANDLERS: Record<number, ApiHandler> = {
  [API_KEYS.API_VERSIONS]: handleApiVersions,
  // Add more handlers here as new APIs are implemented
  // [API_KEYS.PRODUCE]: handleProduce,
  // [API_KEYS.FETCH]: handleFetch,
};

// Main handler dispatcher - it will be called by the main server to handle incoming requests
export function handleRequest(request: Request): ApiVersionsResponse {
  const handler = API_HANDLERS[request.header.requestApiKey];

  if (handler) {
    console.log(`Using handler for API key: ${request.header.requestApiKey}`);
    return handler(request);
  } else {
    console.log(`No specific handler for API key: ${request.header.requestApiKey}, using default handler`);
    return handleDefault(request);
  }
}
