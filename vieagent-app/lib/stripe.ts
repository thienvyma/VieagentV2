import Stripe from 'stripe';

export const stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY, {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        apiVersion: '2025-01-27.acacia' as any,
        typescript: true,
    })
    : null;
