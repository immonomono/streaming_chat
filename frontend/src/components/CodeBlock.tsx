import { useState } from 'react';

interface Props {
  className?: string;
  children: string;
}

export default function CodeBlock({ className, children }: Props) {
  const [copied, setCopied] = useState(false);
  const language = className?.replace('language-', '') || '';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      {language && (
        <div className="absolute top-0 left-0 px-3 py-1 text-xs text-gray-400 bg-gray-800 rounded-tl-lg rounded-br-lg">
          {language}
        </div>
      )}
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 px-2 py-1 text-xs rounded bg-gray-700 hover:bg-gray-600 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
      <pre className="!mt-0 !rounded-lg">
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
}
