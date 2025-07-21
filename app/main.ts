import net from "net";
import { processBuffer, handleRequestData } from "./buffer-utils";

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

// Track active connections for monitoring and limits
let activeConnections = 0;
const MAX_CONNECTIONS = 1000; // Configurable limit

const server: net.Server = net.createServer((connection: net.Socket) => {
  // Check connection limits
  if (activeConnections >= MAX_CONNECTIONS) {
    console.log(`Connection limit reached (${MAX_CONNECTIONS}), rejecting new connection`);
    connection.end();
    return;
  }

  activeConnections++;
  console.log(`New connection established. Active connections: ${activeConnections}`);

  let buffer = Buffer.alloc(0);

  connection.on('data', (data) => {
    // Append new data to existing buffer
    buffer = Buffer.concat([buffer, data]);

    // Process buffer and handle all complete requests
    const remainingBuffer = processBuffer(buffer, (requestData) => {
      handleRequestData(requestData, connection);
    });
    buffer = Buffer.from(remainingBuffer);
  });

  connection.on('error', (err) => {
    console.error('Connection error:', err);
  });

  connection.on('close', () => {
    activeConnections--;
    console.log(`Connection closed. Active connections: ${activeConnections}`);
  });

  // Set connection timeout to prevent hanging connections
  connection.setTimeout(30000, () => {
    console.log('Connection timeout, closing connection');
    connection.end();
  });
});

// Configure server-level settings
server.maxConnections = MAX_CONNECTIONS;

server.listen(9092, "127.0.0.1");
