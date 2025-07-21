// Pure protocol type definitions and constants

// API Keys
export const API_KEYS = {
    API_VERSIONS: 18
} as const;

// Error codes
export const ERROR_CODES = {
    NO_ERROR: 0,
    UNSUPPORTED_VERSION: 35
} as const;

// Protocol field sizes
export const FIELD_SIZES = {
    INT8: 1,
    INT16: 2,
    INT32: 4,
    COMPACT_ARRAY_LENGTH: 1, // For small arrays < 127
    TAG_BUFFER_EMPTY: 1
} as const;

// Request types
export interface RequestHeaderV2 {
    requestApiKey: number;      // INT16
    requestApiVersion: number;  // INT16
    correlationId: number;      // INT32
    clientId: string | null;    // NULLABLE_STRING
    tagBuffer: Buffer;          // COMPACT_ARRAY
}

export interface Request {
    messageSize: number;        // INT32
    header: RequestHeaderV2;
}

// Response types
export interface ResponseHeaderV0 {
    correlationId: number;      // INT32
}

// Base interface for all response bodies
export interface BaseResponseBody {
    errorCode: number;
}

// Specific response body types
export interface ApiKeyVersion {
    apiKey: number;            // INT16
    minVersion: number;        // INT16
    maxVersion: number;        // INT16
}

export interface ApiVersionsResponseBodyV4 extends BaseResponseBody {
    apiKeys: ApiKeyVersion[];  // COMPACT_ARRAY of ApiKeyVersion
    throttleTimeMs: number;    // INT32
}

// Union type for all response bodies - easily extensible
export type ResponseBody = ApiVersionsResponseBodyV4;
// Add more response types here:
// | ProduceResponseBody
// | FetchResponseBody
// | MetadataResponseBody

// Generic Response interface
export interface Response<TBody extends ResponseBody = ResponseBody> {
    messageSize: number;        // INT32
    header: ResponseHeaderV0;
    body?: TBody;
}

// Type-specific response types for better type safety
export type ApiVersionsResponse = Response<ApiVersionsResponseBodyV4>;

// Structure definitions for size calculation
export interface FieldStructure {
    type: keyof typeof FIELD_SIZES;
    isArray?: boolean;
    arrayLengthField?: boolean;
}

export interface ResponseStructure {
    header: Record<string, FieldStructure>;
    body?: Record<string, FieldStructure>;
}

// Define response structures for each API
export const RESPONSE_STRUCTURES: Record<string, ResponseStructure> = {
    API_VERSIONS_V4: {
        header: {
            correlationId: { type: 'INT32' }
        },
        body: {
            errorCode: { type: 'INT16' },
            apiKeysLength: { type: 'COMPACT_ARRAY_LENGTH', arrayLengthField: true },
            apiKey: { type: 'INT16', isArray: true },
            minVersion: { type: 'INT16', isArray: true },
            maxVersion: { type: 'INT16', isArray: true },
            tagBuffer: { type: 'TAG_BUFFER_EMPTY', isArray: true },
            throttleTimeMs: { type: 'INT32' },
            finalTagBuffer: { type: 'TAG_BUFFER_EMPTY' }
        }
    }
    // Add more API structures here
};