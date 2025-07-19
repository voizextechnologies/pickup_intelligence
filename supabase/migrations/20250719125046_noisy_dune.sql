/*
  # Add identicard upload support to officer registrations

  1. Schema Changes
    - Add `identicard_url` column to `officer_registrations` table to store the uploaded file URL
    
  2. Security
    - Column allows NULL values initially for backward compatibility
    - Will be made required in the application logic for new registrations
*/

-- Add identicard_url column to officer_registrations table
ALTER TABLE public.officer_registrations 
ADD COLUMN identicard_url text;

-- Add comment for documentation
COMMENT ON COLUMN public.officer_registrations.identicard_url IS 'URL to the uploaded identicard or official ID proof document';