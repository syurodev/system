/**
 * Payment Service TypeScript Enums
 * 
 * This file contains all TypeScript enums, labels, and utilities 
 * for the Payment Service, including wallet management, transactions,
 * revenue sharing, and payment processing.
 */

// ===============================================================
// CORE TRANSACTION ENUMS
// ===============================================================

/**
 * Currency types supported by the platform
 */
export enum Currency {
  VND = 'VND',  // Vietnamese Dong (primary)
  USD = 'USD'   // US Dollar (future expansion)
}

/**
 * Transaction types for wallet operations
 */
export enum TransactionType {
  DEPOSIT = 'DEPOSIT',                // User adds money to wallet
  PURCHASE = 'PURCHASE',              // Buy content (permanent)
  RENTAL = 'RENTAL',                 // Rent content (temporary)  
  REFUND = 'REFUND',                 // Money returned (future)
  REVENUE_SHARE = 'REVENUE_SHARE',   // Creator revenue distribution
  PAYOUT = 'PAYOUT',                 // Creator withdrawal
  SUBSCRIPTION = 'SUBSCRIPTION',      // Subscription payment
  DONATION = 'DONATION',             // Direct creator support
  ADMIN_ADJUSTMENT = 'ADMIN_ADJUSTMENT' // Admin balance correction
}

/**
 * Transaction status tracking
 */
export enum TransactionStatus {
  PENDING = 'PENDING',       // Transaction initiated
  PROCESSING = 'PROCESSING', // Being processed by gateway
  COMPLETED = 'COMPLETED',   // Successfully completed
  FAILED = 'FAILED',        // Failed processing
  CANCELLED = 'CANCELLED',   // User cancelled
  REFUNDED = 'REFUNDED'     // Money returned
}

/**
 * Content types for purchases and rentals
 */
export enum ContentType {
  NOVEL = 'NOVEL',
  NOVEL_VOLUME = 'NOVEL_VOLUME',
  NOVEL_CHAPTER = 'NOVEL_CHAPTER',
  MANGA = 'MANGA',
  MANGA_VOLUME = 'MANGA_VOLUME', 
  MANGA_CHAPTER = 'MANGA_CHAPTER',
  ANIME = 'ANIME',
  ANIME_SEASON = 'ANIME_SEASON',
  ANIME_EPISODE = 'ANIME_EPISODE'
}

// ===============================================================
// PAYMENT GATEWAY & METHODS
// ===============================================================

/**
 * Payment gateway providers
 */
export enum PaymentGateway {
  STRIPE = 'STRIPE',     // Primary gateway
  MOMO = 'MOMO',        // Vietnamese payment (future)
  VNPAY = 'VNPAY',      // Vietnamese payment (future)
  INTERNAL = 'INTERNAL' // Internal wallet transactions
}

/**
 * Payment method types
 */
export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',    // Credit/Debit cards
  BANK_TRANSFER = 'BANK_TRANSFER', // Direct bank transfer
  E_WALLET = 'E_WALLET',          // MoMo, VNPay, etc.
  CRYPTO = 'CRYPTO'               // Cryptocurrency (future)
}

// ===============================================================
// RENTAL & SUBSCRIPTION ENUMS
// ===============================================================

/**
 * Rental status with grace period support
 */
export enum RentalStatus {
  ACTIVE = 'ACTIVE',           // Currently valid
  EXPIRED = 'EXPIRED',         // Past expiry but within grace period
  GRACE_PERIOD = 'GRACE_PERIOD', // Explicitly in grace period
  TERMINATED = 'TERMINATED',    // Hard termination after grace period
  CANCELLED = 'CANCELLED'      // User cancelled before expiry
}

/**
 * Auto-renewal attempt status
 */
export enum RenewalAttemptStatus {
  PENDING = 'PENDING',         // Scheduled for renewal
  SUCCESS = 'SUCCESS',         // Successfully renewed
  FAILED = 'FAILED',          // Failed (insufficient funds, etc.)
  CANCELLED = 'CANCELLED',     // User cancelled auto-renewal
  MAX_ATTEMPTS = 'MAX_ATTEMPTS' // Exceeded retry limit
}

