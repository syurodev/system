-- =================================================================
-- PAYMENT SERVICE - DATABASE SCHEMA
-- =================================================================
-- This schema handles all financial transactions, wallet management,
-- content monetization, and revenue sharing for the WibuTime platform.
-- Key features: Multi-currency support, Grace period for rentals,
-- Auto-renewal, Revenue sharing, Audit compliance.
-- =================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_crypto";

-- =================================================================
-- ENUMS & TYPES
-- =================================================================

-- Currency support (VND primary, USD future)
CREATE TYPE currency_enum AS ENUM (
    'VND',  -- Vietnamese Dong (primary)
    'USD'   -- US Dollar (future expansion)
);

-- Transaction types for wallet operations
CREATE TYPE transaction_type_enum AS ENUM (
    'DEPOSIT',           -- User adds money to wallet
    'PURCHASE',          -- Buy content (permanent)
    'RENTAL',           -- Rent content (temporary)
    'REFUND',           -- Money returned (future)
    'REVENUE_SHARE',    -- Creator revenue distribution
    'PAYOUT',           -- Creator withdrawal
    'SUBSCRIPTION',     -- Subscription payment
    'DONATION',         -- Direct creator support
    'ADMIN_ADJUSTMENT'  -- Admin balance correction
);

-- Transaction status tracking
CREATE TYPE transaction_status_enum AS ENUM (
    'PENDING',          -- Transaction initiated
    'PROCESSING',       -- Being processed by gateway
    'COMPLETED',        -- Successfully completed
    'FAILED',          -- Failed processing
    'CANCELLED',       -- User cancelled
    'REFUNDED'         -- Money returned
);

-- Content types for purchases/rentals (matching catalog service)
CREATE TYPE content_type_enum AS ENUM (
    'NOVEL',
    'NOVEL_VOLUME',
    'NOVEL_CHAPTER',
    'MANGA',
    'MANGA_VOLUME', 
    'MANGA_CHAPTER',
    'ANIME',
    'ANIME_SEASON',
    'ANIME_EPISODE'
);

-- Rental status with grace period support
CREATE TYPE rental_status_enum AS ENUM (
    'ACTIVE',           -- Currently valid
    'EXPIRED',          -- Past expiry but within grace period
    'GRACE_PERIOD',     -- Explicitly in grace period
    'TERMINATED',       -- Hard termination after grace period
    'CANCELLED'         -- User cancelled before expiry
);

-- Payment gateway types
CREATE TYPE payment_gateway_enum AS ENUM (
    'STRIPE',           -- Primary gateway
    'MOMO',            -- Vietnamese payment (future)
    'VNPAY',           -- Vietnamese payment (future)
    'INTERNAL'         -- Internal wallet transactions
);

-- Payment method types
CREATE TYPE payment_method_enum AS ENUM (
    'CREDIT_CARD',      -- Credit/Debit cards
    'BANK_TRANSFER',    -- Direct bank transfer
    'E_WALLET',         -- MoMo, VNPay, etc.
    'CRYPTO'           -- Cryptocurrency (future)
);

-- Auto-renewal attempt status
CREATE TYPE renewal_attempt_status_enum AS ENUM (
    'PENDING',          -- Scheduled for renewal
    'SUCCESS',          -- Successfully renewed
    'FAILED',           -- Failed (insufficient funds, etc.)
    'CANCELLED',        -- User cancelled auto-renewal
    'MAX_ATTEMPTS'      -- Exceeded retry limit
);

-- Pricing rule types
CREATE TYPE pricing_rule_type_enum AS ENUM (
    'BASE_PRICE',       -- Regular pricing
    'DISCOUNT',         -- Percentage discount
    'BUNDLE',           -- Bundle pricing
    'EARLY_BIRD',       -- Early access pricing
    'VIP_DISCOUNT',     -- VIP member discount
    'COUPON'           -- Coupon code pricing
);

-- =================================================================
-- CORE WALLET SYSTEM
-- =================================================================

-- User wallet balances
CREATE TABLE user_wallets (
    user_id UUID PRIMARY KEY,  -- References users(id) from Account Service
    balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    currency currency_enum NOT NULL DEFAULT 'VND',
    
    -- Security and audit
    last_transaction_at TIMESTAMPTZ,
    is_frozen BOOLEAN DEFAULT FALSE,  -- Admin can freeze suspicious accounts
    daily_spend_limit DECIMAL(15,2) DEFAULT 1000000.00, -- 1M VND default
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT positive_balance CHECK (balance >= 0),
    CONSTRAINT positive_daily_limit CHECK (daily_spend_limit >= 0)
);

