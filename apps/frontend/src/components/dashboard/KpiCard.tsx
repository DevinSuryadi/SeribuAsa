import type { ReactNode, ComponentType } from "react";
import type { LucideProps } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  icon: ComponentType<LucideProps>;
  label: string;
  value: string | number;
  subtitle?: string;
  variant?:
    | "default"
    | "indigo"
    | "green"
    | "amber"
    | "purple"
    | "red"
    | "blue"
    | "rose"
    | "orange";
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
  className?: string;
}

const variantStyles = {
  default: "text-foreground bg-secondary/30 border-border",
  indigo: "text-indigo-600 bg-indigo-50 border-indigo-200",
  green: "text-green-600 bg-green-50 border-green-200",
  amber: "text-amber-600 bg-amber-50 border-amber-200",
  purple: "text-purple-600 bg-purple-50 border-purple-200",
  red: "text-red-600 bg-red-50 border-red-200",
  blue: "text-blue-600 bg-blue-50 border-blue-200",
  rose: "text-rose-600 bg-rose-50 border-rose-200",
  orange: "text-orange-600 bg-orange-50 border-orange-200",
};

export function KpiCard({
  icon: Icon,
  label,
  value,
  subtitle,
  variant = "default",
  trend,
  onClick,
  className,
}: KpiCardProps) {
  const styles = variantStyles[variant];

  const content = (
    <div
      className={cn(
        "rounded-2xl border p-5 transition-all text-left",
        onClick && "hover:-translate-y-0.5 hover:shadow-sm cursor-pointer",
        styles,
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl border bg-white shadow-sm",
            styles.split(" ")[2] // keep only border color
          )}
        >
          <Icon className={cn("h-4 w-4", styles.split(" ")[0])} />
        </div>
        {trend && (
          <div
            className={cn(
              "flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full",
              trend.isPositive ? "text-green-700 bg-green-100" : "text-red-700 bg-red-100"
            )}
          >
            {trend.isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {trend.value}%
          </div>
        )}
      </div>

      <div className={cn("text-xl font-extrabold tracking-tight", styles.split(" ")[0])}>
        {value}
      </div>
      <p className="text-xs text-muted-foreground font-medium mt-0.5">{label}</p>
      {subtitle && <p className="text-[10px] text-muted-foreground/70 mt-0.5">{subtitle}</p>}
    </div>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className="w-full text-left">
        {content}
      </button>
    );
  }

  return content;
}

interface KpiCardGridProps {
  children: ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function KpiCardGrid({ children, columns = 4, className }: KpiCardGridProps) {
  const gridClasses = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2 lg:grid-cols-4",
  };

  return <div className={cn("grid gap-4", gridClasses[columns], className)}>{children}</div>;
}
