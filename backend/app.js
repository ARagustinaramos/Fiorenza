import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRoutes from "./src/routes/auth.routes.js";
import usersRoutes from "./src/routes/users.js";
import productsRoutes from "./src/routes/products.js";
import adminTestRoutes from "./src/routes/test.admin.js";
import ordersRoutes from "./src/routes/orders.js";
import favoritesRoutes from "./src/routes/favorites.js";
import bannerRoutes from "./src/routes/banner.routes.js";
import downloadsRoutes from "./src/routes/downloads.routes.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set("trust proxy", process.env.TRUST_PROXY === "true" ? 1 : false);

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiadas peticiones desde esta IP, por favor intenta más tarde." }
  ,
  skip: (req) =>
    req.path.startsWith("/api/products/bulk-upload/status") ||
    req.path.startsWith("/api/banners")
});
const allowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL.trim());
}

if (process.env.NODE_ENV !== "production") {
  allowedOrigins.push("http://localhost:3000", "http://127.0.0.1:3000");
}

const corsConfig = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.length === 0) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("CORS_NOT_ALLOWED"));
  },
};

app.use(cors(corsConfig));
app.options("*", cors(corsConfig));

app.use(limiter);

app.use(express.json({ limit: "60mb" }));
app.use(express.urlencoded({ limit: "60mb", extended: true }));



// Servir archivos estáticos (imágenes de productos)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Ruta de health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK" });
});

// Rutas de autenticación
app.use("/api/auth", authRoutes);

// Rutas de productos
app.use("/api/products", productsRoutes);

// Rutas de pedidos
app.use("/api/orders", ordersRoutes);

// Rutas de favoritos
app.use("/api/favorites", favoritesRoutes);

// Rutas de usuarios
app.use("/api/users", usersRoutes);

// Rutas de test/admin
app.use("/api/test", adminTestRoutes);

app.use("/api/banners", bannerRoutes);

app.use("/api/downloads", downloadsRoutes);

// Manejo de rutas no encontradas (404)
app.use((req, res) => {
  res.status(404).json({ 
    error: "Ruta no encontrada",
    path: req.path 
  });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

export default app;
