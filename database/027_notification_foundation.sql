-- 027_notification_foundation.sql
-- Canonical, database-backed notification domain. Timestamps are UTC.

CREATE TABLE IF NOT EXISTS user_push_devices (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  provider ENUM('expo') NOT NULL DEFAULT 'expo',
  token VARCHAR(255) NOT NULL,
  platform ENUM('ios','android','web','unknown') NOT NULL DEFAULT 'unknown',
  installation_id VARCHAR(128) DEFAULT NULL,
  app_version VARCHAR(64) DEFAULT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  last_seen_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  invalidated_at DATETIME(3) DEFAULT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY ux_push_device_token (token),
  KEY idx_push_device_user_active (user_id, is_active),
  CONSTRAINT fk_push_device_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notification_campaigns (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  type VARCHAR(64) NOT NULL,
  title VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  data JSON DEFAULT NULL,
  audience_type ENUM('all_users','specific_users','group','segment') NOT NULL DEFAULT 'all_users',
  audience JSON DEFAULT NULL,
  priority ENUM('normal','high') NOT NULL DEFAULT 'normal',
  status ENUM('draft','scheduled','active','paused','cancelled','completed') NOT NULL DEFAULT 'draft',
  schedule_timezone VARCHAR(64) NOT NULL DEFAULT 'UTC',
  start_at DATETIME(3) DEFAULT NULL,
  end_at DATETIME(3) DEFAULT NULL,
  recurrence JSON DEFAULT NULL,
  next_run_at DATETIME(3) DEFAULT NULL,
  created_by BIGINT UNSIGNED DEFAULT NULL,
  idempotency_key VARCHAR(128) DEFAULT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY ux_campaign_idempotency (idempotency_key),
  KEY idx_campaign_due (status, next_run_at),
  CONSTRAINT fk_campaign_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notification_occurrences (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  campaign_id BIGINT UNSIGNED NOT NULL,
  occurrence_key VARCHAR(160) NOT NULL,
  due_at DATETIME(3) NOT NULL,
  status ENUM('pending','processing','completed','cancelled','failed') NOT NULL DEFAULT 'pending',
  locked_until DATETIME(3) DEFAULT NULL,
  attempts SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  completed_at DATETIME(3) DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY ux_notification_occurrence (campaign_id, occurrence_key),
  KEY idx_notification_occurrence_due (status, due_at, locked_until),
  CONSTRAINT fk_occurrence_campaign FOREIGN KEY (campaign_id) REFERENCES notification_campaigns(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notification_recipients (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  occurrence_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  data JSON DEFAULT NULL,
  read_at DATETIME(3) DEFAULT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY ux_occurrence_recipient (occurrence_id, user_id),
  KEY idx_inbox_user_read_created (user_id, read_at, created_at),
  CONSTRAINT fk_recipient_occurrence FOREIGN KEY (occurrence_id) REFERENCES notification_occurrences(id) ON DELETE CASCADE,
  CONSTRAINT fk_recipient_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS push_deliveries (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  recipient_id BIGINT UNSIGNED NOT NULL,
  device_id BIGINT UNSIGNED NOT NULL,
  status ENUM('queued','submitted','delivered','failed','invalid_token') NOT NULL DEFAULT 'queued',
  ticket_id VARCHAR(255) DEFAULT NULL,
  attempts SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  next_attempt_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  locked_until DATETIME(3) DEFAULT NULL,
  last_error VARCHAR(500) DEFAULT NULL,
  submitted_at DATETIME(3) DEFAULT NULL,
  receipt_at DATETIME(3) DEFAULT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY ux_delivery_recipient_device (recipient_id, device_id),
  UNIQUE KEY ux_delivery_ticket (ticket_id),
  KEY idx_delivery_due (status, next_attempt_at, locked_until),
  CONSTRAINT fk_delivery_recipient FOREIGN KEY (recipient_id) REFERENCES notification_recipients(id) ON DELETE CASCADE,
  CONSTRAINT fk_delivery_device FOREIGN KEY (device_id) REFERENCES user_push_devices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notification_audit_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  actor_id BIGINT UNSIGNED DEFAULT NULL,
  action VARCHAR(64) NOT NULL,
  campaign_id BIGINT UNSIGNED DEFAULT NULL,
  request_id VARCHAR(128) DEFAULT NULL,
  metadata JSON DEFAULT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id), KEY idx_notification_audit_campaign (campaign_id, created_at),
  CONSTRAINT fk_notification_audit_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_notification_audit_campaign FOREIGN KEY (campaign_id) REFERENCES notification_campaigns(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