/**
 * Subscription plans
 */
export enum SubscriptionPlan {
  PREMIUM = 1, // Premium subscription
  VIP = 2      // VIP subscription
}

// ===============================================================
// PRICING & DISCOUNT ENUMS
// ===============================================================

/**
 * Pricing rule types
 */
export enum PricingRuleType {
  BASE_PRICE = 'BASE_PRICE',     // Regular pricing
  DISCOUNT = 'DISCOUNT',         // Percentage discount
  BUNDLE = 'BUNDLE',            // Bundle pricing
  EARLY_BIRD = 'EARLY_BIRD',    // Early access pricing
  VIP_DISCOUNT = 'VIP_DISCOUNT', // VIP member discount
  COUPON = 'COUPON'             // Coupon code pricing
}

/**
 * Discount types for coupons
 */
export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',     // Percentage-based discount
  FIXED_AMOUNT = 'FIXED_AMOUNT'  // Fixed amount discount
}

// ===============================================================
// FRAUD DETECTION & SECURITY
// ===============================================================

/**
 * Fraud alert types
 */
export enum FraudAlertType {
  SPENDING_LIMIT = 'SPENDING_LIMIT',     // Exceeded daily spending limit
  UNUSUAL_PATTERN = 'UNUSUAL_PATTERN',   // Unusual spending pattern
  MULTIPLE_FAILURES = 'MULTIPLE_FAILURES' // Multiple failed transactions
}

/**
 * Risk levels for fraud detection
 */
export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM', 
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

/**
 * Fraud alert resolution status
 */
export enum FraudAlertStatus {
  OPEN = 'OPEN',                     // Alert is open
  INVESTIGATING = 'INVESTIGATING',   // Under investigation
  RESOLVED = 'RESOLVED',             // Issue resolved
  FALSE_POSITIVE = 'FALSE_POSITIVE'  // False alarm
}

// ===============================================================
// PAYOUT & REVENUE ENUMS
// ===============================================================

/**
 * Payout batch status
 */
export enum PayoutBatchStatus {
  PENDING = 'PENDING',       // Scheduled for processing
  PROCESSING = 'PROCESSING', // Currently being processed
  COMPLETED = 'COMPLETED',   // Successfully completed
  FAILED = 'FAILED'          // Processing failed
}

/**
 * Individual payout status
 */
export enum PayoutStatus {
  PENDING = 'PENDING',       // Scheduled for payout
  PROCESSING = 'PROCESSING', // Being processed
  COMPLETED = 'COMPLETED',   // Successfully paid
  FAILED = 'FAILED'          // Payout failed
}

/**
 * Payout methods
 */
export enum PayoutMethod {
  BANK_TRANSFER = 'BANK_TRANSFER', // Bank transfer
  E_WALLET = 'E_WALLET',          // Electronic wallet
  CRYPTO = 'CRYPTO'               // Cryptocurrency
}

// ===============================================================
// TAX & COMPLIANCE
// ===============================================================

/**
 * Tax types for compliance
 */
export enum TaxType {
  VAT = 'VAT',             // Value Added Tax
  GST = 'GST',             // Goods and Services Tax
  SALES_TAX = 'SALES_TAX'  // Sales Tax
}

/**
 * Subscription transaction status
 */
export enum SubscriptionTransactionStatus {
  ACTIVE = 'ACTIVE',       // Currently active
  CANCELLED = 'CANCELLED', // User cancelled
  EXPIRED = 'EXPIRED'      // Subscription expired
}

// ===============================================================
// VIETNAMESE LABELS
// ===============================================================

/**
 * Currency labels for UI
 */
export const CurrencyLabels: Record<Currency, string> = {
  [Currency.VND]: 'VNĐ',
  [Currency.USD]: 'USD',
};

