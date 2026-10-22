CREATE TABLE transfers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id),
  from_account_id uuid NOT NULL REFERENCES accounts(id),
  to_account_id   uuid NOT NULL REFERENCES accounts(id),
  amount          numeric NOT NULL CHECK (amount > 0),
  to_amount       numeric NOT NULL CHECK (to_amount > 0),
  name            text NOT NULL DEFAULT '',
  date            date NOT NULL DEFAULT CURRENT_DATE,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CHECK (from_account_id <> to_account_id)
);

CREATE INDEX idx_transfers_user_id ON transfers(user_id);
CREATE INDEX idx_transfers_from_account_id ON transfers(from_account_id);
CREATE INDEX idx_transfers_to_account_id ON transfers(to_account_id);

ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transfers_select_own" ON transfers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "transfers_insert_own" ON transfers
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM accounts WHERE id = from_account_id AND user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM accounts WHERE id = to_account_id AND user_id = auth.uid())
  );

CREATE POLICY "transfers_update_own" ON transfers
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "transfers_delete_own" ON transfers
  FOR DELETE USING (auth.uid() = user_id);