-- Wallet transaction history (immutable audit log)
CREATE TABLE wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- References user_wallets(user_id)
    
    -- Transaction details
    transaction_type transaction_type_enum NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency currency_enum NOT NULL DEFAULT 'VND',
    
    -- Balance tracking
    balance_before DECIMAL(15,2) NOT NULL,
    balance_after DECIMAL(15,2) NOT NULL,
    
    -- Reference to source transaction
    reference_id UUID, -- Links to payment_transactions, purchases, etc.
    reference_type TEXT, -- 'payment_transaction', 'content_purchase', etc.
    
    -- Metadata
    description TEXT,
    metadata JSONB, -- Flexible data for different transaction types
    
    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID, -- Admin user for manual adjustments
    
    -- Constraints
    FOREIGN KEY (user_id) REFERENCES user_wallets(user_id),
    CONSTRAINT non_zero_amount CHECK (amount != 0),
    CONSTRAINT valid_balance_calculation CHECK (
        (transaction_type IN ('DEPOSIT', 'REFUND', 'ADMIN_ADJUSTMENT') AND balance_after = balance_before + amount) OR
        (transaction_type NOT IN ('DEPOSIT', 'REFUND', 'ADMIN_ADJUSTMENT') AND balance_after = balance_before - ABS(amount))
    )
);

-- =================================================================
-- PAYMENT GATEWAY INTEGRATION
-- =================================================================

-- Payment method preferences for users
CREATE TABLE user_payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    
    -- Payment method details
    gateway_type payment_gateway_enum NOT NULL,
    method_type payment_method_enum NOT NULL,
    
    -- Gateway-specific data (encrypted)
    gateway_customer_id TEXT, -- Stripe customer ID
    payment_method_id TEXT,   -- Stripe payment method ID
    encrypted_data TEXT,      -- Encrypted sensitive data
    
    -- Display information
    display_name TEXT, -- "Visa ending in 4242"
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT one_default_per_user UNIQUE (user_id, is_default) 
        DEFERRABLE INITIALLY DEFERRED
);

-- External payment transactions (deposits, subscriptions)
CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    
    -- Transaction details
    amount DECIMAL(15,2) NOT NULL,
    currency currency_enum NOT NULL DEFAULT 'VND',
    transaction_type transaction_type_enum NOT NULL,
    status transaction_status_enum NOT NULL DEFAULT 'PENDING',
    
    -- Gateway integration
    gateway_type payment_gateway_enum NOT NULL,
    gateway_transaction_id TEXT, -- Stripe Payment Intent ID
    gateway_customer_id TEXT,
    
    -- Processing details
    payment_method_id UUID, -- References user_payment_methods(id)
    
    -- Error handling
    failure_reason TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    
    -- Webhook data
    webhook_data JSONB,
    webhook_received_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT positive_amount CHECK (amount > 0),
    FOREIGN KEY (payment_method_id) REFERENCES user_payment_methods(id)
);

-- =================================================================
-- CONTENT MONETIZATION
-- =================================================================

-- Permanent content purchases
CREATE TABLE content_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    
    -- Content reference (to Catalog Service)
    content_id UUID NOT NULL,
    content_type content_type_enum NOT NULL,
    
    -- Purchase details
    price_paid DECIMAL(10,2) NOT NULL,
    currency currency_enum NOT NULL DEFAULT 'VND',
    
    -- Discount tracking
    original_price DECIMAL(10,2),
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    discount_reason TEXT, -- "VIP_DISCOUNT", "COUPON_SUMMER2024", etc.
    
    -- Payment reference
    payment_transaction_id UUID REFERENCES payment_transactions(id),
    wallet_transaction_id UUID REFERENCES wallet_transactions(id),
    
    -- Creator revenue tracking (calculated at purchase time)
    creator_team_id UUID, -- References teams(id) from Account Service
    platform_revenue DECIMAL(10,2) NOT NULL,
    creator_revenue DECIMAL(10,2) NOT NULL,
    
    -- Timestamps
    purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT positive_price CHECK (price_paid > 0),
    CONSTRAINT valid_discount CHECK (discount_amount >= 0 AND discount_amount <= original_price),
    CONSTRAINT valid_revenue_split CHECK (platform_revenue + creator_revenue = price_paid),
    
    -- Unique constraint to prevent duplicate purchases
    UNIQUE (user_id, content_id, content_type)
);

