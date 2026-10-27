-- ============================================================
-- HUNARHUB DATABASE — COMPLETE TEST SUITE
-- Run in pgAdmin Query Tool (hunarhub database)
-- ============================================================

-- ============================================================
-- SECTION 1: STRUCTURE VERIFICATION
-- ============================================================

-- 1.1 Count all objects
SELECT 'Tables' AS type, COUNT(*) AS count
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
UNION ALL
SELECT 'Views', COUNT(*)
FROM information_schema.views 
WHERE table_schema = 'public'
UNION ALL
SELECT 'Triggers', COUNT(*)
FROM information_schema.triggers 
WHERE event_object_schema = 'public'
UNION ALL
SELECT 'Custom Indexes', COUNT(*)
FROM pg_indexes 
WHERE schemaname = 'public' AND indexname LIKE 'idx_%'
UNION ALL
SELECT 'ENUM Types', COUNT(*)
FROM pg_type 
WHERE typtype = 'e' AND typnamespace = 'public'::regnamespace;

-- EXPECTED: Tables=15, Views=3, Triggers=2, Indexes=6, ENUMs=6


-- 1.2 List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- EXPECTED: 15 tables (admins, agents, ..., users)


-- ============================================================
-- SECTION 2: DATA VERIFICATION
-- ============================================================

-- 2.1 Row counts for all tables
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

-- EXPECTED (tumhare data ke hisaab se):
-- Users=5, Regions=15, Categories=7, Agents=2, Customers=2, Admins=1,
-- Sellers=2, Products=3, Commission_Rules=2, Orders=2, Order_Items=3,
-- Order_Status_History=5, Reviews=1, Reports=0, Payouts=1


-- ============================================================
-- SECTION 3: TRIGGER TESTS
-- ============================================================

-- 3.1 COMMISSION TRIGGER — Verify commission was auto-filled
-- Order 1 is 'Delivered', commission should be filled
-- Pehle status change karo (Placed)
UPDATE Orders SET status = 'Placed' WHERE order_id = 1;

-- Ab phir se Delivered karo — trigger fire hoga!
UPDATE Orders SET status = 'Delivered' WHERE order_id = 1;

SELECT order_id, product_id, quantity, unit_price, 
       commission_rate, commission_amount
FROM Order_Items 
WHERE order_id = 1
ORDER BY order_item_id;

-- EXPECTED:
-- order_id | product_id | quantity | unit_price | commission_rate | commission_amount
-- 1        | 1          | 2        | 2500.00    | 10.00           | 500.00
-- 1        | 2          | 1        | 1800.00    | 10.00           | 180.00
--
-- ⚠️ If commission_rate is NULL → trigger didn't fire. Run:
-- UPDATE Orders SET status = 'Delivered' WHERE order_id = 1;


-- 3.2 REVIEW TRIGGER — Try review on non-delivered order (should FAIL)
-- Order 2 is 'Placed', review should be rejected

INSERT INTO Reviews (order_id, rating, comment) 
VALUES (2, 5, 'Test review - should fail');

-- EXPECTED: ERROR: Review allowed only for Delivered orders
-- ⚠️ If it succeeded → trigger missing. Re-run Step 12 from earlier.


-- 3.3 REVIEW TRIGGER — Valid review on delivered order (should SUCCEED)
-- This will be on order 1 (already has a review - skip if duplicate error)
-- Instead, test with new delivered order in Section 4.


-- ============================================================
-- SECTION 4: FULL FLOW TEST — New Order Lifecycle
-- ============================================================

-- 4.1 Check initial stock
SELECT product_id, name, available_qty 
FROM Products WHERE product_id = 3;
-- EXPECTED: available_qty = 8


-- 4.2 Place new order (customer 3 orders from seller 2, agent 2)
INSERT INTO Orders (customer_id, seller_id, agent_id, status, order_date) 
VALUES (3, 2, 2, 'Placed', NOW())
RETURNING order_id;
-- EXPECTED: order_id = 3 (or next available)


-- 4.3 Add order items (2 cakes @ 2200)
INSERT INTO Order_Items (order_id, product_id, quantity, unit_price) 
VALUES (3, 3, 2, 2200.00);


-- 4.4 Reduce stock
UPDATE Products 
SET available_qty = available_qty - 2 
WHERE product_id = 3;

SELECT product_id, name, available_qty FROM Products WHERE product_id = 3;
-- EXPECTED: available_qty = 6


