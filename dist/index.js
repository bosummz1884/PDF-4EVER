// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/auth.ts
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// server/supabase.ts
import { createClient } from "@supabase/supabase-js";
if (!process.env.SUPABASE_URL) {
  throw new Error(
    "SUPABASE_URL must be set. Please add your Supabase project URL to environment variables."
  );
}
if (!process.env.SUPABASE_ANON_KEY) {
  throw new Error(
    "SUPABASE_ANON_KEY must be set. Please add your Supabase anon key to environment variables."
  );
}
var supabaseUrl = process.env.SUPABASE_URL?.replace(/['"]/g, "").replace(/\/$/, "");
var supabase = createClient(
  supabaseUrl,
  process.env.SUPABASE_ANON_KEY
);
var supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// server/auth.ts
import crypto from "crypto";
import nodemailer from "nodemailer";
var JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key";
var FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5000";
var emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});
var AuthService = class {
  // Generate JWT token
  static generateToken(userId) {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
  }
  // Verify JWT token
  static verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch {
      return null;
    }
  }
  // Hash password
  static async hashPassword(password) {
    return bcrypt.hash(password, 12);
  }
  // Verify password
  static async verifyPassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
  }
  // Generate verification token
  static generateVerificationToken() {
    return crypto.randomBytes(32).toString("hex");
  }
  // Send verification email
  static async sendVerificationEmail(email, token) {
    const verificationUrl = `${FRONTEND_URL}/verify-email?token=${token}`;
    const mailOptions = {
      from: process.env.FROM_EMAIL || "noreply@pdf4ever.com",
      to: email,
      subject: "Verify your PDF4EVER account",
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <h2 style="color: #2563eb;">Welcome to PDF4EVER!</h2>
          <p>Thank you for signing up. Please verify your email address by clicking the button below:</p>
          <a href="${verificationUrl}" 
             style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
            Verify Email Address
          </a>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #6b7280;">${verificationUrl}</p>
          <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
            If you didn't create an account with PDF4EVER, you can safely ignore this email.
          </p>
        </div>
      `
    };
    await emailTransporter.sendMail(mailOptions);
  }
  // Register user with email/password
  static async signup(signupData) {
    const { email, password, firstName, lastName } = signupData;
    const { data: existingUser } = await supabase.from("users").select("id").eq("email", email).single();
    if (existingUser) {
      throw new Error("User with this email already exists");
    }
    const hashedPassword = await this.hashPassword(password);
    const { data: user, error } = await supabase.from("users").insert({
      email,
      password: hashedPassword,
      first_name: firstName,
      last_name: lastName,
      auth_provider: "email",
      is_verified: false
    }).select().single();
    if (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
    const verificationToken = this.generateVerificationToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1e3);
    await supabase.from("verification_tokens").insert({
      email,
      token: verificationToken,
      expires_at: expiresAt.toISOString()
    });
    try {
      await this.sendVerificationEmail(email, verificationToken);
    } catch (error2) {
      console.error("Failed to send verification email:", error2);
    }
    const token = this.generateToken(user.id);
    return { user, token };
  }
  // Login with email/password
  static async login(loginData) {
    const { email, password } = loginData;
    const { data: user, error } = await supabase.from("users").select("*").eq("email", email).single();
    if (error || !user) {
      throw new Error("Invalid email or password");
    }
    if (!user.password) {
      throw new Error("Please login using your social account (Google/Facebook)");
    }
    const isValidPassword = await this.verifyPassword(password, user.password);
    if (!isValidPassword) {
      throw new Error("Invalid email or password");
    }
    const token = this.generateToken(user.id);
    return { user, token };
  }
  // Get user by ID
  static async getUserById(userId) {
    const { data: user, error } = await supabase.from("users").select("*").eq("id", userId).single();
    if (error || !user) {
      return null;
    }
    return user;
  }
  // Verify email token
  static async verifyEmail(token) {
    const { data: verificationToken, error } = await supabase.from("verification_tokens").select("*").eq("token", token).single();
    if (error || !verificationToken) {
      return false;
    }
    if (/* @__PURE__ */ new Date() > new Date(verificationToken.expires_at)) {
      return false;
    }
    await supabase.from("users").update({ is_verified: true }).eq("email", verificationToken.email);
    await supabase.from("verification_tokens").delete().eq("token", token);
    return true;
  }
  // Handle OAuth signup/login
  static async handleOAuthUser(provider, profile) {
    const email = profile.email || profile._json?.email;
    const firstName = profile.name?.givenName || profile._json?.given_name || profile.displayName?.split(" ")[0];
    const lastName = profile.name?.familyName || profile._json?.family_name || profile.displayName?.split(" ")[1];
    const profileImageUrl = profile.photos?.[0]?.value || profile._json?.picture;
    if (!email) {
      throw new Error("Email is required from OAuth provider");
    }
    const { data: existingUser } = await supabase.from("users").select("*").eq("email", email).single();
    let user;
    let isNewUser = false;
    if (existingUser) {
      const { data: updatedUser, error } = await supabase.from("users").update({
        first_name: firstName || existingUser.first_name,
        last_name: lastName || existingUser.last_name,
        profile_image_url: profileImageUrl || existingUser.profile_image_url,
        auth_provider: provider,
        auth_provider_id: profile.id,
        is_verified: true
        // OAuth users are automatically verified
      }).eq("id", existingUser.id).select().single();
      if (error) {
        throw new Error(`Failed to update user: ${error.message}`);
      }
      user = updatedUser;
    } else {
      const { data: newUser, error } = await supabase.from("users").insert({
        email,
        first_name: firstName,
        last_name: lastName,
        profile_image_url: profileImageUrl,
        auth_provider: provider,
        auth_provider_id: profile.id,
        is_verified: true
        // OAuth users are automatically verified
      }).select().single();
      if (error) {
        throw new Error(`Failed to create user: ${error.message}`);
      }
      user = newUser;
      isNewUser = true;
    }
    await supabase.from("accounts").upsert({
      user_id: user.id,
      provider,
      provider_account_id: profile.id,
      access_token: profile.accessToken,
      refresh_token: profile.refreshToken,
      token_type: "Bearer"
    });
    const token = this.generateToken(user.id);
    return { user, token, isNewUser };
  }
};

// shared/schema.ts
import { pgTable, text, boolean, varchar, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  password: varchar("password", { length: 255 }),
  // null for OAuth users
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  profileImageUrl: varchar("profile_image_url", { length: 500 }),
  isVerified: boolean("is_verified").default(false),
  authProvider: varchar("auth_provider", { length: 50 }).default("email"),
  // email, google, facebook
  authProviderId: varchar("auth_provider_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  provider: varchar("provider", { length: 50 }).notNull(),
  // google, facebook
  providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at"),
  tokenType: varchar("token_type", { length: 50 }),
  scope: varchar("scope", { length: 255 }),
  idToken: text("id_token"),
  createdAt: timestamp("created_at").defaultNow()
});
var verificationTokens = pgTable("verification_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull(),
  token: varchar("token", { length: 255 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});
var passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull(),
  token: varchar("token", { length: 255 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});
var sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});
var signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").regex(/[A-Z]/, "Password must contain at least one uppercase letter").regex(/[a-z]/, "Password must contain at least one lowercase letter").regex(/\d/, "Password must contain at least one number").regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least one special character"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required")
});
var loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required")
});
var insertUserSchema = createInsertSchema(users, {
  email: z.string().email("Invalid email address"),
  password: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional()
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isVerified: true,
  authProvider: true,
  authProviderId: true
});

// server/routes.ts
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
var requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const token = authHeader.substring(7);
    const decoded = AuthService.verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ message: "Invalid token" });
    }
    const user = await AuthService.getUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
  }
};
async function registerRoutes(app2) {
  app2.use(session({
    secret: process.env.JWT_SECRET || "your-session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1e3
      // 24 hours
    }
  }));
  app2.use(passport.initialize());
  app2.use(passport.session());
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    const baseURL = process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS}` : "http://localhost:5000";
    const callbackURL = `${baseURL}/api/auth/google/callback`;
    console.log("Google OAuth Configuration:");
    console.log("Base URL:", baseURL);
    console.log("Callback URL:", callbackURL);
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        const result = await AuthService.handleOAuthUser("google", {
          ...profile,
          accessToken,
          refreshToken
        });
        done(null, result);
      } catch (error) {
        console.error("Google OAuth error:", error);
        done(error, false);
      }
    }));
  }
  passport.serializeUser((user, done) => {
    done(null, user);
  });
  passport.deserializeUser((user, done) => {
    done(null, user);
  });
  app2.post("/api/auth/signup", async (req, res) => {
    try {
      const validatedData = signupSchema.parse(req.body);
      const result = await AuthService.signup(validatedData);
      res.status(201).json({
        message: "User created successfully. Please check your email for verification.",
        user: {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          isVerified: result.user.isVerified
        },
        token: result.token
      });
    } catch (error) {
      if (error.name === "ZodError") {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors
        });
      }
      res.status(400).json({ message: error.message });
    }
  });
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      const result = await AuthService.login(validatedData);
      res.json({
        message: "Login successful",
        user: {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          isVerified: result.user.isVerified
        },
        token: result.token
      });
    } catch (error) {
      if (error.name === "ZodError") {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors
        });
      }
      res.status(400).json({ message: error.message });
    }
  });
  app2.get(
    "/api/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
  );
  app2.get(
    "/api/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/login?error=oauth_failed" }),
    (req, res) => {
      const result = req.user;
      if (result && result.token) {
        res.redirect(`/?token=${result.token}&user=${encodeURIComponent(JSON.stringify({
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          isVerified: result.user.isVerified
        }))}`);
      } else {
        res.redirect("/login?error=oauth_failed");
      }
    }
  );
  app2.get("/api/auth/verify-email", async (req, res) => {
    try {
      const { token } = req.query;
      if (!token || typeof token !== "string") {
        return res.status(400).json({ message: "Invalid verification token" });
      }
      const isVerified = await AuthService.verifyEmail(token);
      if (isVerified) {
        res.json({ message: "Email verified successfully" });
      } else {
        res.status(400).json({ message: "Invalid or expired verification token" });
      }
    } catch (error) {
      res.status(500).json({ message: "Verification failed" });
    }
  });
  app2.get("/api/auth/user", requireAuth, async (req, res) => {
    const user = req.user;
    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isVerified: user.isVerified,
      profileImageUrl: user.profileImageUrl
    });
  });
  app2.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";