-- Time-limited content rentals with grace period support
CREATE TABLE content_rentals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    
    -- Content reference
    content_id UUID NOT NULL,
    content_type content_type_enum NOT NULL,
    
    -- Rental period configuration
    rental_period INTERVAL NOT NULL, -- '7 days', '30 days'
    start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expiry_date TIMESTAMPTZ NOT NULL,
    
    -- Grace period (24 hours after expiry)
    grace_period_end TIMESTAMPTZ GENERATED ALWAYS AS (expiry_date + INTERVAL '24 hours') STORED,
    
    -- Auto-renewal settings
    auto_renewal BOOLEAN DEFAULT FALSE,
    auto_renewal_price DECIMAL(10,2), -- Price for next renewal
    
    -- Status tracking
    status rental_status_enum DEFAULT 'ACTIVE',
    terminated_at TIMESTAMPTZ,
    termination_reason TEXT,
    
    -- Financial details
    price_paid DECIMAL(10,2) NOT NULL,
    currency currency_enum NOT NULL DEFAULT 'VND',
    
    -- Payment references
    payment_transaction_id UUID REFERENCES payment_transactions(id),
    wallet_transaction_id UUID REFERENCES wallet_transactions(id),
    
    -- Creator revenue tracking
    creator_team_id UUID,
    platform_revenue DECIMAL(10,2) NOT NULL,
    creator_revenue DECIMAL(10,2) NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT positive_rental_price CHECK (price_paid > 0),
    CONSTRAINT valid_rental_period CHECK (expiry_date > start_date),
    CONSTRAINT valid_rental_revenue_split CHECK (platform_revenue + creator_revenue = price_paid),
    
    -- One active rental per user per content
    UNIQUE (user_id, content_id, content_type, status) 
        WHERE status IN ('ACTIVE', 'EXPIRED', 'GRACE_PERIOD')
);

-- Auto-renewal tracking for rentals
CREATE TABLE rental_auto_renewals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rental_id UUID NOT NULL REFERENCES content_rentals(id) ON DELETE CASCADE,
    
    -- Renewal scheduling
    next_renewal_date TIMESTAMPTZ NOT NULL,
    renewal_price DECIMAL(10,2) NOT NULL,
    renewal_period INTERVAL NOT NULL,
    
    -- Attempt tracking
    attempts_count INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    last_attempt_at TIMESTAMPTZ,
    next_attempt_at TIMESTAMPTZ,
    
    -- Status
    status renewal_attempt_status_enum DEFAULT 'PENDING',
    failure_reason TEXT,
    
    -- Settings
    is_active BOOLEAN DEFAULT TRUE,
    user_cancelled_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT positive_renewal_price CHECK (renewal_price > 0),
    CONSTRAINT valid_attempt_count CHECK (attempts_count >= 0 AND attempts_count <= max_attempts)
);

-- =================================================================
-- REVENUE SHARING & CREATOR PAYOUTS
-- =================================================================

-- Creator team revenue sharing configuration
CREATE TABLE creator_revenue_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL, -- References teams(id) from Account Service
    
    -- Revenue split percentages
    platform_percentage DECIMAL(5,2) NOT NULL DEFAULT 25.00, -- 25%
    creator_percentage DECIMAL(5,2) NOT NULL DEFAULT 75.00,  -- 75%
    
    -- Validity period
    effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    effective_until TIMESTAMPTZ,
    
    -- Configuration details
    notes TEXT,
    created_by UUID, -- Admin user who set the rates
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_percentage_split CHECK (
        platform_percentage + creator_percentage = 100.00
    ),
    CONSTRAINT valid_percentages CHECK (
        platform_percentage >= 0 AND platform_percentage <= 100 AND
        creator_percentage >= 0 AND creator_percentage <= 100
    ),
    
    -- Ensure no overlapping periods for same team
    EXCLUDE USING gist (
        team_id WITH =,
        tstzrange(effective_from, effective_until, '[)') WITH &&
    )
);