-- 4.5 Status history — Placed
INSERT INTO Order_Status_History (order_id, status, changed_by_user_id) 
VALUES (3, 'Placed', 3);


-- 4.6 Confirm order
UPDATE Orders SET status = 'Confirmed' WHERE order_id = 3;
INSERT INTO Order_Status_History (order_id, status, changed_by_user_id) 
VALUES (3, 'Confirmed', 2);


-- 4.7 Mark Ready
UPDATE Orders SET status = 'Ready' WHERE order_id = 3;
INSERT INTO Order_Status_History (order_id, status, changed_by_user_id) 
VALUES (3, 'Ready', 2);


-- 4.8 Mark Delivered (TRIGGER FIRES!)
UPDATE Orders SET status = 'Delivered' WHERE order_id = 3;
INSERT INTO Order_Status_History (order_id, status, changed_by_user_id) 
VALUES (3, 'Delivered', 2);

SELECT order_id, customer_id, seller_id, agent_id, status, order_date
FROM Orders WHERE order_id = 3;

-- Step 1: Order 3 ko Delivered karo
UPDATE Orders SET status = 'Delivered' WHERE order_id = 3;

-- 4.9 Verify commission was auto-calculated
SELECT order_id, product_id, quantity, unit_price, 
       commission_rate, commission_amount
FROM Order_Items 
WHERE order_id = 3;

-- EXPECTED:
-- order_id | product_id | quantity | unit_price | commission_rate | commission_amount
-- 3        | 3          | 2        | 2200.00    | 12.00           | 528.00
-- (12% = Baking category rate; 2 × 2200 × 12% = 528)


-- 4.10 Add review on delivered order (should SUCCEED)
INSERT INTO Reviews (order_id, rating, comment) 
VALUES (3, 4, 'Good cakes, delivery was slightly delayed');


-- ============================================================
-- SECTION 5: VIEWS VERIFICATION
-- ============================================================

-- 5.1 Order Summary
SELECT * FROM Order_Summary ORDER BY order_id;

-- EXPECTED:
-- order_id | customer_id | seller_id | agent_id | status    | order_total | commission_total
-- 1        | 3           | 1         | 1        | Delivered | 6800.00     | 680.00
-- 2        | 4           | 2         | 2        | Placed    | 2200.00     | (null)
-- 3        | 3           | 2         | 2        | Delivered | 4400.00     | 528.00


-- 5.2 Seller Ratings
SELECT * FROM Seller_Ratings ORDER BY seller_id;

-- EXPECTED:
-- seller_id | avg_rating | review_count
-- 1         | 5.0        | 1
-- 2         | 4.0        | 1


-- 5.3 Agent Earnings
SELECT * FROM Agent_Earnings ORDER BY agent_id;

-- EXPECTED:
-- agent_id | total_earned | total_paid
-- 1        | 680.00       | 500.00
-- 2        | 528.00       | 0


-- ============================================================
-- SECTION 6: REAL-WORLD QUERIES
-- ============================================================

-- 6.1 Pending Orders (not Delivered, not Cancelled)
SELECT 
    o.order_id,
    u.name AS customer_name,
    s.name AS seller_name,
    STRING_AGG(p.name || ' x' || oi.quantity, ', ') AS items,
    SUM(oi.quantity * oi.unit_price) AS order_total,
    o.status,
    o.order_date
FROM Orders o
JOIN Users u         ON u.user_id = o.customer_id
JOIN Sellers s       ON s.seller_id = o.seller_id
JOIN Order_Items oi  ON oi.order_id = o.order_id
JOIN Products p      ON p.product_id = oi.product_id
WHERE o.status NOT IN ('Delivered', 'Cancelled')
GROUP BY o.order_id, u.name, s.name, o.status, o.order_date
ORDER BY o.order_date DESC;

-- EXPECTED: Order 2 (Hina Shahid - Placed - Chocolate Cake x1 - 2200)


-- 6.2 Complete Order Details (all orders)
SELECT 
    o.order_id,
    u.name AS customer_name,
    s.name AS seller_name,
    p.name AS product_name,
    oi.quantity,
    oi.unit_price,
    (oi.quantity * oi.unit_price) AS line_total,
    o.status,
    o.order_date
FROM Orders o
JOIN Users u         ON u.user_id = o.customer_id
JOIN Sellers s       ON s.seller_id = o.seller_id
JOIN Order_Items oi  ON oi.order_id = o.order_id
JOIN Products p      ON p.product_id = oi.product_id
ORDER BY o.order_id, oi.order_item_id;

