// Protocol parsing, serialization and size calculation implementation

import type { Request, Response, ResponseBody, ResponseStructure } from './protocol-types.js'
import { FIELD_SIZES, RESPONSE_STRUCTURES } from './protocol-types.js'

// Generic size calculation based on response structure
export function calculateResponseSize<TBody extends ResponseBody>(
    response: Response<TBody>,
    structureKey: string
): number {
  const structure = RESPONSE_STRUCTURES[structureKey];
  if (!structure) {
    throw new Error(`Unknown response structure: ${structureKey}`);
  }

  let size = 0;

  // Calculate header size
  for (const field of Object.values(structure.header)) {
    size += FIELD_SIZES[field.type];
  }

  // Calculate body size if present
  if (response.body && structure.body) {
    for (const [fieldName, field] of Object.entries(structure.body)) {
      if (field.arrayLengthField) {
        size += FIELD_SIZES[field.type];
      } else if (field.isArray) {
        // Handle array fields
        if (fieldName.includes('apiKey') || fieldName.includes('Version') || fieldName.includes('tagBuffer')) {
          const arrayLength = 'apiKeys' in response.body ? response.body.apiKeys.length : 0;
          size += FIELD_SIZES[field.type] * arrayLength;
        }
      } else {
        size += FIELD_SIZES[field.type];
      }
    }
  }

  return size;
}

// Structure-aware parsing
export function parseRequest(data: Buffer): Request {
  const minHeaderSize = FIELD_SIZES.INT32 + FIELD_SIZES.INT16 + FIELD_SIZES.INT16 + FIELD_SIZES.INT32;

  if (data.length < minHeaderSize) {
    throw new Error('Request too short to contain minimum header V2 fields');
  }

  let offset = 0;
  const messageSize = data.readUInt32BE(offset);
  offset += FIELD_SIZES.INT32;

  const requestApiKey = data.readUInt16BE(offset);
  offset += FIELD_SIZES.INT16;

  const requestApiVersion = data.readUInt16BE(offset);
  offset += FIELD_SIZES.INT16;

  const correlationId = data.readUInt32BE(offset);
  offset += FIELD_SIZES.INT32;

  return {
    messageSize,
    header: {
      requestApiKey,
      requestApiVersion,
      correlationId,
      clientId: null,
      tagBuffer: Buffer.alloc(0)
    }
  };
}

// Structure-aware serialization
export function serializeResponse<TBody extends ResponseBody>(
    response: Response<TBody>,
    structureKey: string = 'API_VERSIONS_V4'
): Buffer {
  const totalBufferSize = FIELD_SIZES.INT32 + response.messageSize;
  const buffer = Buffer.alloc(totalBufferSize);

  let offset = 0;
  buffer.writeUInt32BE(response.messageSize, offset);
  offset += FIELD_SIZES.INT32;

  buffer.writeUInt32BE(response.header.correlationId, offset);
  offset += FIELD_SIZES.INT32;

  if (response.body && structureKey === 'API_VERSIONS_V4' && 'apiKeys' in response.body) {
    buffer.writeUInt16BE(response.body.errorCode, offset);
    offset += FIELD_SIZES.INT16;

    buffer.writeUInt8(response.body.apiKeys.length + 1, offset);
    offset += FIELD_SIZES.COMPACT_ARRAY_LENGTH;

    for (const apiKeyVersion of response.body.apiKeys) {
      buffer.writeUInt16BE(apiKeyVersion.apiKey, offset);
      offset += FIELD_SIZES.INT16;
      buffer.writeUInt16BE(apiKeyVersion.minVersion, offset);
      offset += FIELD_SIZES.INT16;
      buffer.writeUInt16BE(apiKeyVersion.maxVersion, offset);
      offset += FIELD_SIZES.INT16;
      buffer.writeUInt8(0, offset);
      offset += FIELD_SIZES.TAG_BUFFER_EMPTY;
    }

    buffer.writeUInt32BE(response.body.throttleTimeMs, offset);
    offset += FIELD_SIZES.INT32;
    buffer.writeUInt8(0, offset);
    offset += FIELD_SIZES.TAG_BUFFER_EMPTY;
  }

  return buffer;
}