/**
 * Transaction type labels
 */
export const TransactionTypeLabels: Record<TransactionType, string> = {
  [TransactionType.DEPOSIT]: 'Nạp tiền',
  [TransactionType.PURCHASE]: 'Mua nội dung',
  [TransactionType.RENTAL]: 'Thuê nội dung',
  [TransactionType.REFUND]: 'Hoàn tiền',
  [TransactionType.REVENUE_SHARE]: 'Chia sẻ doanh thu',
  [TransactionType.PAYOUT]: 'Rút tiền',
  [TransactionType.SUBSCRIPTION]: 'Thanh toán gói',
  [TransactionType.DONATION]: 'Ủng hộ tác giả',
  [TransactionType.ADMIN_ADJUSTMENT]: 'Điều chỉnh admin',
};

/**
 * Transaction status labels
 */
export const TransactionStatusLabels: Record<TransactionStatus, string> = {
  [TransactionStatus.PENDING]: 'Đang xử lý',
  [TransactionStatus.PROCESSING]: 'Đang giao dịch',
  [TransactionStatus.COMPLETED]: 'Hoàn thành',
  [TransactionStatus.FAILED]: 'Thất bại',
  [TransactionStatus.CANCELLED]: 'Đã hủy',
  [TransactionStatus.REFUNDED]: 'Đã hoàn tiền',
};

/**
 * Content type labels
 */
export const ContentTypeLabels: Record<ContentType, string> = {
  [ContentType.NOVEL]: 'Tiểu thuyết',
  [ContentType.NOVEL_VOLUME]: 'Tập tiểu thuyết',
  [ContentType.NOVEL_CHAPTER]: 'Chương tiểu thuyết',
  [ContentType.MANGA]: 'Manga',
  [ContentType.MANGA_VOLUME]: 'Tập manga',
  [ContentType.MANGA_CHAPTER]: 'Chương manga',
  [ContentType.ANIME]: 'Anime',
  [ContentType.ANIME_SEASON]: 'Season anime',
  [ContentType.ANIME_EPISODE]: 'Tập anime',
};

/**
 * Payment gateway labels
 */
export const PaymentGatewayLabels: Record<PaymentGateway, string> = {
  [PaymentGateway.STRIPE]: 'Stripe',
  [PaymentGateway.MOMO]: 'MoMo',
  [PaymentGateway.VNPAY]: 'VNPay',
  [PaymentGateway.INTERNAL]: 'Ví nội bộ',
};

/**
 * Payment method labels
 */
export const PaymentMethodLabels: Record<PaymentMethod, string> = {
  [PaymentMethod.CREDIT_CARD]: 'Thẻ tín dụng',
  [PaymentMethod.BANK_TRANSFER]: 'Chuyển khoản ngân hàng',
  [PaymentMethod.E_WALLET]: 'Ví điện tử',
  [PaymentMethod.CRYPTO]: 'Tiền điện tử',
};

/**
 * Rental status labels
 */
export const RentalStatusLabels: Record<RentalStatus, string> = {
  [RentalStatus.ACTIVE]: 'Đang hoạt động',
  [RentalStatus.EXPIRED]: 'Hết hạn',
  [RentalStatus.GRACE_PERIOD]: 'Thời gian gia hạn',
  [RentalStatus.TERMINATED]: 'Đã chấm dứt',
  [RentalStatus.CANCELLED]: 'Đã hủy',
};

/**
 * Renewal attempt status labels
 */
export const RenewalAttemptStatusLabels: Record<RenewalAttemptStatus, string> = {
  [RenewalAttemptStatus.PENDING]: 'Đang chờ',
  [RenewalAttemptStatus.SUCCESS]: 'Thành công',
  [RenewalAttemptStatus.FAILED]: 'Thất bại',
  [RenewalAttemptStatus.CANCELLED]: 'Đã hủy',
  [RenewalAttemptStatus.MAX_ATTEMPTS]: 'Vượt quá lần thử',
};

