// Simple buffer processing utility with safety limits
import { parseRequest, serializeResponse } from "./protocol";
import { handleRequest } from "./handlers";

const MAX_BUFFER_SIZE = 1024 * 1024; // 1MB limit per connection
const MAX_MESSAGE_SIZE = 100 * 1024; // 100KB per message

export function processBuffer(
  buffer: Buffer,
  onRequest: (requestData: Buffer) => void
): Buffer {
  // Safety check: prevent buffer from growing too large
  if (buffer.length > MAX_BUFFER_SIZE) {
    throw new Error(`Buffer size exceeded limit: ${buffer.length} > ${MAX_BUFFER_SIZE}`);
  }

  let remainingBuffer = Buffer.from(buffer);

  // Process all complete requests in the buffer
  while (remainingBuffer.length >= 4) {
    // Read the message size from the first 4 bytes
    const messageSize = remainingBuffer.readUInt32BE(0);

    // Safety check: prevent oversized messages
    if (messageSize > MAX_MESSAGE_SIZE) {
      throw new Error(`Message size too large: ${messageSize} > ${MAX_MESSAGE_SIZE}`);
    }

    const totalRequestSize = 4 + messageSize; // 4 bytes for size + message content

    // Check if we have a complete request
    if (remainingBuffer.length >= totalRequestSize) {
      // Extract the complete request
      const requestData = remainingBuffer.subarray(0, totalRequestSize);
      onRequest(requestData);

      // Remove the processed request from the buffer
      remainingBuffer = Buffer.from(remainingBuffer.subarray(totalRequestSize));
    } else {
      // Incomplete request, wait for more data
      break;
    }
  }

  return remainingBuffer;
}

export function handleRequestData(requestData: Buffer, connection: any): void {
  try {
    console.log('Received request bytes:', requestData);
    // Parse the incoming request
    const request = parseRequest(requestData);
    console.log('Parsed request:', request);

    // Handle the request using the appropriate handler
    const response = handleRequest(request);
    console.log('Generated response:', response);

    // Serialize and send the response
    const responseBuffer = serializeResponse(response);
    console.log('Sending response bytes:', responseBuffer);
    connection.write(responseBuffer);

  } catch (error) {
    console.error('Error processing request:', error);
  }
}
