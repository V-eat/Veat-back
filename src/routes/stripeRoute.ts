import { Router } from "express";
import {
	createPaymentIntent,
	handleWebhook,
	createConnectOnboardingLink,
	getConnectStatus,
} from "../controllers/stripeController";
import { authenticate } from "../middleware/auth.middleware";
import express from "express";

const router = Router();

// Webhook needs raw body (before json parser)
router.post("/webhook", express.raw({ type: "application/json" }), handleWebhook);
router.post("/create-payment-intent", authenticate, createPaymentIntent);
router.post("/connect/onboarding-link", authenticate, createConnectOnboardingLink);
router.get("/connect/status/:restaurantId", authenticate, getConnectStatus);

export default router;
