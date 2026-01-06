
import React from 'react';

interface LoadingOverlayProps {
  message?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message = 'Đang xử lý...' }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[9999] flex items-center justify-center animate-in fade-in duration-300">
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl flex flex-col items-center gap-6 animate-in zoom-in duration-300">
        <div className="relative w-24 h-24">
          {/* Inner pulsating circle */}
          <div className="absolute inset-4 bg-blue-50 rounded-full animate-pulse"></div>
          
          {/* Main spinning border */}
          <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          
          {/* Centered icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <i className="fa-solid fa-table-tennis-paddle-ball text-blue-600 text-3xl animate-bounce"></i>
          </div>
        </div>
        
        <div className="text-center space-y-1">
          <p className="text-lg font-black text-slate-800 tracking-tight">{message}</p>
          <div className="flex gap-1 justify-center">
            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
