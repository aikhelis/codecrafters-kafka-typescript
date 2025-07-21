// Centralized message creation factory

import type { ResponseHeaderV0, ApiVersionsResponseBodyV4, ApiVersionsResponse, ApiKeyVersion } from './protocol-types.js';
import { ERROR_CODES } from './protocol-types.js';
import { calculateResponseSize } from './protocol.js';

export class MessageFactory {
    static createApiVersionsResponse(
        correlationId: number,
        apiKeys: ApiKeyVersion[]
    ): ApiVersionsResponse {
        const header: ResponseHeaderV0 = { correlationId };

        const body: ApiVersionsResponseBodyV4 = {
            errorCode: ERROR_CODES.NO_ERROR,
            apiKeys,
            throttleTimeMs: 0
        };

        const response: ApiVersionsResponse = { messageSize: 0, header, body };
        response.messageSize = calculateResponseSize(response, 'API_VERSIONS_V4');

        return response;
    }

    static createApiVersionsErrorResponse(
        correlationId: number,
        errorCode: number
    ): ApiVersionsResponse {
        const header: ResponseHeaderV0 = { correlationId };

        const body: ApiVersionsResponseBodyV4 = {
            errorCode,
            apiKeys: [],
            throttleTimeMs: 0
        };

        const response: ApiVersionsResponse = { messageSize: 0, header, body };
        response.messageSize = calculateResponseSize(response, 'API_VERSIONS_V4');

        return response;
    }

    static createEmptyResponse(correlationId: number): ApiVersionsResponse {
        const header: ResponseHeaderV0 = { correlationId };

        const body: ApiVersionsResponseBodyV4 = {
            errorCode: ERROR_CODES.NO_ERROR,
            apiKeys: [],
            throttleTimeMs: 0
        };

        const response: ApiVersionsResponse = { messageSize: 0, header, body };
        response.messageSize = calculateResponseSize(response, 'API_VERSIONS_V4');

        return response;
    }
}
