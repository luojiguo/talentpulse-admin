import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import UserAvatar from '@/components/UserAvatar';

interface CandidateLayoutProps {
  children: React.ReactNode;
  currentUser: any;
  onLogout: () => void;
  onSwitchRole?: (newRole: string) => void;
}

const CandidateLayout: React.FC<CandidateLayoutProps> = ({ children, currentUser, onLogout, onSwitchRole }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // 监听头像更新事件
  useEffect(() => {
    const handleAvatarUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ avatar: string }>;
      if (customEvent.detail && customEvent.detail.avatar) {
        // 更新 currentUser 的头像
        if (currentUser && typeof currentUser === 'object') {
          (currentUser as any).avatar = customEvent.detail.avatar;
        }
      }
    };

    window.addEventListener('userAvatarUpdated', handleAvatarUpdate);
    return () => {
      window.removeEventListener('userAvatarUpdated', handleAvatarUpdate);
    };
  }, [currentUser]);

  // 判断导航项是否激活
  const isActive = (path: string) => {
    const currentPath = location.pathname;
    
    // 首页特殊处理：只匹配根路径或 /candidate，不匹配 /job/:id 等子路径
    if (path === '/') {
      return currentPath === '/' || currentPath === '/candidate' || currentPath === '/candidate/';
    }
    
    // 其他路径：精确匹配或作为前缀匹配（如 /messages 匹配 /messages 和 /messages/:id）
    return currentPath === path || currentPath.startsWith(path + '/');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-indigo-900 shadow-lg sticky top-0 z-40 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-white tracking-wider flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
              </div>
              JobFinder
            </h1>
            
            {/* Mobile Menu Button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              className="ml-4 md:hidden p-2 rounded-lg bg-indigo-800 text-white hover:bg-indigo-700 transition-colors"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-1 flex-1 justify-center">
            <button 
              onClick={() => navigate('/')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/') 
                  ? 'bg-white/10 text-white shadow-inner' 
                  : 'text-indigo-100 hover:bg-white/5'
              }`}
            >
              首页
            </button>
            <button 
              onClick={() => navigate('/job')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/job') 
                  ? 'bg-white/10 text-white shadow-inner' 
                  : 'text-indigo-100 hover:bg-white/5'
              }`}
            >
              岗位列表
            </button>
            <button 
              onClick={() => navigate('/saved')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/saved') 
                  ? 'bg-white/10 text-white shadow-inner' 
                  : 'text-indigo-100 hover:bg-white/5'
              }`}
            >
              我的收藏
            </button>
            <button 
              onClick={() => navigate('/interviews')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/interviews') 
                  ? 'bg-white/10 text-white shadow-inner' 
                  : 'text-indigo-100 hover:bg-white/5'
              }`}
            >
              我的面试
            </button>
            <button 
              onClick={() => navigate('/messages')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/messages') 
                  ? 'bg-white/10 text-white shadow-inner' 
                  : 'text-indigo-100 hover:bg-white/5'
              }`}
            >
              消息
            </button>
            <button 
              onClick={() => navigate('/mock-interview')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/mock-interview') 
                  ? 'bg-white/10 text-white shadow-inner' 
                  : 'text-indigo-100 hover:bg-white/5'
              }`}
            >
              模拟面试
            </button>
            <button 
              onClick={() => navigate('/ai-chat')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/ai-chat') 
                  ? 'bg-white/10 text-white shadow-inner' 
                  : 'text-indigo-100 hover:bg-white/5'
              }`}
            >
              AI助手
            </button>
          </nav>
          
          {/* User Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)} 
              className="flex items-center space-x-3 text-indigo-100 hover:text-white transition-colors focus:outline-none py-1"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold leading-tight">{currentUser.name}</p>
                <p className="text-xs text-indigo-300">求职者</p>
              </div>
              <UserAvatar 
                src={currentUser.avatar} 
                name={currentUser.name} 
                size={36} 
                className="bg-indigo-200 text-indigo-800 border-2 border-indigo-400" 
                alt="头像"
              />
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            {/* Dropdown Menu */}
            <div className={`absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-1 z-50 ring-1 ring-black ring-opacity-5 transition-all duration-200 origin-top-right ${
              isDropdownOpen 
                ? 'opacity-100 scale-100 translate-y-0' 
                : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
            }`}>
              <button 
                onClick={() => { navigate('/profile'); setIsDropdownOpen(false); }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
              >
                个人中心
              </button>
              <button 
                onClick={() => { navigate('/resume-editor'); setIsDropdownOpen(false); }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
              >
                在线简历
              </button>
              <button 
                onClick={() => { navigate('/applications'); setIsDropdownOpen(false); }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
              >
                我的申请
              </button>
              <button 
                onClick={() => { navigate('/enterprise-verification'); setIsDropdownOpen(false); }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
              >
                企业认证
              </button>
              <button 
                onClick={() => { onSwitchRole?.('recruiter'); setIsDropdownOpen(false); }} 
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
              >
                切换为招聘者
              </button>
              <div className="border-t border-gray-100 my-1"></div>
              <button 
                onClick={onLogout} 
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-indigo-800 border-t border-indigo-700">
            <div className="px-4 py-3 space-y-1">
              <button 
                onClick={() => { navigate('/'); setMobileMenuOpen(false); }}
                className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive('/') 
                    ? 'text-white bg-indigo-700' 
                    : 'text-indigo-100 hover:bg-indigo-700 hover:text-white'
                }`}
              >
                首页
              </button>
              <button 
                onClick={() => { navigate('/job'); setMobileMenuOpen(false); }}
                className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive('/job') 
                    ? 'text-white bg-indigo-700' 
                    : 'text-indigo-100 hover:bg-indigo-700 hover:text-white'
                }`}
              >
                岗位列表
              </button>
              <button 
                onClick={() => { navigate('/saved'); setMobileMenuOpen(false); }}
                className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive('/saved') 
                    ? 'text-white bg-indigo-700' 
                    : 'text-indigo-100 hover:bg-indigo-700 hover:text-white'
                }`}
              >
                我的收藏
              </button>
              <button 
                onClick={() => { navigate('/interviews'); setMobileMenuOpen(false); }}
                className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive('/interviews') 
                    ? 'text-white bg-indigo-700' 
                    : 'text-indigo-100 hover:bg-indigo-700 hover:text-white'
                }`}
              >
                我的面试
              </button>
              <button 
                onClick={() => { navigate('/messages'); setMobileMenuOpen(false); }}
                className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive('/messages') 
                    ? 'text-white bg-indigo-700' 
                    : 'text-indigo-100 hover:bg-indigo-700 hover:text-white'
                }`}
              >
                消息
              </button>
              <button 
                onClick={() => { navigate('/mock-interview'); setMobileMenuOpen(false); }}
                className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive('/mock-interview') 
                    ? 'text-white bg-indigo-700' 
                    : 'text-indigo-100 hover:bg-indigo-700 hover:text-white'
                }`}
              >
                模拟面试
              </button>
              <button 
                onClick={() => { navigate('/ai-chat'); setMobileMenuOpen(false); }}
                className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive('/ai-chat') 
                    ? 'text-white bg-indigo-700' 
                    : 'text-indigo-100 hover:bg-indigo-700 hover:text-white'
                }`}
              >
                AI助手
              </button>
            </div>
          </div>
        )}
      </header>
      <main className="flex-grow">{children}</main>
      <footer className="bg-white border-t border-slate-200 text-slate-500 text-center py-6 text-sm mt-auto shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-slate-600">&copy; 2024 JobFinder Intelligent Recruitment Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default CandidateLayout;