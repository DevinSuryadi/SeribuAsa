import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { StatusConfig } from "@/lib/status-config";

interface StatusBadgeProps {
  config: StatusConfig;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
}

export function StatusBadge({
  config,
  size = "sm",
  showIcon = true,
  className,
}: StatusBadgeProps) {
  const Icon = config.icon;

  const sizeClasses = {
    sm: "text-[10px] px-1.5 py-0.5",
    md: "text-xs px-2.5 py-0.5",
    lg: "text-sm px-3 py-1",
  };

  const iconSizeClasses = {
    sm: "h-2.5 w-2.5 mr-1",
    md: "h-3 w-3 mr-1.5",
    lg: "h-4 w-4 mr-2",
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "border font-medium",
        config.className,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <Icon className={iconSizeClasses[size]} />}
      {config.label}
    </Badge>
  );
}
