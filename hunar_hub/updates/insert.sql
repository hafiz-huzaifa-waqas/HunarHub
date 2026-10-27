SELECT seller_id, name FROM Sellers;

-- 1. Naye Sellers insert karo (Karachi based)
INSERT INTO Sellers (name, contact, region_id, category_id, managed_by_agent_id, status, consent_date, verified_by_admin_id) 
VALUES 
('Amina Bakes', '0300-1112223', 1, 2, 1, 'Verified', CURRENT_DATE, 5),
('Zainab Henna Art', '0300-1112224', 1, 3, 1, 'Verified', CURRENT_DATE, 5),
('Khaliq Craft Studio', '0300-1112225', 1, 3, 1, 'Verified', CURRENT_DATE, 5),
('Rabia Loom', '0300-1112226', 1, 1, 1, 'Verified', CURRENT_DATE, 5),
('Sweet Craft Kitchen', '0300-1112227', 1, 2, 1, 'Verified', CURRENT_DATE, 5),
('Usman Folk Arts', '0300-1112228', 1, 3, 1, 'Verified', CURRENT_DATE, 5),
('Sindhi Craft Collective', '0300-1112229', 1, 3, 1, 'Verified', CURRENT_DATE, 5)
RETURNING seller_id, name;

INSERT INTO Products (seller_id, category_id, name, product_type, price, available_qty, image_url, is_active) 
VALUES 
(
    (SELECT seller_id FROM Sellers WHERE name = 'Amina Bakes'), 
    2, 'Gourmet Almond Pistachio Cake', 'Product', 1800.00, 10, 
    'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=600', TRUE
),
(
    (SELECT seller_id FROM Sellers WHERE name = 'Zainab Henna Art'), 
    3, 'Organic Bridal Henna Cone Pack', 'Product', 1200.00, 50, 
    'https://rangehina.com/wp-content/uploads/2022/01/Pack-of-4-Ultra-Magical-Organic-Henna-By-Rang-e-Hina.png', TRUE
),
(
    (SELECT seller_id FROM Sellers WHERE name = 'Khaliq Craft Studio'), 
    3, 'Hand-Painted Clay Pottery Vase', 'Product', 3200.00, 15, 
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQfiQfx3vOoJ6USxVPP55npC_Zfcty074xV5rBi0QpoJN_WiFRHsZdAX30&s=10', TRUE
),
(
    (SELECT seller_id FROM Sellers WHERE name = 'Rabia Loom'), 
    1, 'Phulkari Embroidered Dupatta', 'Product', 3800.00, 20, 
    'https://sindhhandicrafts.com/wp-content/uploads/2025/05/Handmade-Phulkari-Dupatta-6a-300x300.jpg?v=1746090228', TRUE
),
(
    (SELECT seller_id FROM Sellers WHERE name = 'Sweet Craft Kitchen'), 
    2, 'Handcrafted Honeycomb Truffles', 'Product', 1400.00, 30, 
    'https://images.unsplash.com/photo-1548848221-0c2e497ed557?auto=format&fit=crop&q=80&w=600', TRUE
),
(
    (SELECT seller_id FROM Sellers WHERE name = 'Usman Folk Arts'), 
    3, 'Truck Art Wooden Tea Tray', 'Product', 2200.00, 12, 
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRzfmyletbFan2H1YT8vK0x3IkU3jsEKDzdc17eEx4p9Q&s=10', TRUE
),
(
    (SELECT seller_id FROM Sellers WHERE name = 'Sindhi Craft Collective'), 
    3, 'Traditional Mirrorwork Cushion Set', 'Product', 2900.00, 18, 
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSWMpqZjwAG6FxyfP6nLU-s0EMpW8cjVExPj5G0kC_E1A&s=10', TRUE
);
UPDATE Products 
SET image_url = 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=600' 
WHERE name ILIKE '%Kurta%';

