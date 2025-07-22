/*
  # Add decimal support for credits and pricing

  1. Schema Changes
    - Convert integer credit fields to numeric(10,2) to support decimal values
    - Update officers table: credits_remaining, total_credits
    - Update credit_transactions table: credits
    - Update apis table: default_credit_charge, global_buy_price, global_sell_price
    - Update rate_plans table: default_credits, monthly_fee
    - Update plan_apis table: credit_cost, buy_price, sell_price

  2. Data Migration
    - Preserve existing integer values as decimal equivalents
    - No data loss during conversion

  3. Benefits
    - Support for fractional credits (e.g., 1.5, 2.8)
    - More precise pricing control
    - Better cost management for APIs
*/

-- Update officers table to support decimal credits
ALTER TABLE officers 
ALTER COLUMN credits_remaining TYPE numeric(10,2),
ALTER COLUMN total_credits TYPE numeric(10,2);

-- Update credit_transactions table to support decimal credits
ALTER TABLE credit_transactions 
ALTER COLUMN credits TYPE numeric(10,2);

-- Update apis table to support decimal pricing and credits
ALTER TABLE apis 
ALTER COLUMN default_credit_charge TYPE numeric(10,2),
ALTER COLUMN global_buy_price TYPE numeric(10,2),
ALTER COLUMN global_sell_price TYPE numeric(10,2);

-- Update rate_plans table to support decimal credits and pricing
ALTER TABLE rate_plans 
ALTER COLUMN default_credits TYPE numeric(10,2),
ALTER COLUMN monthly_fee TYPE numeric(10,2);

-- Update plan_apis table to support decimal pricing and credits
ALTER TABLE plan_apis 
ALTER COLUMN credit_cost TYPE numeric(10,2),
ALTER COLUMN buy_price TYPE numeric(10,2),
ALTER COLUMN sell_price TYPE numeric(10,2);