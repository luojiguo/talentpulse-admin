import React from 'react';
import { 
  Users, Briefcase, FileText, CheckCircle, TrendingUp, TrendingDown,
  Eye, Building2, Zap, Flame, UserCheck, Shield
} from 'lucide-react';
import { StatMetric } from '@/types/types';

const StatCard: React.FC<{ metric: StatMetric; className?: string }> = ({ metric, className }) => {
  const isUp = metric.trend === 'up';
  const IconMap: Record<string, React.ReactNode> = {
    'users': <Users className="w-5 h-5 text-blue-600" />,
    'user': <Users className="w-5 h-5 text-indigo-600" />,
    'briefcase': <Briefcase className="w-5 h-5 text-violet-600" />,
    'file-text': <FileText className="w-5 h-5 text-amber-600" />,
    'check-circle': <CheckCircle className="w-5 h-5 text-emerald-600" />,
    'eye': <Eye className="w-5 h-5 text-cyan-600" />,
    'building': <Building2 className="w-5 h-5 text-rose-600" />,
    'zap': <Zap className="w-5 h-5 text-orange-600" />,
    'flame': <Flame className="w-5 h-5 text-red-600" />,
    'user-check': <UserCheck className="w-5 h-5 text-green-600" />,
    'shield': <Shield className="w-5 h-5 text-teal-600" />,
  };
  
  const ColorMap: Record<string, string> = {
    'eye': 'bg-cyan-100 dark:bg-cyan-900/50',
    'building': 'bg-rose-100 dark:bg-rose-900/50',
    'zap': 'bg-orange-100 dark:bg-orange-900/50',
    'file-text': 'bg-amber-100 dark:bg-amber-900/50',
    'flame': 'bg-red-100 dark:bg-red-900/50',
    'user-check': 'bg-green-100 dark:bg-green-900/50',
    'user': 'bg-indigo-100 dark:bg-indigo-900/50',
    'shield': 'bg-teal-100 dark:bg-teal-900/50',
  };

  return (
    <div className={`bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-all hover:shadow-md hover:-translate-y-1 ${className || ''}`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-lg ${ColorMap[metric.icon] || 'bg-gray-100 dark:bg-slate-700'}`}>
          {IconMap[metric.icon]}
        </div>
        <div className={`flex items-center gap-1 text-sm font-semibold ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
          {isUp ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          <span>{Math.abs(metric.change)}%</span>
        </div>
      </div>
      <div>
        <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1 truncate">{metric.label}</h3>
        <p className="text-2xl font-bold text-slate-900 dark:text-white truncate">{metric.value}</p>
      </div>
    </div>
  );
};

export default StatCard;
