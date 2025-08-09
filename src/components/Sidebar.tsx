import React from 'react';
import { Inbox, Clock, LogOut } from 'lucide-react';
import logo from '../asserts/logo.png';

interface SidebarProps {
  activeView: 'inbox' | 'reminders';
  onViewChange: (view: 'inbox' | 'reminders') => void;
  onSignOut: () => void;
  reminderCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onViewChange,
  onSignOut,
  reminderCount
}) => {
  return (
    <div className="flex flex-col w-64 h-full text-white bg-black">
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <img src={logo} alt="Logo" className="w-12 h-12 bg-black rounded-full" />
          <h1 className="font-mono text-2xl font-bold tracking-tight text-white">
            SimplMail
          </h1>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <div className="space-y-2">
          <button
            onClick={() => onViewChange('inbox')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-200 ${activeView === 'inbox'
              ? 'bg-gray-700 text-white'
              : 'text-gray-300 hover:text-white hover:bg-gray-800'
              }`}
          >
            <Inbox className="w-5 h-5" />
            <span>Inbox</span>
          </button>

          <button
            onClick={() => onViewChange('reminders')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-200 ${activeView === 'reminders'
              ? 'bg-gray-700 text-white'
              : 'text-gray-300 hover:text-white hover:bg-gray-800'
              }`}
          >
            <Clock className="w-5 h-5" />
            <span>Reminders</span>
            {reminderCount > 0 && (
              <span className="px-2 py-1 ml-auto text-xs text-white bg-orange-500 rounded-full">
                {reminderCount}
              </span>
            )}
          </button>
        </div>
      </nav>

      <div className="p-4 border-t border-gray-700">
        <button
          onClick={onSignOut}
          className="flex items-center w-full gap-3 px-3 py-2 text-gray-300 transition-colors duration-200 rounded-lg hover:text-white hover:bg-gray-800"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};