-- Revenue transaction tracking for creators
CREATE TABLE revenue_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL,
    
    -- Source transaction reference
    source_transaction_id UUID NOT NULL, -- References content_purchases(id) or content_rentals(id)
    source_transaction_type TEXT NOT NULL, -- 'content_purchase' or 'content_rental'
    
    -- Revenue amounts
    total_amount DECIMAL(15,2) NOT NULL,    -- Original transaction amount
    platform_amount DECIMAL(15,2) NOT NULL, -- Platform's share
    creator_amount DECIMAL(15,2) NOT NULL,   -- Creator's share
    currency currency_enum NOT NULL DEFAULT 'VND',
    
    -- Percentage rates used (for audit)
    platform_percentage DECIMAL(5,2) NOT NULL,
    creator_percentage DECIMAL(5,2) NOT NULL,
    
    -- Payout tracking
    payout_batch_id UUID, -- References payout_batches(id)
    paid_out_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT positive_amounts CHECK (
        total_amount > 0 AND platform_amount >= 0 AND creator_amount >= 0
    ),
    CONSTRAINT valid_revenue_calculation CHECK (
        platform_amount + creator_amount = total_amount
    )
);

-- Scheduled payouts to creators
CREATE TABLE payout_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Payout period
    payout_period_start DATE NOT NULL,
    payout_period_end DATE NOT NULL,
    
    -- Payout details
    total_creator_amount DECIMAL(15,2) NOT NULL,
    total_platform_amount DECIMAL(15,2) NOT NULL,
    currency currency_enum NOT NULL DEFAULT 'VND',
    
    -- Processing status
    status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'
    processed_at TIMESTAMPTZ,
    
    -- Batch metadata
    team_count INTEGER NOT NULL DEFAULT 0,
    transaction_count INTEGER NOT NULL DEFAULT 0,
    
    -- Created by admin
    created_by UUID NOT NULL,
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_payout_period CHECK (payout_period_end > payout_period_start),
    CONSTRAINT positive_payout_amounts CHECK (
        total_creator_amount >= 0 AND total_platform_amount >= 0
    )
);

-- Individual creator payouts within a batch
CREATE TABLE creator_payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payout_batch_id UUID NOT NULL REFERENCES payout_batches(id),
    team_id UUID NOT NULL,
    
    -- Payout amounts
    amount DECIMAL(15,2) NOT NULL,
    currency currency_enum NOT NULL DEFAULT 'VND',
    
    -- Transaction count for this creator in the period
    transaction_count INTEGER NOT NULL DEFAULT 0,
    
    -- Payout method (future expansion)
    payout_method TEXT DEFAULT 'BANK_TRANSFER',
    payout_details JSONB, -- Bank account, etc.
    
    -- Status tracking
    status TEXT NOT NULL DEFAULT 'PENDING',
    processed_at TIMESTAMPTZ,
    failure_reason TEXT,
    
    -- External reference (bank transaction ID, etc.)
    external_reference TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT positive_payout_amount CHECK (amount > 0),
    CONSTRAINT positive_transaction_count CHECK (transaction_count > 0)
);

-- =================================================================
-- PRICING & DISCOUNTS
-- =================================================================

-- Dynamic pricing rules
CREATE TABLE pricing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Rule identification
    rule_name TEXT NOT NULL,
    rule_type pricing_rule_type_enum NOT NULL,
    description TEXT,
    
    -- Content targeting
    content_id UUID, -- Specific content (optional)
    content_type content_type_enum, -- Content type filter (optional)
    team_id UUID, -- Creator team filter (optional)
    
    -- Pricing logic
    base_price DECIMAL(10,2),
    discount_percentage DECIMAL(5,2),
    discount_amount DECIMAL(10,2),
    minimum_price DECIMAL(10,2) DEFAULT 0,
    
    -- User targeting
    user_subscription_level INTEGER, -- 0=Free, 1=Premium, 2=VIP
    user_country_code TEXT, -- Geographic pricing
    
    -- Validity period
    valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    
    -- Usage limits
    max_uses INTEGER, -- Total usage limit
    max_uses_per_user INTEGER DEFAULT 1,
    current_uses INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Admin tracking
    created_by UUID NOT NULL,
    approved_by UUID,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_pricing_logic CHECK (
        (discount_percentage IS NULL OR (discount_percentage >= 0 AND discount_percentage <= 100)) AND
        (discount_amount IS NULL OR discount_amount >= 0)
    ),
    CONSTRAINT valid_validity_period CHECK (
        valid_until IS NULL OR valid_until > valid_from
    )
);

