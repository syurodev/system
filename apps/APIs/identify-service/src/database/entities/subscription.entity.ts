export class SubscriptionEntity {
  id: string = "";
  user_id: string = "";
  plan_type: string = "";
  status: string = "";
  current_period_end: Date | string = "";
  stripe_customer_id: string = "";
  stripe_subscription_id: string = "";
  created_at: Date | string = "";
  updated_at: Date | string = "";
}
