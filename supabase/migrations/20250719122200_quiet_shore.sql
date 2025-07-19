/*
  # Add RLS policy for officer registrations

  1. Security
    - Add policy to allow anonymous users to insert pending registration requests
    - Ensures only 'pending' status registrations can be created by public users
    - Maintains security while allowing self-registration
*/

-- Allow anonymous users to insert pending officer registrations
CREATE POLICY "Allow anonymous users to register as officers"
  ON officer_registrations
  FOR INSERT
  TO anon
  WITH CHECK (status = 'pending');