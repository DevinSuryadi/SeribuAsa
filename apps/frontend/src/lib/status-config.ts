import { CheckCircle, Clock, XCircle, AlertCircle, Loader2 } from "lucide-react";
import type { ElementType } from "react";

// lucide-react v3+ does not export LucideIcon as a named export.
// We define a local alias using React.ElementType for full compatibility.
type LucideIcon = ElementType;
import type { OrderStatus, ProductApprovalStatus, SettlementStatus } from "@/types/vendor";
import type { DonationStatus, SubscriptionStatus } from "@/types/donation";

export interface StatusConfig {
  label: string;
  className: string;
  icon: LucideIcon;
  description?: string;
}

// Vendor Order Status
export const orderStatusConfig: Record<OrderStatus, StatusConfig> = {
  pending: {
    label: "Pending",
    className: "bg-amber-100 text-amber-700 border-amber-200",
    icon: Clock,
    description: "Menunggu konfirmasi",
  },
  processing: {
    label: "Diproses",
    className: "bg-blue-100 text-blue-700 border-blue-200",
    icon: Loader2,
    description: "Sedang diproses",
  },
  completed: {
    label: "Selesai",
    className: "bg-green-100 text-green-700 border-green-200",
    icon: CheckCircle,
    description: "Pesanan selesai",
  },
  cancelled: {
    label: "Dibatalkan",
    className: "bg-red-100 text-red-700 border-red-200",
    icon: XCircle,
    description: "Pesanan dibatalkan",
  },
};

// Settlement Status
export const settlementStatusConfig: Record<SettlementStatus, StatusConfig> = {
  pending: {
    label: "Menunggu",
    className: "bg-amber-100 text-amber-700 border-amber-200",
    icon: Clock,
  },
  calculating: {
    label: "Menghitung",
    className: "bg-secondary text-muted-foreground border-border",
    icon: Loader2,
  },
  ready: {
    label: "Siap Cair",
    className: "bg-green-100 text-green-700 border-green-200",
    icon: CheckCircle,
  },
  processing: {
    label: "Diproses",
    className: "bg-blue-100 text-blue-700 border-blue-200",
    icon: Loader2,
  },
  completed: {
    label: "Selesai",
    className: "bg-green-100 text-green-700 border-green-200",
    icon: CheckCircle,
  },
  failed: {
    label: "Gagal",
    className: "bg-red-100 text-red-700 border-red-200",
    icon: AlertCircle,
  },
};

// Product Approval Status
export const productApprovalConfig: Record<ProductApprovalStatus, StatusConfig> = {
  pending: {
    label: "Menunggu",
    className: "bg-amber-100 text-amber-700 border-amber-200",
    icon: Clock,
  },
  approved: {
    label: "Disetujui",
    className: "bg-green-100 text-green-700 border-green-200",
    icon: CheckCircle,
  },
  rejected: {
    label: "Ditolak",
    className: "bg-red-100 text-red-700 border-red-200",
    icon: XCircle,
  },
};

// Donation Status
export const donationStatusConfig: Record<DonationStatus, StatusConfig> = {
  success: {
    label: "Sukses",
    className: "bg-green-100 text-green-700 border-green-200",
    icon: CheckCircle,
  },
  pending: {
    label: "Pending",
    className: "bg-amber-100 text-amber-700 border-amber-200",
    icon: Clock,
  },
  failed: {
    label: "Gagal",
    className: "bg-red-100 text-red-700 border-red-200",
    icon: XCircle,
  },
  refunded: {
    label: "Refund",
    className: "bg-gray-100 text-gray-700 border-gray-200",
    icon: XCircle,
  },
};

// Subscription Status
export const subscriptionStatusConfig: Record<SubscriptionStatus, StatusConfig> = {
  active: {
    label: "Aktif",
    className: "bg-green-100 text-green-700 border-green-200",
    icon: CheckCircle,
  },
  paused: {
    label: "Dijeda",
    className: "bg-amber-100 text-amber-700 border-amber-200",
    icon: Clock,
  },
  cancelled: {
    label: "Dibatalkan",
    className: "bg-red-100 text-red-700 border-red-200",
    icon: XCircle,
  },
};
