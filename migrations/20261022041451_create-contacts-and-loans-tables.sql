CREATE TABLE contacts (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id),
  name       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_contacts_user_id ON contacts(user_id);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contacts_select_own" ON contacts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "contacts_insert_own" ON contacts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "contacts_update_own" ON contacts
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "contacts_delete_own" ON contacts
  FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE loans (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id),
  contact_id  uuid NOT NULL REFERENCES contacts(id),
  direction   text NOT NULL CHECK (direction IN ('lent', 'borrowed')),
  amount      numeric NOT NULL CHECK (amount > 0),
  description text NOT NULL DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_loans_user_id ON loans(user_id);
CREATE INDEX idx_loans_contact_id ON loans(contact_id);

ALTER TABLE loans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "loans_select_own" ON loans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "loans_insert_own" ON loans
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM contacts WHERE id = contact_id AND user_id = auth.uid())
  );

CREATE POLICY "loans_update_own" ON loans
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "loans_delete_own" ON loans
  FOR DELETE USING (auth.uid() = user_id);
