/**
 * Dashboard constants - Centralized configuration values
 * This file contains all magic numbers and strings used across dashboards
 * to ensure consistency and maintainability.
 */

export const DASHBOARD_CONSTANTS = {
  /**
   * Polling intervals in milliseconds
   */
  POLLING: {
    /** 30 seconds - for wallet and critical data */
    INTERVAL_MS: 30 * 1000,
    /** 60 seconds - for reports and analytics */
    REPORT_INTERVAL_MS: 60 * 1000,
    /** 5 minutes - for background sync */
    BACKGROUND_SYNC_MS: 5 * 60 * 1000,
  },

  /**
   * Date range defaults
   */
  DATE_RANGE: {
    /** 30 days - default dashboard range */
    DEFAULT_DAYS: 30,
    /** 90 days - impact report range */
    IMPACT_REPORT_DAYS: 90,
    /** 7 days - weekly view */
    WEEKLY_DAYS: 7,
  },

  /**
   * Financial thresholds
   */
  WITHDRAWAL: {
    /** Minimum withdrawal amount in IDR */
    MIN_AMOUNT: 50000,
    /** Maximum withdrawal amount in IDR */
    MAX_AMOUNT: 10000000,
  },

  /**
   * Pagination defaults
   */
  PAGINATION: {
    /** Default page size for lists */
    DEFAULT_PAGE_SIZE: 10,
    /** Maximum page size */
    MAX_PAGE_SIZE: 100,
    /** Small page size for quick views */
    QUICK_VIEW_SIZE: 4,
  },

  /**
   * Animation timings
   */
  ANIMATION: {
    /** Stagger delay for list items (seconds) */
    STAGGER_DELAY: 0.08,
    /** Default transition duration (ms) */
    TRANSITION_MS: 200,
    /** Skeleton pulse duration (seconds) */
    SKELETON_PULSE: 1.5,
  },

  /**
   * Time calculations in milliseconds
   */
  TIME: {
    /** One second in ms */
    SECOND: 1000,
    /** One minute in ms */
    MINUTE: 60 * 1000,
    /** One hour in ms */
    HOUR: 60 * 60 * 1000,
    /** One day in ms */
    DAY: 24 * 60 * 60 * 1000,
  },
} as const;

/**
 * Type-safe access to constants
 * Usage: CONSTANTS.POLLING.INTERVAL_MS
 */
export const CONSTANTS = DASHBOARD_CONSTANTS;

/**
 * Default empty states messages
 */
export const EMPTY_STATE_MESSAGES = {
  TRANSACTIONS: "Belum ada transaksi",
  ORDERS: "Belum ada pesanan",
  PRODUCTS: "Belum ada produk",
  VOUCHERS: "Belum ada voucher",
  DONATIONS: "Belum ada donasi",
  SUBSCRIPTIONS: "Belum ada langganan aktif",
} as const;

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  LOAD_FAILED: "Gagal memuat data",
  SAVE_FAILED: "Gagal menyimpan data",
  DELETE_FAILED: "Gagal menghapus data",
  NETWORK_ERROR: "Terjadi kesalahan koneksi",
  UNAUTHORIZED: "Sesi telah berakhir, silakan login kembali",
  VALIDATION_ERROR: "Data tidak valid",
} as const;
