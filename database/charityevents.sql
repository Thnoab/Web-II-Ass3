DROP DATABASE IF EXISTS charityevents_db;
CREATE DATABASE charityevents_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE charityevents_db;

CREATE TABLE organizations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  contact_email VARCHAR(200),
  contact_phone VARCHAR(50),
  website VARCHAR(255)
);

CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  short_description VARCHAR(500),
  description TEXT,
  location VARCHAR(255),
  date DATE,
  start_time TIME NULL,
  end_time TIME NULL,
  price DECIMAL(10,2) DEFAULT 0.00,
  goal DECIMAL(12,2) DEFAULT 0.00,
  progress DECIMAL(12,2) DEFAULT 0.00,
  category_id INT,
  org_id INT,
  suspended BOOLEAN DEFAULT FALSE,
  image_url VARCHAR(500) DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (org_id) REFERENCES organizations(id)
);

CREATE TABLE tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT,
  name VARCHAR(150),
  price DECIMAL(10,2),
  quantity INT DEFAULT 0,
  sold INT DEFAULT 0,
  FOREIGN KEY (event_id) REFERENCES events(id)
);

INSERT INTO organizations (name, description, contact_email, contact_phone, website) VALUES
('City Care Foundation', 'Local charity focusing on health and elderly care', 'info@citycare.org', '012-345-6789', 'https://citycare.example'),
('GreenFuture Org', 'Environmental protection and community green projects', 'hello@greenfuture.org', '012-222-3333', 'https://greenfuture.example');

INSERT INTO categories (name) VALUES
('Procession'),
('Proposal'),
('Auction'),
('Concert'),
('Propaganda');

INSERT INTO events (name, short_description, description, location, date, start_time, price, goal, progress, category_id, org_id, image_url) VALUES
('Procession 2025', '5km charity procession for children in Gaza', 'Let the world hear your voice,from the river to the sea.', 'Central Park', '2025-09-20', '09:00:00', 20.00, 5000.00, 1200.00, 1, 1, '/images/event1.jpg'),
('Autumn Charity Gala', 'Formal dinner supporting cancer research', 'A black-tie gala dinner with speeches and live music to raise funds for cancer research.', 'Grand Town Hall', '2025-10-05', '19:00:00', 120.00, 20000.00, 8000.00, 2, 1, '/images/event2.jpg'),
('Silent Art Auction', 'Auction of donated artworks', 'Bid on donated artworks. Proceeds go to community art programs.', 'Community Center', '2025-10-12', '18:00:00', 0.00, 10000.00, 3000.00, 3, 2, '/images/event3.jpg'),
('Music for Hope', 'Benefit concert with local bands', 'Local bands perform to raise funds for youth music education.', 'City Arena', '2025-11-01', '18:30:00', 35.00, 15000.00, 6000.00, 4, 2, '/images/event4.jpg'),
('Community Propaganda', 'Incitement of fundraising activities', 'Promote donations by speeches.', 'University', '2025-09-10', '10:00:00', 0.00, 2000.00, 450.00, 5, 1, '/images/event5.jpg'),
('Charity Bike Ride', '20km ride raising awareness', 'A family-friendly bike ride along the river. Sponsor per rider.', 'Riverside Park', '2025-10-20', '08:30:00', 15.00, 8000.00, 1500.00, 1, 1, '/images/event6.jpg'),
('Green Proposal', 'Eco-friendly fundraising proposal', 'A green-themed proposal supporting desert greening initiatives.', 'Rooftop Hall', '2025-11-15', '19:00:00', 95.00, 12000.00, 2000.00, 2, 2, '/images/event7.jpg'),
('Youth Talent Auction', 'Auction of performance slots', 'Bid for slots in a youth talent night — proceeds support youth programs.', 'Youth Center', '2025-12-01', '17:00:00', 0.00, 3000.00, 100.00, 3, 1, '/images/event8.jpg');

-- A3 部分
-- ===== 新增的 registrations 表（用于记录用户为活动报名的信息） =====
CREATE TABLE registrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  full_name VARCHAR(200) NOT NULL,
  email VARCHAR(200) NOT NULL,
  phone VARCHAR(50),
  num_tickets INT DEFAULT 1,
  ticket_id INT NULL,
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  contact_address VARCHAR(255) DEFAULT '',
  UNIQUE KEY uniq_event_email (event_id, email),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE SET NULL
);

-- ===== 插入示例 registrations（10最少） =====
INSERT INTO registrations (event_id, full_name, email, phone, num_tickets, ticket_id, registered_at) VALUES
(1, 'Bianca Abercrombie', 'biancaabercrombie@clinic.com', '0412-000-001', 2, NULL, '2025-08-20 10:15:00'),
(1, 'Rick Astley', 'nevergonnagiveyouup@gmail.com', '0412-000-002', 1, NULL, '2025-08-21 12:00:00'),
(2, 'H. P. Lovecraft', 'cthulhu@newengland.com', '9999-999-999', 666, NULL, '1970-01-01 12:00:00'),
(3, 'Moriya Suwako', 'moriyashrine@gensoukyou.com', '0412-222-333', 3, NULL, '2025-09-10 14:00:00'),
(4, 'Peter Griffin', 'familyguy@gmail.com', '0412-333-444', 0, NULL, '2025-09-12 18:45:00'),
(5, 'Donald J. Trump', 'Democrats Have Shut Down the Government 8d 22h 53m 42s', '(202)456-1111', 0, NULL, '2025-10-10 10:54:00'),
(6, 'Remilia Scarlet', 'Koumakan@gensoukyou.com', '0412-555-666', 6, NULL, '2025-09-15 00:00:00'),
(7, 'Hiiragi Utena', 'akunososhiki_en@x.com', '0412-666-777', 3, NULL, '2025-09-20 16:10:00'),
(8, 'Monika', 'lilmonix3@x.com', '1024-103-1292', 2, NULL, '2025-09-22 13:55:00'),
(3, 'Firefly', 'πυγολαμπίδα@honkai.com', '021-6055-5062', 2, NULL, '2024-06-19 12:00:00');

-- 你看看你要不要改，或者说你直接接到你的A2部分上

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(200) NOT NULL,
  email VARCHAR(200),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 密码“admin123”
INSERT INTO users (username, password, email)
VALUES ('admin', '$2b$10$Jv9r4iFucFvEEaL8p0BoDe21rLa5KzG1uPNXimDIfCz5JkJ0J8y76', 'admin@charity.org');