import React from 'react';
import { AlertCircle, AlertTriangle, Info, ShieldAlert } from 'lucide-react';
import { UrgencyLevel } from '../types/complaint';

interface UrgencyBadgeProps {
  urgency: UrgencyLevel;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const UrgencyBadge: React.FC<UrgencyBadgeProps> = ({
  urgency,
  size = 'md',
  showIcon = true,
}) => {
  const configs: Record<
    UrgencyLevel,
    { label: string; bg: string; text: string; border: string; icon: React.ComponentType<{ className?: string }> }
  > = {
    critical: {
      label: 'Critical Urgency',
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
      icon: ShieldAlert,
    },
    high: {
      label: 'High Urgency',
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      border: 'border-orange-200',
      icon: AlertTriangle,
    },
    medium: {
      label: 'Medium Urgency',
      bg: 'bg-yellow-50',
      text: 'text-yellow-800',
      border: 'border-yellow-200',
      icon: AlertCircle,
    },
    low: {
      label: 'Low Urgency',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      icon: Info,
    },
  };

  const config = configs[urgency] || configs.low;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs font-semibold px-2.5 py-1 gap-1.5',
    lg: 'text-sm font-semibold px-3 py-1.5 gap-2',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${config.bg} ${config.text} ${config.border} ${sizeClasses} tracking-tight transition-all`}
    >
      {showIcon && <Icon className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />}
      <span className="uppercase tracking-wider text-[11px] font-bold">
        {urgency}
      </span>
    </span>
  );
};