/**
 * Subscription plan labels
 */
export const SubscriptionPlanLabels: Record<SubscriptionPlan, string> = {
  [SubscriptionPlan.PREMIUM]: 'Premium',
  [SubscriptionPlan.VIP]: 'VIP',
};

/**
 * Pricing rule type labels
 */
export const PricingRuleTypeLabels: Record<PricingRuleType, string> = {
  [PricingRuleType.BASE_PRICE]: 'Giá cơ bản',
  [PricingRuleType.DISCOUNT]: 'Giảm giá',
  [PricingRuleType.BUNDLE]: 'Gói combo',
  [PricingRuleType.EARLY_BIRD]: 'Ưu đãi sớm',
  [PricingRuleType.VIP_DISCOUNT]: 'Giảm giá VIP',
  [PricingRuleType.COUPON]: 'Mã giảm giá',
};

/**
 * Discount type labels
 */
export const DiscountTypeLabels: Record<DiscountType, string> = {
  [DiscountType.PERCENTAGE]: 'Phần trăm',
  [DiscountType.FIXED_AMOUNT]: 'Số tiền cố định',
};

/**
 * Fraud alert type labels
 */
export const FraudAlertTypeLabels: Record<FraudAlertType, string> = {
  [FraudAlertType.SPENDING_LIMIT]: 'Vượt giới hạn chi tiêu',
  [FraudAlertType.UNUSUAL_PATTERN]: 'Hành vi bất thường',
  [FraudAlertType.MULTIPLE_FAILURES]: 'Nhiều giao dịch thất bại',
};

/**
 * Risk level labels
 */
export const RiskLevelLabels: Record<RiskLevel, string> = {
  [RiskLevel.LOW]: 'Thấp',
  [RiskLevel.MEDIUM]: 'Trung bình',
  [RiskLevel.HIGH]: 'Cao',
  [RiskLevel.CRITICAL]: 'Nghiêm trọng',
};

/**
 * Fraud alert status labels
 */
export const FraudAlertStatusLabels: Record<FraudAlertStatus, string> = {
  [FraudAlertStatus.OPEN]: 'Đang mở',
  [FraudAlertStatus.INVESTIGATING]: 'Đang điều tra',
  [FraudAlertStatus.RESOLVED]: 'Đã giải quyết',
  [FraudAlertStatus.FALSE_POSITIVE]: 'Báo động nhầm',
};

/**
 * Payout method labels
 */
export const PayoutMethodLabels: Record<PayoutMethod, string> = {
  [PayoutMethod.BANK_TRANSFER]: 'Chuyển khoản ngân hàng',
  [PayoutMethod.E_WALLET]: 'Ví điện tử',
  [PayoutMethod.CRYPTO]: 'Tiền điện tử',
};

/**
 * Tax type labels
 */
export const TaxTypeLabels: Record<TaxType, string> = {
  [TaxType.VAT]: 'VAT',
  [TaxType.GST]: 'GST',
  [TaxType.SALES_TAX]: 'Thuế bán hàng',
};

// ===============================================================
// CONSTANTS & LIMITS
// ===============================================================

/**
 * Default spending limits and thresholds
 */
export const SPENDING_LIMITS = {
  DAILY_DEFAULT: 1000000, // 1M VND default daily limit
  DAILY_MINIMUM: 100000,  // 100K VND minimum daily limit
  DAILY_MAXIMUM: 50000000, // 50M VND maximum daily limit
  SINGLE_TRANSACTION_MAX: 10000000, // 10M VND max single transaction
} as const;

/**
 * Revenue sharing defaults
 */
export const REVENUE_SHARING = {
  DEFAULT_PLATFORM_PERCENTAGE: 25.00,  // 25% platform fee
  DEFAULT_CREATOR_PERCENTAGE: 75.00,   // 75% creator revenue
  MINIMUM_PAYOUT_AMOUNT: 500000,      // 500K VND minimum payout
  PAYOUT_PROCESSING_DAYS: 7,          // 7 days processing time
} as const;

