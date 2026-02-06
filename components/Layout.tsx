import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Gift, Settings, LogOut, Building2, User } from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col fixed h-full z-10">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <Gift className="w-6 h-6 text-primary mr-3" />
          <span className="font-bold text-white text-lg tracking-wide">礼品激励平台</span>
        </div>
        
        <nav className="flex-1 py-6 px-3 space-y-1">
          <NavLink 
            to="/"
            className={({ isActive }) => 
              `flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                isActive ? 'bg-primary text-white' : 'hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <LayoutDashboard className="w-5 h-5 mr-3" />
            规则管理
          </NavLink>
          <a href="#" className="flex items-center px-3 py-2.5 rounded-md text-sm font-medium hover:bg-slate-800 hover:text-white transition-colors">
            <Building2 className="w-5 h-5 mr-3" />
            分公司配置
          </a>
          <a href="#" className="flex items-center px-3 py-2.5 rounded-md text-sm font-medium hover:bg-slate-800 hover:text-white transition-colors">
            <Settings className="w-5 h-5 mr-3" />
            系统设置
          </a>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center w-full px-3 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors cursor-pointer">
            <User className="w-5 h-5 mr-3" />
            <div className="flex flex-col">
              <span className="text-white">管理员</span>
              <span className="text-xs">总部运营</span>
            </div>
          </div>
          <button className="mt-2 w-full flex items-center px-3 py-2 text-sm font-medium text-slate-400 hover:text-red-400 transition-colors">
            <LogOut className="w-5 h-5 mr-3" />
            退出登录
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8 2xl:px-12">
        <div className="max-w-[1600px] w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
