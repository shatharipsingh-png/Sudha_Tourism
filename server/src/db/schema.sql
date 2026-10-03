SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS leads;
DROP TABLE IF EXISTS packages;
DROP TABLE IF EXISTS experiences;
DROP TABLE IF EXISTS admins;
DROP TABLE IF EXISTS destinations;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE destinations (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug VARCHAR(120) NOT NULL,
  name VARCHAR(160) NOT NULL,
  region VARCHAR(160) NOT NULL,
  short_desc VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  image VARCHAR(1000) NOT NULL,
  why_visit JSON NOT NULL,
  top_places JSON NOT NULL,
  travel_info JSON NOT NULL,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  sort INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_destinations_slug (slug),
  KEY idx_destinations_featured_sort (featured, sort)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE packages (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug VARCHAR(160) NOT NULL,
  title VARCHAR(220) NOT NULL,
  destination_id INT UNSIGNED NOT NULL,
  route VARCHAR(500) NOT NULL,
  category ENUM('family','adventure','honeymoon','spiritual','cultural','wildlife','luxury') NOT NULL,
  duration_days INT UNSIGNED NOT NULL,
  price INT UNSIGNED NOT NULL,
  rating DECIMAL(2,1) NULL,
  image VARCHAR(1000) NOT NULL,
  gallery JSON NOT NULL,
  short_desc VARCHAR(500) NOT NULL,
  highlights JSON NOT NULL,
  itinerary JSON NOT NULL,
  inclusions JSON NOT NULL,
  exclusions JSON NOT NULL,
  info JSON NOT NULL,
  best_seller BOOLEAN NOT NULL DEFAULT FALSE,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  status ENUM('published','draft') NOT NULL DEFAULT 'published',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_packages_slug (slug),
  KEY idx_packages_destination (destination_id),
  KEY idx_packages_category (category),
  KEY idx_packages_price (price),
  KEY idx_packages_duration (duration_days),
  KEY idx_packages_status_featured (status, featured),
  KEY idx_packages_best_seller (best_seller),
  CONSTRAINT fk_packages_destination FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE experiences (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug VARCHAR(120) NOT NULL,
  name VARCHAR(160) NOT NULL,
  image VARCHAR(1000) NOT NULL,
  description TEXT NOT NULL,
  examples JSON NOT NULL,
  sort INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_experiences_slug (slug),
  KEY idx_experiences_sort (sort)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE leads (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  type ENUM('enquiry','booking','contact','newsletter') NOT NULL,
  name VARCHAR(160) NULL,
  email VARCHAR(320) NOT NULL,
  phone VARCHAR(20) NULL,
  package_id INT UNSIGNED NULL,
  destination_id INT UNSIGNED NULL,
  travel_date DATE NULL,
  travelers INT UNSIGNED NULL,
  details JSON NULL,
  message TEXT NULL,
  status ENUM('new','contacted','closed') NOT NULL DEFAULT 'new',
  ip_hash CHAR(64) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_leads_type_status_created (type, status, created_at),
  KEY idx_leads_email (email),
  CONSTRAINT fk_leads_package FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE SET NULL,
  CONSTRAINT fk_leads_destination FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE admins (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(320) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_admins_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
