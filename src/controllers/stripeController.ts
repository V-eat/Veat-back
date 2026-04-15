import { Request, Response } from "express";
import Stripe from "stripe";
import { supabaseAdmin } from "../db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

const getOwnedRestaurant = async (restaurantId: string, userId?: string) => {
  if (!restaurantId || !userId) return null;

  const { data } = await supabaseAdmin
    .from("restaurants")
    .select("id, owner_id, name, email, stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled")
    .eq("id", restaurantId)
    .maybeSingle();

  if (!data) return null;
  if (data.owner_id !== userId) return null;
  return data;
};

const syncRestaurantStripeStatus = async (restaurantId: string, account: Stripe.Account) => {
  const onboardingComplete = !!(account.details_submitted && account.charges_enabled && account.payouts_enabled);

  await supabaseAdmin
    .from("restaurants")
    .update({
      stripe_account_id: account.id,
      stripe_charges_enabled: !!account.charges_enabled,
      stripe_payouts_enabled: !!account.payouts_enabled,
      stripe_onboarding_complete: onboardingComplete,
      updated_at: new Date().toISOString(),
    })
    .eq("id", restaurantId);
};

export const createPaymentIntent = async (req: Request, res: Response) => {
  const { amount, restaurantId } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ message: "Invalid amount" });
  }

  try {
    const { data: restaurant } = await supabaseAdmin
      .from("restaurants")
      .select("id, stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled")
      .eq("id", restaurantId)
      .maybeSingle();

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const basePayload: Stripe.PaymentIntentCreateParams = {
      amount: Math.round(amount * 100), // convert to cents
      currency: "eur",
      metadata: {
        userId: req.userId || "",
        restaurantId: restaurantId || "",
      },
    };

    const canUseConnect = !!(
      restaurant.stripe_account_id
      && restaurant.stripe_charges_enabled
      && restaurant.stripe_payouts_enabled
    );

    if (canUseConnect) {
      const feePercent = Number(process.env.STRIPE_PLATFORM_FEE_PERCENT || 5);
      const feeAmount = Math.round((basePayload.amount as number) * (feePercent / 100));
      basePayload.application_fee_amount = feeAmount;
      basePayload.transfer_data = { destination: restaurant.stripe_account_id as string };
      basePayload.metadata = {
        ...basePayload.metadata,
        stripeMode: "connect_destination",
      };
    } else {
      basePayload.metadata = {
        ...basePayload.metadata,
        stripeMode: "platform_only",
      };
    }

    const paymentIntent = await stripe.paymentIntents.create(basePayload);

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err: any) {
    console.error("Stripe error:", err);
    res.status(500).json({ message: err.message || "Payment error" });
  }
};

export const handleWebhook = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return res.status(500).json({ message: "Webhook secret not configured" });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    return res.status(400).json({ message: `Webhook error: ${err.message}` });
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    console.log(`Payment succeeded: ${paymentIntent.id}`);
    // Orders are created after payment confirmation in the frontend flow
  }

  if (event.type === "account.updated") {
    const account = event.data.object as Stripe.Account;

    if (account.id) {
      const { data: restaurant } = await supabaseAdmin
        .from("restaurants")
        .select("id")
        .eq("stripe_account_id", account.id)
        .maybeSingle();

      if (restaurant?.id) {
        await syncRestaurantStripeStatus(restaurant.id, account);
      }
    }
  }

  res.json({ received: true });
};

export const getConnectStatus = async (req: Request, res: Response) => {
  const { restaurantId } = req.params;

  try {
    const restaurant = await getOwnedRestaurant(restaurantId, req.userId);

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    if (!restaurant.stripe_account_id) {
      return res.json({
        hasAccount: false,
        chargesEnabled: false,
        payoutsEnabled: false,
        onboardingComplete: false,
      });
    }

    const account = await stripe.accounts.retrieve(restaurant.stripe_account_id);
    await syncRestaurantStripeStatus(restaurantId, account);

    return res.json({
      hasAccount: true,
      accountId: account.id,
      chargesEnabled: !!account.charges_enabled,
      payoutsEnabled: !!account.payouts_enabled,
      onboardingComplete: !!(account.details_submitted && account.charges_enabled && account.payouts_enabled),
    });
  } catch (err: any) {
    console.error("Stripe status error:", err);
    return res.status(500).json({ message: err.message || "Unable to fetch Stripe Connect status" });
  }
};

export const createConnectOnboardingLink = async (req: Request, res: Response) => {
  const { restaurantId, refreshUrl, returnUrl } = req.body as {
    restaurantId?: string;
    refreshUrl?: string;
    returnUrl?: string;
  };

  if (!restaurantId) {
    return res.status(400).json({ message: "restaurantId is required" });
  }

  try {
    const restaurant = await getOwnedRestaurant(restaurantId, req.userId);

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    let accountId = restaurant.stripe_account_id as string | null;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "FR",
        email: restaurant.email || req.userEmail,
        business_profile: {
          name: restaurant.name,
        },
        metadata: {
          restaurantId,
          ownerId: req.userId || "",
        },
      });

      accountId = account.id;

      await supabaseAdmin
        .from("restaurants")
        .update({
          stripe_account_id: accountId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", restaurantId);
    }

    const fallbackAppUrl = process.env.STRIPE_CONNECT_APP_URL || "http://localhost:5173";
    const refresh = refreshUrl || `${fallbackAppUrl}/dashboard`;
    const ret = returnUrl || `${fallbackAppUrl}/dashboard`;

    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refresh,
      return_url: ret,
      type: "account_onboarding",
    });

    return res.json({ url: link.url, accountId });
  } catch (err: any) {
    console.error("Stripe onboarding error:", err);
    return res.status(500).json({ message: err.message || "Unable to create onboarding link" });
  }
};
