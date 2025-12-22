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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div 
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden transform transition-all duration-300 animate-in fade-in zoom-in-95" 
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-5 border-b flex justify-between items-center bg-indigo-50/50">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center">
                        <MapPin className="w-5 h-5 mr-2 text-indigo-600"/>
                        选择城市 <span className="ml-2 text-sm font-normal text-gray-500">(当前: {currentCity})</span>
                    </h3>
                    <button onClick={onClose} className="p-2 rounded-full text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto max-h-[calc(80vh-70px)] custom-scrollbar">
                    <div className="mb-4">
                        <input
                            type="text"
                            placeholder="搜索城市（支持拼音）"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-indigo-500">
                             <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
                             <span>正在加载城市数据...</span>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {filteredCityData.map(group => (
                                <div key={group.province}>
                                    <h4 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider flex items-center">
                                        <div className="w-1 h-4 bg-indigo-500 rounded-full mr-2"></div>
                                        {group.province}
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {group.cities.map((city: string) => (
                                            <FilterPill key={city} label={city} isActive={currentCity === city} onClick={() => { onSelectCity(city); onClose(); }} />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CityPickerModal;