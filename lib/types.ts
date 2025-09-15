export type MonthId = `${number}-${string}`; // "2024-01"

export type RawMonthlyRow = {
  customer: string;        // Odběratel
  revenue: number;         // Obrat výdej zboží bez DPH
  profit: number;          // Zisk
  marginPct: number;       // 0–100
  period: MonthId;         // YYYY-MM
};

export type CustomerMonthly = {
  period: MonthId;
  revenue: number;
  profit: number;
  marginPct: number | null;
};

export type CustomerSummary = {
  slug: string;
  name: string;
  firstMonth: MonthId | null;
  lastMonth: MonthId | null;
  months: CustomerMonthly[];
  totalRevenue: number;
  totalProfit: number;
  avgMarginPct: number | null;
  // Trendy:
  revenueDeltaAbs: number;       // lastNonZero - firstNonZero
  revenueDeltaPct: number | null;// % změny mezi prvním a posledním (pokud >0)
  profitDeltaAbs: number;
  profitDeltaPct: number | null;
  // Jednoduchý rating
  revenueTrend: "UP" | "DOWN" | "FLAT";
  profitTrend: "UP" | "DOWN" | "FLAT";
};

export type AggregatedData = {
  monthsAvailable: MonthId[]; // seřazené
  customers: CustomerSummary[];
  generatedAt: string;        // ISO
};