-- Coupon codes for discounts
CREATE TABLE coupon_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Coupon identification
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    
    -- Discount configuration
    discount_type TEXT NOT NULL, -- 'PERCENTAGE', 'FIXED_AMOUNT'
    discount_value DECIMAL(10,2) NOT NULL,
    minimum_purchase DECIMAL(10,2) DEFAULT 0,
    maximum_discount DECIMAL(10,2), -- Cap for percentage discounts
    
    -- Content restrictions
    applicable_content_types content_type_enum[], -- Array of allowed types
    excluded_content_ids UUID[], -- Specific content exclusions
    
    -- User restrictions
    user_subscription_requirement INTEGER, -- Minimum subscription level
    new_users_only BOOLEAN DEFAULT FALSE,
    
    -- Usage tracking
    max_total_uses INTEGER,
    max_uses_per_user INTEGER DEFAULT 1,
    current_total_uses INTEGER DEFAULT 0,
    
    -- Validity
    valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_until TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Admin tracking
    created_by UUID NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT positive_discount_value CHECK (discount_value > 0),
    CONSTRAINT valid_discount_type CHECK (discount_type IN ('PERCENTAGE', 'FIXED_AMOUNT')),
    CONSTRAINT valid_coupon_period CHECK (valid_until > valid_from)
);

-- Coupon usage tracking
CREATE TABLE coupon_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID NOT NULL REFERENCES coupon_codes(id),
    user_id UUID NOT NULL,
    
    -- Usage details
    transaction_id UUID NOT NULL, -- References content_purchases or content_rentals
    transaction_type TEXT NOT NULL, -- 'content_purchase' or 'content_rental'
    
    -- Discount applied
    original_amount DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) NOT NULL,
    final_amount DECIMAL(10,2) NOT NULL,
    
    -- Timestamps
    used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_coupon_discount CHECK (
        discount_amount >= 0 AND 
        discount_amount <= original_amount AND
        final_amount = original_amount - discount_amount
    ),
    
    -- Prevent duplicate usage for same transaction
    UNIQUE (transaction_id, transaction_type)
);

-- =================================================================
-- TAX CALCULATION & COMPLIANCE
-- =================================================================

-- Tax calculation for transactions
CREATE TABLE tax_calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Transaction reference
    transaction_id UUID NOT NULL,
    transaction_type TEXT NOT NULL, -- 'content_purchase', 'content_rental', 'subscription'
    
    -- Tax details
    tax_type TEXT NOT NULL DEFAULT 'VAT', -- 'VAT', 'GST', 'SALES_TAX'
    tax_rate DECIMAL(5,4) NOT NULL, -- 0.1000 for 10% VAT
    
    -- Amounts
    taxable_amount DECIMAL(15,2) NOT NULL,
    tax_amount DECIMAL(15,2) NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    currency currency_enum NOT NULL DEFAULT 'VND',
    
    -- Geographic/regulatory context
    country_code CHAR(2) NOT NULL DEFAULT 'VN',
    tax_jurisdiction TEXT,
    
    -- Compliance tracking
    tax_period DATE, -- For tax reporting periods
    reported_to_authorities BOOLEAN DEFAULT FALSE,
    report_batch_id UUID,
    
    -- Timestamps
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT positive_tax_rate CHECK (tax_rate >= 0 AND tax_rate <= 1),
    CONSTRAINT valid_tax_calculation CHECK (
        tax_amount = ROUND(taxable_amount * tax_rate, 2) AND
        total_amount = taxable_amount + tax_amount
    )
);

-- =================================================================
-- SUBSCRIPTION MANAGEMENT
-- =================================================================

-- Subscription payment tracking (separate from Account Service subscriptions)
CREATE TABLE subscription_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    
    -- Subscription details
    subscription_plan INTEGER NOT NULL, -- 1=Premium, 2=VIP
    billing_period INTERVAL NOT NULL, -- '1 month', '12 months'
    
    -- Payment details
    amount DECIMAL(10,2) NOT NULL,
    currency currency_enum NOT NULL DEFAULT 'VND',
    
    -- Period covered by this payment
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Payment processing
    payment_transaction_id UUID REFERENCES payment_transactions(id),
    wallet_transaction_id UUID REFERENCES wallet_transactions(id),
    
    -- Auto-renewal
    is_renewal BOOLEAN DEFAULT FALSE,
    previous_subscription_transaction_id UUID REFERENCES subscription_transactions(id),
    auto_renew BOOLEAN DEFAULT TRUE,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'CANCELLED', 'EXPIRED'
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT positive_subscription_amount CHECK (amount > 0),
    CONSTRAINT valid_subscription_period CHECK (period_end > period_start),
    CONSTRAINT valid_subscription_plan CHECK (subscription_plan IN (1, 2))
);

