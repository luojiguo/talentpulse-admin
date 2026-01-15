import React, { useState, useMemo, useEffect } from 'react';
import { MapPin, X } from 'lucide-react';
import data from 'china-area-data';
import { pinyin } from 'pinyin-pro';
import FilterPill from './FilterPill';

const fetchChinaCities = () => {
    return new Promise<any[]>(resolve => {
        const provinces = Object.keys(data['86']).map(code => ({
            province: data['86'][code],
            cities: Object.keys(data[code] || {}).map(cityCode => data[code][cityCode])
        }));
        resolve(provinces);
    });
};

const CityPickerModal = ({ isOpen, onClose, currentCity, onSelectCity }: any) => {
    const [cityData, setCityData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredCityData = useMemo(() => {
        if (!searchQuery.trim()) return cityData;
        const query = searchQuery.toLowerCase();
        return cityData.map(group => ({
            ...group,
            cities: group.cities.filter((city: string) => {
                const cityLower = city.toLowerCase();
                const cityPinyin = pinyin(city, { toneType: 'none' }).toLowerCase();
                return cityLower.includes(query) || cityPinyin.includes(query);
            })
        })).filter(group => group.cities.length > 0);
    }, [cityData, searchQuery]);

    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
            fetchChinaCities().then(data => {
                setCityData(data);
                setIsLoading(false);
            }).catch(error => {
                console.error("Failed to fetch cities:", error);
                setIsLoading(false);
            });
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 flex justify-center items-center p-4 animate-in fade-in duration-300" onClick={onClose}>
            <div
                className="bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden transform transition-all duration-500 animate-in zoom-in-95 slide-in-from-bottom-10 border border-white/20 dark:border-slate-800"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-8 py-6 border-b border-brand-50 dark:border-slate-800 flex justify-between items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
                    <div>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                            <div className="w-10 h-10 bg-brand-50 dark:bg-brand-900/30 rounded-2xl flex items-center justify-center">
                                <MapPin className="w-6 h-6 text-brand-500" />
                            </div>
                            选择城市
                        </h3>
                        <p className="mt-1 text-sm text-slate-400 dark:text-slate-500 font-medium">
                            当前已选: <span className="text-brand-500 font-bold">{currentCity}</span>
                        </p>
                    </div>
                    <button onClick={onClose} className="p-3 rounded-2xl text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-all active:scale-90 group">
                        <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                </div>

                <div className="p-8 overflow-y-auto max-h-[calc(85vh-110px)] custom-scrollbar">
                    <div className="mb-8 relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                        </div>
                        <input
                            type="text"
                            placeholder="搜索城市（支持名称或拼音）..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-brand-400/10 focus:border-brand-400 dark:text-white transition-all outline-none text-base font-medium placeholder:text-slate-400"
                        />
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-brand-500">
                            <div className="w-12 h-12 border-[5px] border-brand-100 border-t-brand-500 rounded-full animate-spin mb-6"></div>
                            <span className="font-bold text-lg">正在加载城市...</span>
                        </div>
                    ) : (
                        <div className="space-y-10">
                            {/* Hot Cities / Quick Access */}
                            {!searchQuery && (
                                <div>
                                    <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 mb-5 uppercase tracking-[0.2em] flex items-center">
                                        <div className="w-2 h-2 bg-brand-400 rounded-full mr-3"></div>
                                        快速选择
                                    </h4>
                                    <div className="flex flex-wrap gap-3">
                                        <FilterPill
                                            label="全部城市"
                                            isActive={currentCity === '全部'}
                                            onClick={() => { onSelectCity('全部'); onClose(); }}
                                        />
                                        {['北京', '上海', '广州', '深圳', '杭州', '成都'].map(city => (
                                            <FilterPill
                                                key={city}
                                                label={city}
                                                isActive={currentCity === city}
                                                onClick={() => { onSelectCity(city); onClose(); }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {filteredCityData.map(group => (
                                <div key={group.province} className="animate-in fade-in duration-500">
                                    <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 mb-5 uppercase tracking-[0.2em] flex items-center">
                                        <div className="w-2 h-2 bg-slate-200 dark:bg-slate-700 rounded-full mr-3"></div>
                                        {group.province}
                                    </h4>
                                    <div className="flex flex-wrap gap-3">
                                        {group.cities.map((city: string) => (
                                            <FilterPill
                                                key={city}
                                                label={city}
                                                isActive={currentCity === city}
                                                onClick={() => { onSelectCity(city); onClose(); }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}

                            {filteredCityData.length === 0 && (
                                <div className="text-center py-20">
                                    <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <X className="w-10 h-10 text-slate-300" />
                                    </div>
                                    <p className="text-slate-500 font-bold text-lg">未找到相关城市</p>
                                    <p className="text-slate-400 text-sm mt-1">请尝试其他关键词搜索</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CityPickerModal;