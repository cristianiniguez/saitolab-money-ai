ALTER TABLE loans ADD COLUMN date date NOT NULL DEFAULT CURRENT_DATE;

UPDATE loans SET date = created_at::date;
