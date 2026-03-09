import { type ReactNode } from 'react';

interface Props {
  sidebar: ReactNode;
  sidebarOpen: boolean;
  onCloseSidebar: () => void;
  children: ReactNode;
}

export default function Layout({ sidebar, sidebarOpen, onCloseSidebar, children }: Props) {
  return (
    <div className="fixed inset-0 flex">
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={onCloseSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:relative inset-y-0 left-0 z-30 w-64 shrink-0 transform transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebar}
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
