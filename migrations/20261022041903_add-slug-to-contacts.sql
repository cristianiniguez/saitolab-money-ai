ALTER TABLE contacts ADD COLUMN slug text;

UPDATE contacts SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'));

ALTER TABLE contacts ALTER COLUMN slug SET NOT NULL;
ALTER TABLE contacts ADD CONSTRAINT contacts_user_id_slug_key UNIQUE (user_id, slug);
