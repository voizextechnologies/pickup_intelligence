```sql
ALTER TABLE public.officers ALTER COLUMN credits_remaining TYPE numeric(10,2) USING credits_remaining::numeric(10,2);
ALTER TABLE public.officers ALTER COLUMN total_credits TYPE numeric(10,2) USING total_credits::numeric(10,2);

ALTER TABLE public.credit_transactions ALTER COLUMN credits TYPE numeric(10,2) USING credits::numeric(10,2);

ALTER TABLE public.apis ALTER COLUMN global_buy_price TYPE numeric(10,2) USING global_buy_price::numeric(10,2);
ALTER TABLE public.apis ALTER COLUMN global_sell_price TYPE numeric(10,2) USING global_sell_price::numeric(10,2);
ALTER TABLE public.apis ALTER COLUMN default_credit_charge TYPE numeric(10,2) USING default_credit_charge::numeric(10,2);

ALTER TABLE public.rate_plans ALTER COLUMN monthly_fee TYPE numeric(10,2) USING monthly_fee::numeric(10,2);
ALTER TABLE public.rate_plans ALTER COLUMN default_credits TYPE numeric(10,2) USING default_credits::numeric(10,2);

ALTER TABLE public.plan_apis ALTER COLUMN credit_cost TYPE numeric(10,2) USING credit_cost::numeric(10,2);
ALTER TABLE public.plan_apis ALTER COLUMN buy_price TYPE numeric(10,2) USING buy_price::numeric(10,2);
ALTER TABLE public.plan_apis ALTER COLUMN sell_price TYPE numeric(10,2) USING sell_price::numeric(10,2);
```