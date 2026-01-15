import React from 'react';
import { Company } from '@/types/types';
import { useNavigate } from 'react-router-dom';
import { processAvatarUrl } from '@/components/AvatarUploadComponent';

interface CompanyCardProps {
  company: Company;
}

const CompanyCard: React.FC<CompanyCardProps> = ({ company }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/company/${company.id}`);
  };

  return (
    <div
      className="bg-white dark:bg-slate-800 p-5 rounded-[1.25rem] shadow-sm border border-slate-100 dark:border-slate-700 text-center hover:shadow-xl hover:shadow-brand-500/10 dark:hover:shadow-none hover:border-brand-200 dark:hover:border-brand-500/50 transition-all duration-500 group cursor-pointer max-w-[150px] w-full flex flex-col items-center justify-center active:scale-95"
      onClick={handleCardClick}
    >
      <div className="w-14 h-14 mb-3 bg-slate-50 dark:bg-slate-700 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:bg-white dark:group-hover:bg-slate-600 transition-all duration-500 overflow-hidden border border-slate-100 dark:border-slate-600 p-2.5">
        {company.logo && company.logo !== 'C' && company.logo.length > 2 ? (
          <img
            src={processAvatarUrl(company.logo)}
            alt={company.name}
            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <span className="text-brand-400 dark:text-brand-500 text-xl group-hover:rotate-12 transition-transform duration-500">{company.logo === 'C' || !company.logo ? '🏢' : company.logo}</span>
        )}
      </div>
      <div className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate w-full group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
        {company.name}
      </div>
    </div>
  );
}

export default CompanyCard;