#!/usr/bin/env tsx

/**
 * Mock API Server for Testing RetrievalLogger
 *
 * This server simulates a remote monitoring API endpoint
 * for testing the RetrievalLogger's API integration feature.
 *
 * Run with: cd core && npx tsx context/retrieval/mock-api-server.ts
 */

import express from "express";
import type { Request, Response } from "express";

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// Store received logs
const receivedLogs: any[] = [];

// ANSI color codes
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  magenta: "\x1b[35m",
};

/**
 * POST /api/logs - Receive logs from RetrievalLogger
 */
app.post("/api/logs", (req: Request, res: Response) => {
  const timestamp = new Date().toISOString();
  const logs = req.body.logs || [];

  console.log(`\n${colors.cyan}📊 [${timestamp}] Received Logs${colors.reset}`);
  console.log(`${colors.blue}━`.repeat(60) + colors.reset);

  // Log details
  console.log(`${colors.green}✅ Count:${colors.reset} ${logs.length} logs`);
  console.log(
    `${colors.green}✅ Authorization:${colors.reset} ${req.headers.authorization ? "Present" : "None"}`,
  );

  // Store logs
  receivedLogs.push(...logs);

  // Display each log
  logs.forEach((log: any, index: number) => {
    console.log(`\n${colors.magenta}Log ${index + 1}:${colors.reset}`);
    console.log(JSON.stringify(log, null, 2));
  });

  console.log(`${colors.blue}━`.repeat(60) + colors.reset);
  console.log(
    `${colors.yellow}📈 Total logs received: ${receivedLogs.length}${colors.reset}\n`,
  );

  // Send response
  res.json({
    success: true,
    received: logs.length,
    total: receivedLogs.length,
    timestamp,
  });
});

/**
 * GET /api/logs - Get all received logs
 */
app.get("/api/logs", (req: Request, res: Response) => {
  res.json({
    success: true,
    count: receivedLogs.length,
    logs: receivedLogs,
  });
});

/**
 * DELETE /api/logs - Clear all logs
 */
app.delete("/api/logs", (req: Request, res: Response) => {
  const count = receivedLogs.length;
  receivedLogs.length = 0;

  console.log(`${colors.yellow}🗑️  Cleared ${count} logs${colors.reset}`);

  res.json({
    success: true,
    cleared: count,
  });
});

/**
 * GET /health - Health check
 */
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "healthy",
    uptime: process.uptime(),
    logsReceived: receivedLogs.length,
  });
});

/**
 * Start server
 */
app.listen(PORT, () => {
  console.log(`\n${colors.green}✅ Mock API Server Started${colors.reset}`);
  console.log(`${colors.blue}━`.repeat(60) + colors.reset);
  console.log(
    `${colors.cyan}🌐 Server:${colors.reset} http://localhost:${PORT}`,
  );
  console.log(
    `${colors.cyan}📊 Logs endpoint:${colors.reset} POST http://localhost:${PORT}/api/logs`,
  );
  console.log(
    `${colors.cyan}📋 View logs:${colors.reset} GET http://localhost:${PORT}/api/logs`,
  );
  console.log(
    `${colors.cyan}🗑️  Clear logs:${colors.reset} DELETE http://localhost:${PORT}/api/logs`,
  );
  console.log(
    `${colors.cyan}💚 Health check:${colors.reset} GET http://localhost:${PORT}/health`,
  );
  console.log(`${colors.blue}━`.repeat(60) + colors.reset);
  console.log(`${colors.yellow}⏳ Waiting for logs...${colors.reset}\n`);
});

/**
 * Graceful shutdown
 */
process.on("SIGINT", () => {
  console.log(`\n\n${colors.yellow}🛑 Shutting down...${colors.reset}`);
  console.log(
    `${colors.green}📊 Total logs received: ${receivedLogs.length}${colors.reset}`,
  );
  process.exit(0);
});
