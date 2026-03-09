import ModelSelector from './ModelSelector';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  model: string;
  onModelChange: (model: string) => void;
  hasConversation: boolean;
  onToggleSidebar: () => void;
}

export default function Header({ model, onModelChange, hasConversation, onToggleSidebar }: Props) {
  const { logout } = useAuth();

  return (
    <header className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shrink-0">
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 lg:hidden transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <ModelSelector model={model} onChange={onModelChange} disabled={hasConversation} />
      </div>
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <button
          onClick={logout}
          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm"
          title="Sign out"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </header>
  );
}
