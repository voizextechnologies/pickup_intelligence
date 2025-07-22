/*
  # Fix queries.credits_used column to support decimal values

  1. Schema Changes
    - Alter `queries.credits_used` column from integer to numeric(10,2)
    - This allows storing decimal credit values like 2.2, 1.5, etc.

  2. Notes
    - This fixes the "invalid input syntax for type integer" error when recording queries with decimal credit costs
    - Existing integer values will be automatically converted to numeric format
*/

-- Alter the credits_used column in queries table to support decimal values
DO $$
BEGIN
  -- Check if the column exists and is of integer type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'queries' 
    AND column_name = 'credits_used' 
    AND data_type = 'integer'
  ) THEN
    -- Alter the column type to numeric(10,2)
    ALTER TABLE queries ALTER COLUMN credits_used TYPE numeric(10,2);
  END IF;
END $$;