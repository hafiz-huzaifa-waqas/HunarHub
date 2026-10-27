-- creating enums to defined allowed values/ roles etc
CREATE TYPE user_role       AS ENUM ('Agent','Customer','Admin');
CREATE TYPE seller_status   AS ENUM ('Pending','Verified','Inactive');
 -- now end my e stands for enum and ye is liye kia tsky aagy jaky same name ki problem na ay
CREATE TYPE product_type_e  AS ENUM ('Product','Service');
CREATE TYPE order_status    AS ENUM ('Placed','Confirmed','Ready','Delivered','Cancelled');
CREATE TYPE report_status   AS ENUM ('Open','Resolved');
CREATE TYPE access_level_e  AS ENUM ('Standard','Super');

-- users : a common or master group jaha agent,customer,admin sab hein.
CREATE TABLE Users (
    user_id       SERIAL PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    contact       VARCHAR(30)  NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role          user_role    NOT NULL
);
-- regions : tells areas 
CREATE TABLE Regions (
    region_id SERIAL PRIMARY KEY,
    name      VARCHAR(80) NOT NULL UNIQUE
);
-- now categories which will tell ky konsa kaam like henna, tailoring etc
CREATE TABLE Categories ( 
    category_id SERIAL PRIMARY KEY,
    name        VARCHAR(80) NOT NULL UNIQUE
);
CREATE TABLE Agents (
    agent_id  INT PRIMARY KEY REFERENCES Users(user_id), 
    region_id INT NOT NULL REFERENCES Regions(region_id)
);

CREATE TABLE Customers (
    customer_id INT PRIMARY KEY REFERENCES Users(user_id),
    region_id   INT NOT NULL REFERENCES Regions(region_id),
    address     VARCHAR(200)
);

CREATE TABLE Admins (
    admin_id     INT PRIMARY KEY REFERENCES Users(user_id),
    access_level access_level_e DEFAULT 'Standard'
);
/* Sellers ka koi "User" nahi hai (SRS: "Sellers do not log in"). Isliye apni independent ID.
contact number unique is liye nhi kia ky what if ik hi ghr sy do categories ky business ho.
verified by admin id my Naya seller Pending status se start hota hai. Abhi verify nahi hua 
— isliye "kis admin ne verify kiya?" ka jawab NULL hoga. Jab admin verify karega, 
tabhi yeh column fill hoga. NULL allowed = logical, kyunki value abhi exist nahi karti.

consent_date DATE NOT NULL — kya hai ye?
BR-1 ka requirement.SRS:"An Agent may act for a seller only after seller has given consent.
so Date record karna zaroori hai legal/compliance ke liye.
*/
CREATE TABLE Sellers (
    seller_id            SERIAL PRIMARY KEY,
    name                 VARCHAR(100) NOT NULL,
    contact              VARCHAR(30)  NOT NULL,
    region_id            INT NOT NULL REFERENCES Regions(region_id),
    category_id          INT NOT NULL REFERENCES Categories(category_id),
    managed_by_agent_id  INT NOT NULL REFERENCES Agents(agent_id),
    status               seller_status DEFAULT 'Pending',
    consent_date         DATE NOT NULL,
    verified_by_admin_id INT REFERENCES Admins(admin_id)
);
CREATE TABLE Products (
    product_id    SERIAL PRIMARY KEY,
    seller_id     INT NOT NULL REFERENCES Sellers(seller_id),
    category_id   INT NOT NULL REFERENCES Categories(category_id),
    name          VARCHAR(120) NOT NULL,
    product_type  product_type_e NOT NULL,
    price         NUMERIC(10,2) NOT NULL CHECK (price > 0),
    available_qty INT NOT NULL CHECK (available_qty >= 0),
	-- why =0 too? if not so quanity khtm hony py row delete krni pr jati
    image_url     VARCHAR(255),
    is_active     BOOLEAN DEFAULT TRUE
);

CREATE TABLE Commission_Rules (
    rule_id               SERIAL PRIMARY KEY,
    category_id           INT NOT NULL UNIQUE REFERENCES Categories(category_id),
    commission_percentage NUMERIC(5,2) NOT NULL 
        CHECK (commission_percentage BETWEEN 0 AND 100)
);

CREATE TABLE Orders (
    order_id      SERIAL PRIMARY KEY,
    customer_id   INT NOT NULL REFERENCES Customers(customer_id),
    seller_id     INT NOT NULL REFERENCES Sellers(seller_id),
    agent_id      INT NOT NULL REFERENCES Agents(agent_id),
    status        order_status DEFAULT 'Placed',  -- order status bhi is enum(declared above)
    order_date    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scheduled_for DATE
);
-- a bridge table which solves our M:N problem
CREATE TABLE Order_Items (
    order_item_id     SERIAL PRIMARY KEY,
    order_id          INT NOT NULL REFERENCES Orders(order_id),
    product_id        INT NOT NULL REFERENCES Products(product_id),
    quantity          INT NOT NULL CHECK (quantity > 0),
    unit_price        NUMERIC(10,2) NOT NULL, -- ye history save krrhy taky customer ny jb order kia tb ki price hi save rhy 
    commission_rate   NUMERIC(5,2),
    commission_amount NUMERIC(10,2),
    UNIQUE (order_id, product_id)
);