-- =================================================================
-- AUDIT & FRAUD DETECTION
-- =================================================================

-- Daily spending tracking for fraud detection
CREATE TABLE daily_spending_limits (
    user_id UUID PRIMARY KEY,
    spend_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Daily spending
    total_spent DECIMAL(15,2) DEFAULT 0.00,
    transaction_count INTEGER DEFAULT 0,
    
    -- Limits
    daily_limit DECIMAL(15,2) NOT NULL DEFAULT 1000000.00, -- 1M VND
    
    -- Status
    limit_exceeded BOOLEAN DEFAULT FALSE,
    limit_exceeded_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT positive_spending CHECK (total_spent >= 0),
    CONSTRAINT positive_transaction_count CHECK (transaction_count >= 0),
    
    -- Unique per user per date
    UNIQUE (user_id, spend_date)
);

-- Fraud detection alerts
CREATE TABLE fraud_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    
    -- Alert details
    alert_type TEXT NOT NULL, -- 'SPENDING_LIMIT', 'UNUSUAL_PATTERN', 'MULTIPLE_FAILURES'
    risk_level TEXT NOT NULL DEFAULT 'MEDIUM', -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    description TEXT NOT NULL,
    
    -- Context data
    transaction_id UUID, -- Related transaction if applicable
    metadata JSONB, -- Additional context data
    
    -- Resolution
    status TEXT NOT NULL DEFAULT 'OPEN', -- 'OPEN', 'INVESTIGATING', 'RESOLVED', 'FALSE_POSITIVE'
    resolved_by UUID, -- Admin user
    resolution_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT valid_risk_level CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    CONSTRAINT valid_status CHECK (status IN ('OPEN', 'INVESTIGATING', 'RESOLVED', 'FALSE_POSITIVE'))
);

-- =================================================================
-- INDEXES FOR PERFORMANCE
-- =================================================================

-- User wallet indexes
CREATE INDEX idx_user_wallets_user_id ON user_wallets(user_id);
CREATE INDEX idx_user_wallets_currency ON user_wallets(currency);

-- Wallet transaction indexes
CREATE INDEX idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX idx_wallet_transactions_type ON wallet_transactions(transaction_type);
CREATE INDEX idx_wallet_transactions_created_at ON wallet_transactions(created_at DESC);
CREATE INDEX idx_wallet_transactions_reference ON wallet_transactions(reference_id, reference_type);

-- Payment transaction indexes
CREATE INDEX idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_payment_transactions_gateway ON payment_transactions(gateway_type, gateway_transaction_id);
CREATE INDEX idx_payment_transactions_created_at ON payment_transactions(created_at DESC);

-- Content purchase indexes
CREATE INDEX idx_content_purchases_user_id ON content_purchases(user_id);
CREATE INDEX idx_content_purchases_content ON content_purchases(content_id, content_type);
CREATE INDEX idx_content_purchases_team_id ON content_purchases(creator_team_id);
CREATE INDEX idx_content_purchases_purchased_at ON content_purchases(purchased_at DESC);

-- Content rental indexes
CREATE INDEX idx_content_rentals_user_id ON content_rentals(user_id);
CREATE INDEX idx_content_rentals_content ON content_rentals(content_id, content_type);
CREATE INDEX idx_content_rentals_status ON content_rentals(status);
CREATE INDEX idx_content_rentals_expiry ON content_rentals(expiry_date);
CREATE INDEX idx_content_rentals_grace_period ON content_rentals(grace_period_end);
CREATE INDEX idx_content_rentals_auto_renewal ON content_rentals(auto_renewal) WHERE auto_renewal = true;

-- Revenue transaction indexes
CREATE INDEX idx_revenue_transactions_team_id ON revenue_transactions(team_id);
CREATE INDEX idx_revenue_transactions_payout_batch ON revenue_transactions(payout_batch_id);
CREATE INDEX idx_revenue_transactions_created_at ON revenue_transactions(created_at DESC);

-- Tax calculation indexes
CREATE INDEX idx_tax_calculations_transaction ON tax_calculations(transaction_id, transaction_type);
CREATE INDEX idx_tax_calculations_period ON tax_calculations(tax_period);
CREATE INDEX idx_tax_calculations_country ON tax_calculations(country_code);