import { dirname } from "path";
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var r = (p) => path.resolve(__dirname, "client", "src", p);
var rClient = (p) => path.resolve(__dirname, "client", p);
var vite_config_default = defineConfig({
  root: rClient(""),
  plugins: [
    react(),
    runtimeErrorOverlay()
    // If you need the replit plugin, you must use Vite's async config!
    // For now, let's keep it simple and synchronous.
  ],
  resolve: {
    alias: {
      "@": r(""),
      "@components": r("components"),
      "@hooks": r("hooks"),
      "@lib": r("lib"),
      "@pages": r("pages"),
      "@types": r("types"),
      "@utils": r("utils"),
      "@services": r("services"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
      "@layers": path.resolve(
        __dirname,
        "client",
        "src",
        "features",
        "components",
        "layers"
      )
    }
  },
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom")) {
            return "react";
          }
          if (id.includes("node_modules/@radix-ui")) {
            return "radix-ui";
          }
          if (id.includes("node_modules/framer-motion")) {
            return "framer-motion";
          }
          if (id.includes("node_modules/lucide-react")) {
            return "lucide";
          }
          if (id.includes("node_modules/pdf-lib") || id.includes("node_modules/pdfjs-dist") || id.includes("node_modules/react-pdf") || id.includes("node_modules/tesseract.js")) {
            return "pdf-tools";
          }
          if (id.includes("node_modules/recharts")) {
            return "charts";
          }
          if (id.includes("node_modules/@supabase")) {
            return "supabase";
          }
          if (id.includes("node_modules/stripe") || id.includes("node_modules/@stripe/stripe-js") || id.includes("node_modules/@stripe/react-stripe-js")) {
            return "stripe";
          }
          if (id.includes("node_modules/passport") || id.includes("node_modules/passport-facebook") || id.includes("node_modules/passport-google-oauth20") || id.includes("node_modules/passport-local")) {
            return "auth";
          }
          if (id.includes("node_modules/drizzle-orm") || id.includes("node_modules/drizzle-zod")) {
            return "drizzle";
          }
          if (id.includes("node_modules/embla-carousel-react")) {
            return "carousel";
          }
          if (id.includes("node_modules/wouter")) {
            return "router";
          }
          if (id.includes("node_modules/@tanstack/react-query")) {
            return "react-query";
          }
          if (id.includes("node_modules/tailwind-merge") || id.includes("node_modules/tailwindcss-animate") || id.includes("node_modules/tw-animate-css")) {
            return "tailwind-plugins";
          }
        }
      }
    }
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
import { fileURLToPath as fileURLToPath2 } from "url";
import { dirname as dirname2 } from "path";
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = dirname2(__filename2);
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  }).on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      log(`Port ${port} is already in use, trying to find and kill existing process...`);
      process.exit(1);
    } else {
      throw err;
    }
  });
})();
