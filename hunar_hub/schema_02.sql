--TESTING OF DATA BASE: 


-- Tables count
SELECT 'Tables' AS type, COUNT(*) AS count
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
UNION ALL
-- Views count
SELECT 'Views', COUNT(*)
FROM information_schema.views 
WHERE table_schema = 'public'
UNION ALL
-- Triggers count
SELECT 'Triggers', COUNT(*)
FROM information_schema.triggers 
WHERE event_object_schema = 'public'
UNION ALL
-- Indexes count (only custom)
SELECT 'Custom Indexes', COUNT(*)
FROM pg_indexes 
WHERE schemaname = 'public' AND indexname LIKE 'idx_%'
UNION ALL
-- ENUM types count
SELECT 'ENUM Types', COUNT(*)
FROM pg_type 
WHERE typtype = 'e' 
  AND typnamespace = 'public'::regnamespace;



SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;



-- SAMPLE DATA: 
INSERT INTO Regions(name) VALUES -- har  value ko parenthesis my is liye krrhy taky new row add ho.
 ('North Nazimabad'),
('Federal B Area'), 
('Gulistan-e-Johar'),
('Gulshan-e-Iqbal'),
('DHA Karachi'),
('Clifton'),
('Saddar'),
('Malir'),
('Korangi'),
('Landhi'),
('Orangi Town'),
('Bahadurabad'),
('PECHS'),
('Tariq Road'),
('Scheme 33');


INSERT INTO Categories (name) VALUES
('Stitching'), 
('Baking'), 
('Handicrafts'),
('Henna Art'),
('Tutoring'),
('Cooking Classes'),
('Embroidery');



INSERT INTO Users (name, contact, password_hash, role) VALUES
('Aisha Khan',      '0300-1000001', 'hash', 'Agent'),
('Bushra Ali',      '0300-1000002', 'hash', 'Agent'),
('Bilal Ahmed',     '0300-2000001', 'hash', 'Customer'),
('Hina Shahid',     '0300-2000002', 'hash', 'Customer'),
('Admin One',       '0300-3000001', 'hash', 'Admin');

INSERT INTO Agents (agent_id, region_id) VALUES
(1, 1),   -- Aisha, Gulshan-e-Iqbal
(2, 2);   -- Bushra, Gulistan-e-Johar


-- Customers
INSERT INTO Customers (customer_id, region_id, address) VALUES
(3, 3, 'House 10, DHA Phase 6, Karachi'),   -- Bilal, DHA
(4, 4, 'Flat 5, Clifton Block 2, Karachi');  -- Hina, Clifton

-- Admins
INSERT INTO Admins (admin_id, access_level) VALUES
(5, 'Super');

-- Sellers (Karachi)
INSERT INTO Sellers (name, contact, region_id, category_id, 
                     managed_by_agent_id, status, consent_date, verified_by_admin_id) 
VALUES
('Fatima Stitcher',  '0321-1111111', 1, 1, 1, 'Verified', '2025-01-10', 5),
('Zainab Baker',     '0321-1111112', 2, 2, 2, 'Verified', '2025-02-15', 5);

-- Products
INSERT INTO Products (seller_id, category_id, name, product_type, price, available_qty, is_active) 
VALUES
(1, 1, 'Hand-stitched Kurta',      'Product', 2500.00, 20, TRUE),
(1, 1, 'Embroidered Dupatta',      'Product', 1800.00, 15, TRUE),
(2, 2, 'Chocolate Cake (1 kg)',    'Product', 2200.00, 8,  TRUE);

-- Commission Rules
INSERT INTO Commission_Rules (category_id, commission_percentage) VALUES
(1, 10.00),
(2, 12.00);

-- Orders (Karachi)
INSERT INTO Orders (customer_id, seller_id, agent_id, status, order_date) VALUES
(3, 1, 1, 'Delivered', '2025-10-01 10:00:00'),
(4, 2, 2, 'Placed',    '2025-10-10 14:30:00');

-- Order Items
INSERT INTO Order_Items (order_id, product_id, quantity, unit_price) VALUES
(1, 1, 2, 2500.00),
(1, 2, 1, 1800.00),
(2, 3, 1, 2200.00);

-- Status History
INSERT INTO Order_Status_History (order_id, status, changed_by_user_id, changed_at) VALUES
(1, 'Placed',    3, '2025-10-01 10:00:00'),
(1, 'Confirmed', 1, '2025-10-01 10:30:00'),
(1, 'Ready',     1, '2025-10-02 09:00:00'),
(1, 'Delivered', 1, '2025-10-03 15:00:00'),
(2, 'Placed',    4, '2025-10-10 14:30:00');

-- Review
INSERT INTO Reviews (order_id, rating, comment) VALUES
(1, 5, 'Excellent stitching, highly recommended!');

-- Payout
INSERT INTO Payouts (agent_id, amount, paid_on, recorded_by_admin_id) VALUES
(1, 500.00, '2025-10-05', 5);



SELECT 'Users' AS table_name, COUNT(*) FROM Users
UNION ALL SELECT 'Regions', COUNT(*) FROM Regions
UNION ALL SELECT 'Categories', COUNT(*) FROM Categories
UNION ALL SELECT 'Agents', COUNT(*) FROM Agents
UNION ALL SELECT 'Customers', COUNT(*) FROM Customers
UNION ALL SELECT 'Admins', COUNT(*) FROM Admins
UNION ALL SELECT 'Sellers', COUNT(*) FROM Sellers
UNION ALL SELECT 'Products', COUNT(*) FROM Products
UNION ALL SELECT 'Commission_Rules', COUNT(*) FROM Commission_Rules
UNION ALL SELECT 'Orders', COUNT(*) FROM Orders
UNION ALL SELECT 'Order_Items', COUNT(*) FROM Order_Items
UNION ALL SELECT 'Order_Status_History', COUNT(*) FROM Order_Status_History
UNION ALL SELECT 'Reviews', COUNT(*) FROM Reviews
UNION ALL SELECT 'Reports', COUNT(*) FROM Reports
UNION ALL SELECT 'Payouts', COUNT(*) FROM Payouts
ORDER BY table_name;


SELECT order_id, status, changed_by_user_id, changed_at
FROM Order_Status_History
ORDER BY order_id, changed_at; 



SELECT 
    o.order_id, u.name AS customer_name,  s.name AS seller_name,  p.name AS product_name,
    oi.quantity,  oi.unit_price,  (oi.quantity * oi.unit_price) AS line_total,
    o.status, o.order_date
FROM Orders o
JOIN Users u         ON u.user_id = o.customer_id
JOIN Sellers s       ON s.seller_id = o.seller_id
JOIN Order_Items oi  ON oi.order_id = o.order_id
JOIN Products p      ON p.product_id = oi.product_id
WHERE o.status NOT IN ('Delivered', 'Cancelled') -- agr ye nhi likho to sb orders ajay gy deleivered and placed etc
ORDER BY o.order_id, oi.order_item_id;