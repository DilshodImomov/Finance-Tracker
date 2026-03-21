export type MonthlyRow = {
  month: string; // "2026-01"
  total: number;
};

export type CategoryRow = {
  category: string;
  total: number;
};

export type RecapProps = {
  /** Display label e.g. "January 2026" */
  monthLabel: string;
  /** Total spent this month in AED */
  thisMonth: number;
  /** Total spent last month in AED */
  lastMonth: number;
  /** Year-to-date total */
  ytd: number;
  /** Top categories (sorted desc by total) */
  categories: CategoryRow[];
  /** Monthly trend for sparkline (last 6 months) */
  monthly: MonthlyRow[];
  /** Top merchants */
  topMerchants: { merchant: string; total: number }[];
};
