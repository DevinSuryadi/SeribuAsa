export interface AdminStats {
  users: {
    total: number;
    donors: number;
    beneficiaries: number;
    vendors: number;
    pending_beneficiaries: number;
    pending_vendors: number;
  };
  products: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  vouchers: {
    active_count: number;
    total_balance: number;
  };
  orders: {
    total: number;
    completed: number;
  };
  redemptions: {
    total_count: number;
    total_amount: number;
  };
  donations: {
    total_amount: number;
  };
}

export interface PriorityTask {
  title: string;
  desc: string;
  summary: string;
  count: number;
  href: string;
  accent: string;
  priorityLabel: string;
  priorityClass: string;
}

export interface ExportOption {
  label: string;
  desc: string;
  type: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface QuickLink {
  label: string;
  desc: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  iconWrap: string;
}