--Har status change ka record
CREATE TABLE Order_Status_History (
    history_id         SERIAL PRIMARY KEY,
    order_id           INT NOT NULL REFERENCES Orders(order_id),
    status             order_status NOT NULL,
    changed_by_user_id INT NOT NULL REFERENCES Users(user_id),
    changed_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Reviews (
    review_id  SERIAL PRIMARY KEY,
    order_id   INT NOT NULL UNIQUE REFERENCES Orders(order_id),
    rating     SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment    VARCHAR(500), --null allowed because har customer comment nhi likhta hy
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Order pe problem report — customer ya agent file kare.
CREATE TABLE Reports (
    report_id            SERIAL PRIMARY KEY,
    order_id             INT NOT NULL REFERENCES Orders(order_id),
    filed_by_user_id     INT NOT NULL REFERENCES Users(user_id),
    description          VARCHAR(500) NOT NULL,
    status               report_status DEFAULT 'Open',
    resolved_by_admin_id INT REFERENCES Admins(admin_id),
    created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
--Admin ne agent ko kitny paisy diye — record.
CREATE TABLE Payouts (
    payout_id            SERIAL PRIMARY KEY,
    agent_id             INT NOT NULL REFERENCES Agents(agent_id),
    amount               NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    paid_on              DATE NOT NULL,
    recorded_by_admin_id INT NOT NULL REFERENCES Admins(admin_id)
);


-- ab tables sb hogaye, so now for speed optimization:
-- indexes bana rhy jo searching fast kry common queries ki

CREATE INDEX idx_products_category  ON Products(category_id);
CREATE INDEX idx_products_seller    ON Products(seller_id);
CREATE INDEX idx_sellers_region     ON Sellers(region_id);
CREATE INDEX idx_orders_customer    ON Orders(customer_id);
CREATE INDEX idx_orders_agent_stat  ON Orders(agent_id, status);
CREATE INDEX idx_orderitems_order   ON Order_Items(order_id);

/* Bina index → PostgreSQL poori table scan karta hai (10,000 rows → 10,000 checks)

Index ke saath → B-tree structure se seedha row mil jati hai (log(n) steps)
like in a book we have an index to direct go on that page else we haev to check whole book.
WHICH COLUMNS to choose ? 
jo mostly where,join,order by me ziada use ho
*/

-- Ek trigger banao jo order Delivered hone pe automatically commission calculate kare.
-- function jo trigger any py kam kryac
-- replace is liye taky dobara chalany py error nahi ay.
CREATE OR REPLACE FUNCTION fn_commission_on_delivery()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'Delivered' AND OLD.status <> 'Delivered' THEN
        UPDATE Order_Items oi
        SET commission_rate   = cr.commission_percentage,
            commission_amount = ROUND(
                oi.quantity * oi.unit_price * cr.commission_percentage / 100, 2
            )
        FROM Products p
        JOIN Commission_Rules cr ON cr.category_id = p.category_id
        WHERE oi.product_id = p.product_id
          AND oi.order_id   = NEW.order_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql; -- says that function is written in psql procedural lang.

-- it is trigger tells event + timings
CREATE TRIGGER trg_commission_on_delivery
AFTER UPDATE ON Orders
FOR EACH ROW
EXECUTE FUNCTION fn_commission_on_delivery();

-- trigger jo review mangy but after order is delivered.
CREATE OR REPLACE FUNCTION fn_review_only_delivered()
RETURNS TRIGGER AS $$
DECLARE
    v_status order_status; -- storing order status temp. to compare in if
BEGIN
    SELECT status INTO v_status 
    FROM Orders 
    WHERE order_id = NEW.order_id;

    IF v_status <> 'Delivered' THEN
        RAISE EXCEPTION 'Review allowed only for Delivered orders';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_review_only_delivered
BEFORE INSERT ON Reviews
FOR EACH ROW
EXECUTE FUNCTION fn_review_only_delivered();


/* Calculated Reports= views . 3 bna rhy to calculate data and made reports
View = "virtual table". Data store nahi hota,Har SELECT pe live query chalti hai.
*/

-- Har order ka total amount aur total commission calculate karta hai.
CREATE OR REPLACE VIEW Order_Summary AS
SELECT o.order_id, o.customer_id, o.seller_id, o.agent_id, o.status,
       SUM(oi.quantity * oi.unit_price) AS order_total,
       SUM(oi.commission_amount)        AS commission_total
FROM Orders o
JOIN Order_Items oi ON oi.order_id = o.order_id
GROUP BY o.order_id, o.customer_id, o.seller_id, o.agent_id, o.status;

--Har seller ki average rating aur total reviews calculate karta hai.
CREATE OR REPLACE VIEW Seller_Ratings AS
SELECT o.seller_id,
       ROUND(AVG(r.rating), 1) AS avg_rating,
       COUNT(*)                AS review_count
FROM Reviews r
JOIN Orders o ON o.order_id = r.order_id
GROUP BY o.seller_id;

-- Har agent ka total earned commission aur total paid like admin ne kitna diya
CREATE OR REPLACE VIEW Agent_Earnings AS
SELECT a.agent_id,
       COALESCE((SELECT SUM(os.commission_total)
                 FROM Order_Summary os
                 WHERE os.agent_id = a.agent_id
                   AND os.status = 'Delivered'), 0) AS total_earned,
       COALESCE((SELECT SUM(p.amount)
                 FROM Payouts p
                 WHERE p.agent_id = a.agent_id), 0) AS total_paid
FROM Agents a;


-- DATABASE CREATION COMPLETED .
