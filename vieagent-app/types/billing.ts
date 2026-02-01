export interface UserPurchase {
    id: string;
    user_id: string;
    agent_id: string;
    amount: number;
    created_at: string;
    receipt_url?: string;
}

export interface UserSubscription {
    id: string;
    user_id: string;
    agent_id: string;
    stripe_subscription_id?: string;
    status: 'active' | 'past_due' | 'canceled' | 'trialing';
    current_period_end: string;
    created_at: string;
}