UPDATE Products 
SET image_url = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=600' 
WHERE name ILIKE '%Cake%';


SELECT product_id, name, image_url FROM Products;

UPDATE Products 
SET image_url ='https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTlcDMtYf6Fw0C3typOK-05b3wC3BOoSRBq7GCsYpGXBAkZBK5VNSn_BS3A&s=10'
WHERE product_id = 2;

UPDATE Products 
SET image_url ='https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSlz_81qMadhczI4xpxuVhYco8KjxiEaf4rHlEDyhN7TtNpmxRzMDpGLiA&s=10'
WHERE product_id = 1;

UPDATE Products
SET image_url = 'https://bareezeman.com/cdn/shop/files/3000000030595-_1__jpg.jpg?v=1757510656&width=360'
WHERE name ILIKE '%cotton%';

ALTER TABLE Orders ADD COLUMN shipping_fee NUMERIC(10,2) DEFAULT 200.00;

SELECT 
    p.product_id,
    p.name AS product_name,
    s.name AS seller_name,
    p.price,
    p.image_url
FROM Products p
JOIN Sellers s ON s.seller_id = p.seller_id
ORDER BY s.name, p.product_id;

UPDATE Sellers 
SET name = 'Amna Henna Art' 
WHERE name = 'Amina Henna Art';

-- 1. Cake ko Zainab Baker (Bakery) ke paas bhejo
UPDATE Products SET seller_id = (SELECT seller_id FROM Sellers WHERE name = 'Zainab Baker') WHERE name LIKE '%Cake%';

-- 2. Henna ko Zainab Henna Art ke paas bhejo
UPDATE Products SET seller_id = (SELECT seller_id FROM Sellers WHERE name = 'Zainab Henna Art') WHERE name LIKE '%Henna%';

-- 3. Truffles ko Sweet Craft Kitchen ke paas bhejo
UPDATE Products SET seller_id = (SELECT seller_id FROM Sellers WHERE name = 'Sweet Craft Kitchen') WHERE name LIKE '%Truffles%';

-- 4. Phulkari Dupatta ko Rabia Loom ke paas bhejo
UPDATE Products SET seller_id = (SELECT seller_id FROM Sellers WHERE name = 'Rabia Loom') WHERE name = 'Phulkari Embroidered Dupatta';

-- 5. Pottery Vase ko Khaliq Craft Studio ke paas bhejo
UPDATE Products SET seller_id = (SELECT seller_id FROM Sellers WHERE name = 'Khaliq Craft Studio') WHERE name LIKE '%Pottery%';

-- 6. Truck Art ko Usman Folk Arts ke paas bhejo
UPDATE Products SET seller_id = (SELECT seller_id FROM Sellers WHERE name = 'Usman Folk Arts') WHERE name LIKE '%Truck Art%';

-- 7. Mirrorwork Cushion ko Sindhi Craft Collective ke paas bhejo
-- (Note: Agar 'Sindhi Craft Collective' naam ka seller database mein nahi hai, toh usay pehle add karna padega. Agar hai, toh ye query chalegi)
UPDATE Products SET seller_id = (SELECT seller_id FROM Sellers WHERE name = 'Sindhi Craft Collective') WHERE name LIKE '%Cushion%';

-- 8. Salwar Kameez ko Fatima Stitcher ke paas bhejo (ya Sana Tailor hi rakhna hai toh rehne do)
-- Filhal Sana Tailor ke paas hai, jo ke theek hai agar wo stitching karti hai.




-- 1. Pehle Order Items delete karo (jo order 7 se jude hain)
DELETE FROM Order_Items WHERE order_id = 7;

-- 2. Phir Order Status History delete karo
DELETE FROM Order_Status_History WHERE order_id = 7;

-- 3. Phir Reviews delete karo (agar koi ho)
DELETE FROM Reviews WHERE order_id = 7;

-- 4. Aakhir mein main Order delete karo
DELETE FROM Orders WHERE order_id = 7;