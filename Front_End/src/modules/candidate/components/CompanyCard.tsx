import React from 'react';
import { Star } from 'lucide-react';
import { Company } from '@/types/types';

interface CompanyCardProps {
  company: Company;
  isFollowed: boolean;
  onToggleFollow: (id: string | number) => Promise<void> | void;
}

const CompanyCard: React.FC<CompanyCardProps> = ({ company, isFollowed, onToggleFollow }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-center hover:shadow-lg transition-all duration-300 group">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform duration-300">
            {company.logo && (company.logo.startsWith('http') || company.logo.startsWith('/')) ? (
                <img 
                    src={company.logo} 
                    alt={company.name} 
                    className="w-full h-full object-contain p-2"
                />
            ) : (
                company.logo
            )}
        </div>
        <h4 className="text-lg font-bold text-gray-900 truncate mb-1">{company.name}</h4>
        <p className="text-xs text-gray-500 mb-4 uppercase tracking-wide">{company.industry}</p>
        <button 
            onClick={() => onToggleFollow(company.id)}
            className={`w-full py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center ${isFollowed ? 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg'}`}
        >
            <Star className={`w-4 h-4 mr-1.5 ${isFollowed ? 'fill-current' : ''}`}/>
            {isFollowed ? '已关注' : '关注'}
        </button>
    </div>
);

export default CompanyCard;