/**
 * Grace period configurations
 */
export const GRACE_PERIODS = {
  RENTAL_GRACE_HOURS: 24,    // 24 hours grace period for rentals
  PAYMENT_RETRY_HOURS: 48,   // 48 hours for payment retries
  SUBSCRIPTION_GRACE_DAYS: 3, // 3 days grace for subscriptions
} as const;

/**
 * Auto-renewal configurations
 */
export const AUTO_RENEWAL = {
  MAX_RETRY_ATTEMPTS: 3,      // Maximum renewal attempts
  RETRY_INTERVAL_HOURS: 24,   // 24 hours between retries
  WARNING_HOURS_BEFORE: 24,   // 24 hours warning before renewal
} as const;

/**
 * Tax rates by country
 */
export const TAX_RATES = {
  VN: 0.10, // 10% VAT for Vietnam
  US: 0.00, // No tax for US (for now)
} as const;

/**
 * Coupon usage limits
 */
export const COUPON_LIMITS = {
  MAX_USES_PER_USER: 1,       // Default max uses per user
  MAX_TOTAL_USES: 1000,       // Default max total uses
  MAX_DISCOUNT_PERCENTAGE: 90, // Maximum discount percentage
} as const;

// ===============================================================
// TYPE GUARDS & VALIDATION
// ===============================================================

/**
 * Check if value is a valid currency
 */
export const isCurrency = (value: unknown): value is Currency => {
  return typeof value === 'string' && Object.values(Currency).includes(value as Currency);
};

/**
 * Check if value is a valid transaction type
 */
export const isTransactionType = (value: unknown): value is TransactionType => {
  return typeof value === 'string' && Object.values(TransactionType).includes(value as TransactionType);
};

/**
 * Check if value is a valid transaction status
 */
export const isTransactionStatus = (value: unknown): value is TransactionStatus => {
  return typeof value === 'string' && Object.values(TransactionStatus).includes(value as TransactionStatus);
};

/**
 * Check if value is a valid content type
 */
export const isContentType = (value: unknown): value is ContentType => {
  return typeof value === 'string' && Object.values(ContentType).includes(value as ContentType);
};

/**
 * Check if value is a valid payment gateway
 */
export const isPaymentGateway = (value: unknown): value is PaymentGateway => {
  return typeof value === 'string' && Object.values(PaymentGateway).includes(value as PaymentGateway);
};

/**
 * Check if value is a valid payment method
 */
export const isPaymentMethod = (value: unknown): value is PaymentMethod => {
  return typeof value === 'string' && Object.values(PaymentMethod).includes(value as PaymentMethod);
};

/**
 * Check if value is a valid rental status
 */
export const isRentalStatus = (value: unknown): value is RentalStatus => {
  return typeof value === 'string' && Object.values(RentalStatus).includes(value as RentalStatus);
};

/**
 * Check if value is a valid subscription plan
 */
export const isSubscriptionPlan = (value: unknown): value is SubscriptionPlan => {
  return typeof value === 'number' && Object.values(SubscriptionPlan).includes(value as SubscriptionPlan);
};

/**
 * Check if value is a valid risk level
 */
export const isRiskLevel = (value: unknown): value is RiskLevel => {
  return typeof value === 'string' && Object.values(RiskLevel).includes(value as RiskLevel);
};

/**
 * Check if amount is within daily spending limit
 */
export const isWithinDailyLimit = (amount: number, currentSpent: number, dailyLimit: number): boolean => {
  return (currentSpent + amount) <= dailyLimit;
};

/**
 * Check if amount is valid for single transaction
 */
export const isValidTransactionAmount = (amount: number): boolean => {
  return amount > 0 && amount <= SPENDING_LIMITS.SINGLE_TRANSACTION_MAX;
};

/**
 * Check if discount percentage is valid
 */
export const isValidDiscountPercentage = (percentage: number): boolean => {
  return percentage >= 0 && percentage <= COUPON_LIMITS.MAX_DISCOUNT_PERCENTAGE;
};

