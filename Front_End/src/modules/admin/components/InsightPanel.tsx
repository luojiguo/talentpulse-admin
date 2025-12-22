import React from 'react';
import { Sparkles } from 'lucide-react';
import { InsightStatus } from '@/types/types';

interface InsightPanelProps {
  status: InsightStatus;
  text: string | null;
  onClose: () => void;
  t: any;
}

const InsightPanel: React.FC<InsightPanelProps> = ({ status, text, onClose, t }) => {
  if (status === InsightStatus.IDLE) return null;

  return (
    <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className={`p-6 rounded-xl border ${status === InsightStatus.ERROR ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-500/30' : 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-500/30'}`}>
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className={`w-5 h-5 ${status === InsightStatus.ERROR ? 'text-rose-600' : 'text-indigo-600'}`} />
            <h3 className={`font-semibold ${status === InsightStatus.ERROR ? 'text-rose-800 dark:text-rose-200' : 'text-indigo-900 dark:text-indigo-200'}`}>
              {status === InsightStatus.LOADING ? t.dashboard.ai_analyzing : status === InsightStatus.ERROR ? t.dashboard.error : t.dashboard.ai_title}
            </h3>
          </div>
          {status !== InsightStatus.LOADING && (
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
              <span className="text-lg">×</span>
            </button>
          )}
        </div>
        
        <div className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-line">
           {status === InsightStatus.LOADING && t.dashboard.ai_loading}
           {status === InsightStatus.ERROR && t.dashboard.ai_error}
           {status === InsightStatus.SUCCESS && text}
        </div>
      </div>
    </div>
  );
};

export default InsightPanel;