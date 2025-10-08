import { Badge } from "@/components/ui/badge";
import { Clock, AlertCircle, CheckCircle, XCircle } from "lucide-react";

type Status = "pending" | "under_review" | "approved" | "rejected";

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const statusConfig = {
    pending: {
      label: "Submitted",
      icon: Clock,
      variant: "default" as const,
      className: "bg-pending text-white"
    },
    under_review: {
      label: "Under Review",
      icon: AlertCircle,
      variant: "default" as const,
      className: "bg-under-review text-white"
    },
    approved: {
      label: "Approved",
      icon: CheckCircle,
      variant: "default" as const,
      className: "bg-approved text-white"
    },
    rejected: {
      label: "Rejected",
      icon: XCircle,
      variant: "default" as const,
      className: "bg-rejected text-white"
    }
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={`${config.className} ${className}`}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
};