-- EXPECTED: 4 rows (order 1 has 2 items, order 2 has 1, order 3 has 1)


-- 6.3 Order Audit Trail (status history)
SELECT 
    h.order_id,
    h.status,
    h.changed_at,
    u.name AS changed_by
FROM Order_Status_History h
JOIN Users u ON u.user_id = h.changed_by_user_id
ORDER BY h.order_id, h.changed_at;

-- EXPECTED: Order 1 (4 entries), Order 2 (1), Order 3 (4)


-- 6.4 Agent Pending Commission (earned - paid)
SELECT 
    agent_id,
    total_earned,
    total_paid,
    (total_earned - total_paid) AS pending_commission
FROM Agent_Earnings
ORDER BY agent_id;

-- EXPECTED:
-- agent_id | total_earned | total_paid | pending_commission
-- 1        | 680.00       | 500.00     | 180.00
-- 2        | 528.00       | 0          | 528.00


-- 6.5 Top Selling Products
SELECT 
    p.product_id,
    p.name AS product_name,
    s.name AS seller_name,
    SUM(oi.quantity) AS total_units_sold,
    SUM(oi.quantity * oi.unit_price) AS total_revenue
FROM Order_Items oi
JOIN Products p ON p.product_id = oi.product_id
JOIN Sellers s  ON s.seller_id = p.seller_id
JOIN Orders o   ON o.order_id = oi.order_id
WHERE o.status = 'Delivered'
GROUP BY p.product_id, p.name, s.name
ORDER BY total_revenue DESC;

-- EXPECTED: Chocolate Cake or Kurta (depending on orders)


-- ============================================================
-- SECTION 7: CANCEL FLOW TEST
-- ============================================================

-- 7.1 Place new order to cancel
INSERT INTO Orders (customer_id, seller_id, agent_id, status) 
VALUES (4, 1, 1, 'Placed')
RETURNING order_id;
-- EXPECTED: order_id = 4

INSERT INTO Order_Items (order_id, product_id, quantity, unit_price) 
VALUES (4, 1, 1, 2500.00);

-- Stock reduce
UPDATE Products SET available_qty = available_qty - 1 WHERE product_id = 1;

-- Check stock
SELECT product_id, name, available_qty FROM Products WHERE product_id = 1;
-- BEFORE cancel: should be 20 - 1 (this order) - 2 (order 1, if not returned) = check


-- 7.2 Cancel order
UPDATE Orders SET status = 'Cancelled' WHERE order_id = 4;
INSERT INTO Order_Status_History (order_id, status, changed_by_user_id) 
VALUES (4, 'Cancelled', 4);

-- Restore stock
UPDATE Products SET available_qty = available_qty + 1 WHERE product_id = 1;

-- Verify stock restored
SELECT product_id, name, available_qty FROM Products WHERE product_id = 1;


-- ============================================================
-- SECTION 8: FINAL SUMMARY
-- ============================================================

-- 8.1 Final counts after all tests
SELECT 'Orders' AS table_name, COUNT(*) FROM Orders
UNION ALL SELECT 'Order_Items', COUNT(*) FROM Order_Items
UNION ALL SELECT 'Order_Status_History', COUNT(*) FROM Order_Status_History
UNION ALL SELECT 'Reviews', COUNT(*) FROM Reviews
ORDER BY table_name;

-- EXPECTED:
-- Orders = 4 (original 2 + new 2 from tests)
-- Order_Items = 5 (original 3 + 1 from test 4.3 + 1 from test 7.1)
-- Order_Status_History = 5 + 4 (order 3) + 1 (order 4 placed) + 1 (order 4 cancelled) = 11
-- Reviews = 3 (original 1 + order 3 review + [order 4 review failed])


-- 8.2 Commission summary
SELECT 
    o.order_id,
    o.status,
    COUNT(oi.order_item_id) AS item_count,
    SUM(oi.quantity * oi.unit_price) AS order_total,
    SUM(oi.commission_amount) AS total_commission
FROM Orders o
LEFT JOIN Order_Items oi ON oi.order_id = o.order_id
GROUP BY o.order_id, o.status
ORDER BY o.order_id;

-- EXPECTED:
-- order 1: Delivered, 2 items, 6800.00, 680.00
-- order 2: Placed, 1 item, 2200.00, (null)
-- order 3: Delivered, 1 item, 4400.00, 528.00
-- order 4: Cancelled, 1 item, 2500.00, (null)