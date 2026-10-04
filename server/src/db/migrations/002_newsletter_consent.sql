-- One atomic MySQL 8 ALTER: duplicate legacy subscriptions cause failure,
-- leaving their records untouched. Resolve duplicates explicitly before retry.
ALTER TABLE leads
  ADD COLUMN consent_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN unsubscribed_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN newsletter_email VARCHAR(320)
    GENERATED ALWAYS AS (CASE WHEN type = 'newsletter' THEN LOWER(TRIM(email)) ELSE NULL END) STORED,
  ADD UNIQUE KEY uq_leads_newsletter_email (newsletter_email);