-- Fraud detection indexes
CREATE INDEX idx_daily_spending_limits_user_date ON daily_spending_limits(user_id, spend_date);
CREATE INDEX idx_fraud_alerts_user_id ON fraud_alerts(user_id);
CREATE INDEX idx_fraud_alerts_status ON fraud_alerts(status);
CREATE INDEX idx_fraud_alerts_risk_level ON fraud_alerts(risk_level);

-- =================================================================
-- TRIGGERS FOR BUSINESS LOGIC
-- =================================================================

-- Update wallet balance after transaction
CREATE OR REPLACE FUNCTION update_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE user_wallets 
    SET 
        balance = NEW.balance_after,
        last_transaction_at = NEW.created_at,
        updated_at = NEW.created_at
    WHERE user_id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_wallet_balance
    AFTER INSERT ON wallet_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_wallet_balance();

-- Update rental status when expired
CREATE OR REPLACE FUNCTION check_rental_expiry()
RETURNS TRIGGER AS $$
BEGIN
    -- Mark as expired if past expiry date but within grace period
    IF NEW.expiry_date <= NOW() AND NEW.grace_period_end > NOW() AND NEW.status = 'ACTIVE' THEN
        NEW.status = 'GRACE_PERIOD';
        NEW.updated_at = NOW();
    END IF;
    
    -- Mark as terminated if past grace period
    IF NEW.grace_period_end <= NOW() AND NEW.status IN ('ACTIVE', 'GRACE_PERIOD') THEN
        NEW.status = 'TERMINATED';
        NEW.terminated_at = NOW();
        NEW.termination_reason = 'Grace period expired';
        NEW.updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_rental_expiry
    BEFORE UPDATE ON content_rentals
    FOR EACH ROW
    EXECUTE FUNCTION check_rental_expiry();

-- Track daily spending for fraud detection
CREATE OR REPLACE FUNCTION track_daily_spending()
RETURNS TRIGGER AS $$
DECLARE
    spending_record daily_spending_limits%ROWTYPE;