/**
 * Check if payout amount meets minimum threshold
 */
export const meetsMinimumPayout = (amount: number): boolean => {
  return amount >= REVENUE_SHARING.MINIMUM_PAYOUT_AMOUNT;
};

// ===============================================================
// UTILITY FUNCTIONS
// ===============================================================

/**
 * Calculate platform revenue from total amount
 */
export const calculatePlatformRevenue = (totalAmount: number, platformPercentage: number): number => {
  return Math.round((totalAmount * platformPercentage / 100) * 100) / 100;
};

/**
 * Calculate creator revenue from total amount
 */
export const calculateCreatorRevenue = (totalAmount: number, creatorPercentage: number): number => {
  return Math.round((totalAmount * creatorPercentage / 100) * 100) / 100;
};

/**
 * Calculate tax amount
 */
export const calculateTaxAmount = (taxableAmount: number, taxRate: number): number => {
  return Math.round((taxableAmount * taxRate) * 100) / 100;
};

/**
 * Calculate discount amount
 */
export const calculateDiscountAmount = (
  originalAmount: number, 
  discountType: DiscountType, 
  discountValue: number,
  maxDiscount?: number
): number => {
  if (discountType === DiscountType.PERCENTAGE) {
    const discount = Math.round((originalAmount * discountValue / 100) * 100) / 100;
    return maxDiscount ? Math.min(discount, maxDiscount) : discount;
  } else {
    return Math.min(discountValue, originalAmount);
  }
};

/**
 * Format currency amount for display
 */
export const formatCurrencyAmount = (amount: number, currency: Currency): string => {
  const formatter = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: currency === Currency.VND ? 0 : 2,
  });
  
  return formatter.format(amount);
};

/**
 * Get content type hierarchy level
 */
export const getContentTypeLevel = (contentType: ContentType): number => {
  switch (contentType) {
    case ContentType.NOVEL:
    case ContentType.MANGA:
    case ContentType.ANIME:
      return 1; // Series level
    case ContentType.NOVEL_VOLUME:
    case ContentType.MANGA_VOLUME:
    case ContentType.ANIME_SEASON:
      return 2; // Volume/Season level
    case ContentType.NOVEL_CHAPTER:
    case ContentType.MANGA_CHAPTER:
    case ContentType.ANIME_EPISODE:
      return 3; // Chapter/Episode level
    default:
      return 0;
  }
};

/**
 * Check if rental is in grace period
 */
export const isInGracePeriod = (expiryDate: Date, gracePeriodEnd: Date, now: Date = new Date()): boolean => {
  return now > expiryDate && now <= gracePeriodEnd;
};

/**
 * Check if rental has completely expired (past grace period)
 */
export const isCompletelyExpired = (gracePeriodEnd: Date, now: Date = new Date()): boolean => {
  return now > gracePeriodEnd;
};

// ===============================================================
// DEFAULT EXPORT
// ===============================================================

/**
 * Default export containing all enums for bulk import
 */
export default {
  // Core enums
  Currency,
  TransactionType,
  TransactionStatus,
  ContentType,
  
  // Payment enums
  PaymentGateway,
  PaymentMethod,
  
  // Rental & subscription enums
  RentalStatus,
  RenewalAttemptStatus,
  SubscriptionPlan,
  
  // Pricing & discount enums
  PricingRuleType,
  DiscountType,
  
  // Security & fraud enums
  FraudAlertType,
  RiskLevel,
  FraudAlertStatus,
  
  // Payout enums
  PayoutBatchStatus,
  PayoutStatus,
  PayoutMethod,
  
  // Tax & compliance enums
  TaxType,
  SubscriptionTransactionStatus,
  
  // Constants
  SPENDING_LIMITS,
  REVENUE_SHARING,
  GRACE_PERIODS,
  AUTO_RENEWAL,
  TAX_RATES,
  COUPON_LIMITS,
};