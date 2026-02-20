import Stripe from "stripe";

// Initialised lazily so the module can be imported at build time without the
// env var being present (Next.js static analysis runs in a keyless env).
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("Missing STRIPE_SECRET_KEY environment variable");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-01-28.clover",
      typescript: true,
    });
  }
  return _stripe;
}

// Re-export a lazy singleton so existing `stripe.xxx` call-sites keep working.
export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_t, prop: string | symbol) {
    return Reflect.get(getStripe(), prop, getStripe());
  },
});
