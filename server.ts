import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import { createServer } from "http";
import db from "./src/backend/config/db";
import "./src/backend/models/index"; // Load associations
import { initSocket } from "./src/backend/lib/socket.js";

// Routes
import authRoutes from "./src/backend/routes/auth";
import courseRoutes from "./src/backend/routes/courses";
import quizRoutes from "./src/backend/routes/quizzes";
import userRoutes from "./src/backend/routes/users";
import paymentRoutes from "./src/backend/routes/payments";
import uploadRoutes from "./src/backend/routes/uploads";
import aiRoutes from "./src/backend/routes/ai";
import doubtRoutes from "./src/backend/routes/doubts";
import noteRoutes from "./src/backend/routes/notes";
import announcementRoutes from "./src/backend/routes/announcements";
import flashcardRoutes from "./src/backend/routes/flashcards";
import leaderboardRoutes from "./src/backend/routes/leaderboard";
import codeLabRoutes from "./src/backend/routes/codelab";
import liveRoutes from "./src/backend/routes/live";

import { User, Course, Lesson, Enrollment, Progress, Quiz, Question, Doubt, DoubtReply, Announcement, Flashcard } from "./src/backend/models";
import bcrypt from "bcryptjs";
import crypto from "crypto";

async function seedData() {
  const userCount = await User.count();
  let admin, instructor, student;

  if (userCount === 0) {
    console.log("Initializing base platform roles and credentials...");
    const hashedAdminPassword = await bcrypt.hash("admin123", 10);
    await User.create({
      name: "Platform Administrator",
      email: "admin@eduvision.com",
      password: hashedAdminPassword,
      role: "admin",
      streak_count: 1,
      xp_points: 100,
      avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      bio: "Chief Administrator & Operations Lead."
    });

    const hashedInstructorPassword = await bcrypt.hash("ins123", 10);
    await User.create({
      name: "Lead Instructor",
      email: "instructor@eduvision.com",
      password: hashedInstructorPassword,
      role: "instructor",
      streak_count: 1,
      xp_points: 100,
      avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      bio: "Senior Master Faculty & Course Architect."
    });

    const hashedStudentPassword = await bcrypt.hash("student123", 10);
    await User.create({
      name: "Alex Student",
      email: "student@eduvision.com",
      password: hashedStudentPassword,
      role: "student",
      streak_count: 1,
      xp_points: 50,
      avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
      bio: "Software Engineering Student."
    });
    console.log("Default user personas initialized with @eduvision.com.");
  }
}

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const PORT = 3000;

  // Initialize Socket server
  initSocket(httpServer);

  app.use(cors());
  app.use(express.json());

  // Observability: Request correlation ID & latency tracing
  const requestLogs: Array<{
    id: string;
    method: string;
    url: string;
    status: number;
    durationMs: number;
    timestamp: string;
  }> = [];

  app.use((req, res, next) => {
    const correlationId = (req.headers['x-correlation-id'] as string) || crypto.randomUUID();
    res.setHeader('X-Correlation-ID', correlationId);
    const start = Date.now();

    res.on('finish', () => {
      const durationMs = Date.now() - start;
      if (requestLogs.length >= 60) requestLogs.shift();
      if (!req.url.startsWith('/api/system/health') && !req.url.startsWith('/@vite')) {
        requestLogs.push({
          id: correlationId.slice(0, 8),
          method: req.method,
          url: req.url,
          status: res.statusCode,
          durationMs,
          timestamp: new Date().toISOString()
        });
      }
    });

    next();
  });

  // Sync Database
  try {
    await db.authenticate();
    await db.sync();
    console.log("SQLite database connected and synced successfully");
    await seedData();
  } catch (error) {
    console.error("Database connection failed:", error);
  }

  // Observability & System Health endpoint
  app.get('/api/system/health', (req, res) => {
    const mem = process.memoryUsage();
    const durations = requestLogs.map(r => r.durationMs);
    const avgLatency = durations.length > 0 ? (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(1) : '0.0';
    res.json({
      status: 'OPERATIONAL',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      memory: {
        rssMb: (mem.rss / 1024 / 1024).toFixed(2),
        heapTotalMb: (mem.heapTotal / 1024 / 1024).toFixed(2),
        heapUsedMb: (mem.heapUsed / 1024 / 1024).toFixed(2),
      },
      metrics: {
        avgLatencyMs: parseFloat(avgLatency),
        totalRequestsTracked: requestLogs.length,
        status2xx: requestLogs.filter(r => r.status >= 200 && r.status < 300).length,
        status4xx: requestLogs.filter(r => r.status >= 400 && r.status < 500).length,
        status5xx: requestLogs.filter(r => r.status >= 500).length,
      },
      recentLogs: [...requestLogs].reverse().slice(0, 20)
    });
  });

  // API Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/courses", courseRoutes);
  app.use("/api/quizzes", quizRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/payments", paymentRoutes);
  app.use("/api/uploads", uploadRoutes);
  app.use("/api/ai", aiRoutes);
  app.use("/api/doubts", doubtRoutes);
  app.use("/api/notes", noteRoutes);
  app.use("/api/announcements", announcementRoutes);
  app.use("/api/flashcards", flashcardRoutes);
  app.use("/api/leaderboard", leaderboardRoutes);
  app.use("/api/codelab", codeLabRoutes);
  app.use("/api/live", liveRoutes);

  // Serve uploads
  app.use("/uploads", express.static(path.join(process.cwd(), "public/uploads")));

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
