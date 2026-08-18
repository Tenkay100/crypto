-- SQL Database Schema for Bit Crypto Chain Investment Crypto Investments
-- Target: PostgreSQL / MySQL

-- 1. Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- SHA-256 or bcrypt hashed password
    role VARCHAR(20) DEFAULT 'user',     -- 'user', 'admin'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Portfolios Table (Linked 1:1 to Users)
CREATE TABLE portfolios (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    account_type VARCHAR(50) DEFAULT 'Standard Investor', -- 'Starter', 'Professional', 'Premium Investor', 'VIP Executive'
    status VARCHAR(20) DEFAULT 'Active',                -- 'Active', 'Suspended', 'Pending KYC'
    portfolio_value NUMERIC(15, 2) DEFAULT 0.00,        -- Total value of current assets (USD)
    asset_name VARCHAR(100) DEFAULT 'None',             -- Details of active crypto allocations
    total_profit NUMERIC(15, 2) DEFAULT 0.00,           -- Accrued yield returns
    total_deposits NUMERIC(15, 2) DEFAULT 0.00,         -- Confirmed deposits sum
    withdrawal_available NUMERIC(15, 2) DEFAULT 0.00,   -- Funds clear for immediate withdrawal (USD)
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Transactions Table
CREATE TABLE transactions (
    id VARCHAR(50) PRIMARY KEY, -- e.g., 'TX-10084'
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL,  -- 'Deposit', 'Withdraw', 'ROI Profit', 'Referral Commission'
    amount NUMERIC(15, 2) NOT NULL,
    coin VARCHAR(10) NOT NULL,  -- 'BTC', 'ETH', 'USDT', 'SOL', etc.
    reference_hash VARCHAR(255), -- Deposit transaction hash or wallet destination address
    status VARCHAR(20) DEFAULT 'Pending', -- 'Pending', 'Approved', 'Rejected'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. User Security Settings Table (Sessions / Logs)
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert Demo Account Seed Data
-- Password: Hashed value of 'Toddann18@'
INSERT INTO users (name, email, password_hash, role) 
VALUES (
    'Todd Ann Bilodeau', 
    'bilodeautoddann@gmail.com', 
    'f4b3c9597793d56f6b6be66299de807f4a2df7bc8f8c6b75f80b2a75878d655f', -- Simulated SHA256 hash
    'user'
);

INSERT INTO portfolios (user_id, account_type, status, portfolio_value, asset_name, total_profit, total_deposits, withdrawal_available)
VALUES (
    (SELECT id FROM users WHERE email = 'bilodeautoddann@gmail.com'),
    'Premium Investor',
    'Active',
    31700000.00,
    'Bitcoin (Demo Data Only)',
    4250000.00,
    27450000.00,
    2500000.00
);

INSERT INTO transactions (id, user_id, type, amount, coin, reference_hash, status, created_at)
VALUES 
('TX-10084', (SELECT id FROM users WHERE email = 'bilodeautoddann@gmail.com'), 'Deposit', 15000000.00, 'BTC', '1BitCryptoChainBTCaddress777888999xxXyZ', 'Approved', NOW() - INTERVAL '60 days'),
('TX-10085', (SELECT id FROM users WHERE email = 'bilodeautoddann@gmail.com'), 'Deposit', 12450000.00, 'BTC', '1BitCryptoChainBTCaddress777888999xxXyZ', 'Approved', NOW() - INTERVAL '30 days'),
('TX-10086', (SELECT id FROM users WHERE email = 'bilodeautoddann@gmail.com'), 'Withdraw', 100000.00, 'BTC', 'RecipientBTCWalletAddressPlaceholder', 'Approved', NOW() - INTERVAL '15 days'),
('TX-10087', (SELECT id FROM users WHERE email = 'bilodeautoddann@gmail.com'), 'ROI Profit', 4250000.00, 'BTC', 'Daily ROI settlement accrual', 'Approved', NOW() - INTERVAL '8 days');
