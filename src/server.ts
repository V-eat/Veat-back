import express from "express";
import cors from "cors";
import { supabase } from "./db";

// Routes
import userRouter from "./routes/userRoute";
import restaurantRouter from "./routes/restaurantRoute";
import menuItemRouter, { menuItemRouter as standaloneMenuItemRouter } from "./routes/menuItemRoute";
import orderRouter from "./routes/orderRoute";
import reviewRouter, { restaurantReviewRouter } from "./routes/reviewRoute";
import favoriteRouter from "./routes/favoriteRoute";
import profileRouter from "./routes/profileRoute";

const app = express();

const corsOptions = {
  origin: process.env.CORS_ORIGIN || "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());

// Root
app.get("/", (_req, res) => res.json({ message: "V'EAT API", version: "1.0.0" }));

// Health check
app.get("/health/supabase", async (_req, res) => {
  try {
    const { error } = await supabase
      .from("users")
      .select("count", { count: "exact", head: true });

    if (error) {
      return res.status(500).json({ status: "error", error: error.message });
    }
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  } catch (err: any) {
    res.status(500).json({ status: "error", error: err.message });
  }
});

// API routes
app.use("/users", userRouter);
app.use("/profile", profileRouter);
app.use("/restaurants", restaurantRouter);
app.use("/restaurants/:restaurantId/menu", menuItemRouter);
app.use("/restaurants/:restaurantId/reviews", restaurantReviewRouter);
app.use("/menu-items", standaloneMenuItemRouter);
app.use("/orders", orderRouter);
app.use("/reviews", reviewRouter);
app.use("/favorites", favoriteRouter);

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

app.listen(PORT, () => {
  console.log(`V'EAT API listening on http://localhost:${PORT}`);
});