BEGIN
    -- Only track spending transactions
    IF NEW.transaction_type NOT IN ('PURCHASE', 'RENTAL', 'SUBSCRIPTION', 'DONATION') THEN
        RETURN NEW;
    END IF;
    
    -- Insert or update daily spending
    INSERT INTO daily_spending_limits (user_id, spend_date, total_spent, transaction_count)
    VALUES (NEW.user_id, CURRENT_DATE, ABS(NEW.amount), 1)
    ON CONFLICT (user_id, spend_date)
    DO UPDATE SET
        total_spent = daily_spending_limits.total_spent + ABS(NEW.amount),
        transaction_count = daily_spending_limits.transaction_count + 1,
        updated_at = NOW();
    
    -- Get current spending record
    SELECT * INTO spending_record 
    FROM daily_spending_limits 
    WHERE user_id = NEW.user_id AND spend_date = CURRENT_DATE;
    
    -- Check if limit exceeded
    IF spending_record.total_spent > spending_record.daily_limit AND NOT spending_record.limit_exceeded THEN
        -- Mark limit as exceeded
        UPDATE daily_spending_limits 
        SET 
            limit_exceeded = true, 
            limit_exceeded_at = NOW() 
        WHERE user_id = NEW.user_id AND spend_date = CURRENT_DATE;
        
        -- Create fraud alert
        INSERT INTO fraud_alerts (user_id, alert_type, risk_level, description, transaction_id, metadata)
        VALUES (
            NEW.user_id,
            'SPENDING_LIMIT',
            'HIGH',
            'User exceeded daily spending limit',
            NEW.id,
            jsonb_build_object(
                'daily_limit', spending_record.daily_limit,
                'total_spent', spending_record.total_spent,
                'transaction_count', spending_record.transaction_count
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_track_daily_spending
    AFTER INSERT ON wallet_transactions
    FOR EACH ROW
    EXECUTE FUNCTION track_daily_spending();

-- =================================================================
-- VIEWS FOR REPORTING
-- =================================================================

-- Daily revenue summary
CREATE VIEW daily_revenue_summary AS
SELECT 
    DATE(purchased_at) as revenue_date,
    COUNT(*) as transaction_count,
    SUM(price_paid) as total_revenue,
    SUM(platform_revenue) as platform_revenue,
    SUM(creator_revenue) as creator_revenue,
    currency
FROM content_purchases
WHERE purchased_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE(purchased_at), currency
UNION ALL
SELECT 
    DATE(created_at) as revenue_date,
    COUNT(*) as transaction_count,
    SUM(price_paid) as total_revenue,
    SUM(platform_revenue) as platform_revenue,
    SUM(creator_revenue) as creator_revenue,
    currency
FROM content_rentals
WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE(created_at), currency
ORDER BY revenue_date DESC;

-- Creator revenue summary
CREATE VIEW creator_revenue_summary AS
SELECT 
    rt.team_id,
    COUNT(rt.id) as transaction_count,
    SUM(rt.total_amount) as total_revenue,
    SUM(rt.platform_amount) as platform_revenue,
    SUM(rt.creator_amount) as creator_revenue,
    COALESCE(SUM(CASE WHEN rt.paid_out_at IS NOT NULL THEN rt.creator_amount ELSE 0 END), 0) as paid_out_amount,
    SUM(CASE WHEN rt.paid_out_at IS NULL THEN rt.creator_amount ELSE 0 END) as pending_payout_amount,
    rt.currency
FROM revenue_transactions rt
GROUP BY rt.team_id, rt.currency
ORDER BY creator_revenue DESC;

-- User spending analytics
CREATE VIEW user_spending_analytics AS
SELECT 
    w.user_id,
    w.balance as current_balance,
    COUNT(wt.id) as transaction_count,
    SUM(CASE WHEN wt.transaction_type = 'DEPOSIT' THEN wt.amount ELSE 0 END) as total_deposits,
    SUM(CASE WHEN wt.transaction_type IN ('PURCHASE', 'RENTAL') THEN ABS(wt.amount) ELSE 0 END) as total_content_spending,
    SUM(CASE WHEN wt.transaction_type = 'SUBSCRIPTION' THEN ABS(wt.amount) ELSE 0 END) as total_subscription_spending,
    w.currency
FROM user_wallets w
LEFT JOIN wallet_transactions wt ON w.user_id = wt.user_id
WHERE wt.created_at >= CURRENT_DATE - INTERVAL '30 days' OR wt.created_at IS NULL
GROUP BY w.user_id, w.balance, w.currency;

-- =================================================================
-- SAMPLE DATA FOR TESTING
-- =================================================================

-- Insert default revenue sharing rates (25% platform, 75% creator)
INSERT INTO creator_revenue_shares (team_id, platform_percentage, creator_percentage, notes)
VALUES 
    ('00000000-0000-0000-0000-000000000001'::uuid, 25.00, 75.00, 'Default rate for all creators'),
    ('00000000-0000-0000-0000-000000000002'::uuid, 20.00, 80.00, 'Premium rate for high-volume creators');

-- Insert sample pricing rules
INSERT INTO pricing_rules (rule_name, rule_type, discount_percentage, user_subscription_level, created_by)
VALUES 
    ('VIP Discount', 'VIP_DISCOUNT', 15.00, 2, '00000000-0000-0000-0000-000000000001'::uuid),
    ('Premium Discount', 'VIP_DISCOUNT', 10.00, 1, '00000000-0000-0000-0000-000000000001'::uuid);

-- Insert sample coupon codes
INSERT INTO coupon_codes (code, name, description, discount_type, discount_value, max_total_uses, valid_until, created_by)
VALUES 
    ('WELCOME2024', 'Welcome Bonus', 'Welcome discount for new users', 'PERCENTAGE', 20.00, 1000, NOW() + INTERVAL '6 months', '00000000-0000-0000-0000-000000000001'::uuid),
    ('SUMMER50K', 'Summer Sale', '50K VND off purchases over 200K VND', 'FIXED_AMOUNT', 50000.00, 500, NOW() + INTERVAL '3 months', '00000000-0000-0000-0000-000000000001'::uuid);

-- =================================================================
-- GRANTS & PERMISSIONS
-- =================================================================

-- Grant appropriate permissions to payment service role
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO payment_service_role;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO payment_service_role;

-- =================================================================
-- SCHEMA VERSION & MIGRATION INFO
-- =================================================================

-- Schema metadata
CREATE TABLE schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    description TEXT,
    applied_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO schema_migrations (version, description) 
VALUES ('001_payment_service_initial', 'Initial Payment Service schema with wallet, transactions, monetization, and revenue sharing');

-- =================================================================
-- END OF PAYMENT SERVICE SCHEMA
-- =================================================================