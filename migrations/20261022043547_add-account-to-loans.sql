ALTER TABLE loans ADD COLUMN account_id uuid REFERENCES accounts(id);

CREATE INDEX idx_loans_account_id ON loans(account_id);

DROP POLICY "loans_insert_own" ON loans;

CREATE POLICY "loans_insert_own" ON loans
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM contacts WHERE id = contact_id AND user_id = auth.uid())
    AND (account_id IS NULL OR EXISTS (SELECT 1 FROM accounts WHERE id = account_id AND user_id = auth.uid()))
  );
