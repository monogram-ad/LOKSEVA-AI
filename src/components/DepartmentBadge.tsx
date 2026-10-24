import React from 'react';
import {
  Droplets,
  Zap,
  Hammer,
  Trash2,
  Shield,
  HeartPulse,
  Layers,
} from 'lucide-react';
import { DepartmentName } from '../types/complaint';

interface DepartmentBadgeProps {
  department: DepartmentName;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const DepartmentBadge: React.FC<DepartmentBadgeProps> = ({
  department,
  size = 'md',
  showIcon = true,
}) => {
  const configs: Record<
    DepartmentName,
    { label: string; bg: string; text: string; border: string; dot: string; icon: React.ComponentType<{ className?: string }> }
  > = {
    'Water Board': {
      label: 'Water Board',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      dot: 'bg-blue-500',
      icon: Droplets,
    },
    'Electricity Department': {
      label: 'Electricity Department',
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
      dot: 'bg-amber-500',
      icon: Zap,
    },
    'Roads & PWD': {
      label: 'Roads & PWD',
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-300',
      dot: 'bg-slate-500',
      icon: Hammer,
    },
    'Sanitation': {
      label: 'Sanitation',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500',
      icon: Trash2,
    },
    'Police': {
      label: 'Police Department',
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
      border: 'border-indigo-200',
      dot: 'bg-indigo-600',
      icon: Shield,
    },
    'Health': {
      label: 'Health & Family Welfare',
      bg: 'bg-pink-50',
      text: 'text-pink-700',
      border: 'border-pink-200',
      dot: 'bg-pink-500',
      icon: HeartPulse,
    },
    'General': {
      label: 'General Administration',
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-200',
      dot: 'bg-purple-500',
      icon: Layers,
    },
  };

  const config = configs[department] || configs['General'];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs font-semibold px-2.5 py-1 gap-1.5',
    lg: 'text-sm font-semibold px-3 py-1.5 gap-2',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses} shadow-xs font-medium`}
    >
      {showIcon && <Icon className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />}
      <span>{department}</span>
    </span>
  );
};
