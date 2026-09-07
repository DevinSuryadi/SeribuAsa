import { Calendar, Heart, Package, Apple, Wheat } from "lucide-react";

interface ImpactData {
  icon: React.ElementType;
  primaryValue: string;
  primaryLabel: string;
  secondaryValue?: string;
  secondaryLabel?: string;
  message: string;
  color: string;
}

interface ImpactPreviewProps {
  amount: number;
  className?: string;
}

/**
 * Enhanced Impact Preview with tiered messaging for all donation amounts
 * Shows meaningful impact even for small donations
 */
export function ImpactPreview({ amount, className = "" }: ImpactPreviewProps) {
  const calculateImpact = (donationAmount: number): ImpactData => {
    // Every Rp 500k = 1 unit (1 child + 1000 days HPK support)
    const units = Math.floor(donationAmount / 500000);
    const childrenHelped = units;
    const daysOfSupport = units * 1000;

    // Tiered impact messaging
    if (donationAmount >= 500000) {
      // Large donations: Full child adoption
      const dayText =
        daysOfSupport === 1000
          ? `1000 hari pertama kehidupan`
          : `${daysOfSupport} hari pertama kehidupan`;
      return {
        icon: Heart,
        primaryValue: `${childrenHelped}`,
        primaryLabel: "Anak Terbantu",
        secondaryValue: `${daysOfSupport}`,
        secondaryLabel: "Hari Dukungan",
        message: `Donasi Anda akan membantu ${childrenHelped} anak dan mendukung nutrisi ${dayText} (1000 HPK).`,
        color: "green",
      };
    } else if (donationAmount >= 300000) {
      // Medium donations: Focus on nutrition packages
      const packages = Math.floor(donationAmount / 50000);
      return {
        icon: Package,
        primaryValue: `${packages}`,
        primaryLabel: "Paket Makan",
        secondaryValue: "1 bulan",
        secondaryLabel: "Dukungan",
        message: `Donasi Anda menyediakan ${packages} paket makan bergizi untuk 1 anak selama 1 bulan.`,
        color: "blue",
      };
    } else if (donationAmount >= 100000) {
      // Small-medium donations: Weekly support
      const weeks = Math.floor(donationAmount / 25000);
      return {
        icon: Apple,
        primaryValue: `${weeks}`,
        primaryLabel: "Minggu Dukungan",
        secondaryValue: "1 anak",
        secondaryLabel: "Penerima",
        message: `Donasi Anda memberikan dukungan nutrisi selama ${weeks} minggu untuk 1 anak.`,
        color: "orange",
      };
    } else if (donationAmount >= 50000) {
      // Small donations: Daily nutrition
      const days = Math.floor(donationAmount / 10000);
      return {
        icon: Wheat,
        primaryValue: `${days}`,
        primaryLabel: "Hari Nutrisi",
        secondaryValue: "1 anak",
        secondaryLabel: "Penerima",
        message: `Setiap rupiah berarti! Donasi Anda memberikan ${days} hari akses nutrisi untuk 1 anak.`,
        color: "amber",
      };
    } else if (donationAmount > 0) {
      // Very small donations: Contribution message
      return {
        icon: Heart,
        primaryValue: "✓",
        primaryLabel: "Kontribusi",
        secondaryValue: undefined,
        secondaryLabel: undefined,
        message: `Terima kasih! Setiap rupiah membantu kami mendukung ketahanan pangan keluarga.`,
        color: "gray",
      };
    }

    // No amount entered yet
    return {
      icon: Heart,
      primaryValue: "-",
      primaryLabel: "Dampak",
      secondaryValue: undefined,
      secondaryLabel: undefined,
      message: "Masukkan jumlah donasi untuk melihat dampaknya.",
      color: "gray",
    };
  };

  const impact = calculateImpact(amount);
  const Icon = impact.icon;

  // Color schemes
  const colorSchemes: Record<string, { bg: string; border: string; text: string; icon: string }> = {
    green: {
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-800",
      icon: "text-green-600",
    },
    blue: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-800",
      icon: "text-blue-600",
    },
    orange: {
      bg: "bg-orange-50",
      border: "border-orange-200",
      text: "text-orange-800",
      icon: "text-orange-600",
    },
    amber: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      text: "text-amber-800",
      icon: "text-amber-600",
    },
    gray: {
      bg: "bg-gray-50",
      border: "border-gray-200",
      text: "text-gray-800",
      icon: "text-gray-600",
    },
  };

  const colors = colorSchemes[impact.color];

  return (
    <div className={`rounded-lg ${colors.bg} border ${colors.border} p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`h-4 w-4 ${colors.icon}`} />
        <h4 className={`text-sm font-semibold ${colors.text}`}>Dampak Donasi Anda</h4>
      </div>

      <div className={`grid gap-4 mb-3 ${impact.secondaryValue ? "grid-cols-2" : "grid-cols-1"}`}>
        <div className="text-center">
          <Icon className={`mx-auto h-5 w-5 ${colors.icon} mb-1`} />
          <p className={`text-lg font-bold ${colors.text}`}>{impact.primaryValue}</p>
          <p className={`text-xs ${colors.icon}`}>{impact.primaryLabel}</p>
        </div>

        {impact.secondaryValue && (
          <div className="text-center">
            <Calendar className={`mx-auto h-5 w-5 ${colors.icon} mb-1`} />
            <p className={`text-lg font-bold ${colors.text}`}>{impact.secondaryValue}</p>
            <p className={`text-xs ${colors.icon}`}>{impact.secondaryLabel}</p>
          </div>
        )}
      </div>

      <p className={`text-xs text-center font-medium leading-relaxed ${colors.text}`}>
        {impact.message}
      </p>
    </div>
  );
}
