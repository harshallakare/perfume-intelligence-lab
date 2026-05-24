import "./config/env"; // load + validate env first
import app from "./app";
import { env } from "./config/env";
import prisma from "./lib/prisma";
import redis from "./lib/redis";

const PORT = env.PORT;

async function start() {
  try {
    // Test DB connection
    await prisma.$connect();
    console.log("✅  PostgreSQL connected");

    // Connect Redis (lazy — just pre-warms)
    await redis.connect();

    const server = app.listen(PORT, () => {
      console.log(`\n🚀  PIL Core API running`);
      console.log(`   http://localhost:${PORT}`);
      console.log(`   Environment: ${env.NODE_ENV}\n`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`\n${signal} received — shutting down gracefully`);
      server.close(async () => {
        await prisma.$disconnect();
        await redis.quit();
        console.log("Shutdown complete.");
        process.exit(0);
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT",  () => shutdown("SIGINT"));
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();
