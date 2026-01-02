import React from 'react';
import { Company } from '@/types/types';
import { useNavigate } from 'react-router-dom';

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
        className="bg-white p-2 rounded-sm shadow-sm border border-slate-200 text-center hover:shadow-md transition-all duration-300 group cursor-pointer max-w-[120px] w-full"
        onClick={handleCardClick}
    >
        <div className="w-8 h-8 mx-auto mb-1 bg-gray-50 rounded flex items-center justify-center text-lg shadow-inner group-hover:scale-105 transition-transform duration-300">
            {company.logo && (company.logo.startsWith('http') || company.logo.startsWith('/')) ? (
                <img 
                    src={company.logo} 
                    alt={company.name} 
                    className="w-full h-full object-contain p-1"
                />
            ) : (
                company.logo
            )}
        </div>
        <div className="text-xs font-normal text-gray-900 truncate">{company.name}</div>
        {/* 隐藏公司类型 */}
    </div>
  );
}

export default CompanyCard;