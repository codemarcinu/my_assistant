
import React from 'react';
import { useTheme } from '../ThemeProvider';

interface PageHeaderProps {
  title: string;
  subtitle: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle }) => {
  const { resolvedTheme } = useTheme();

  return (
    <div className={`
      px-6 py-4 border-b
      ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}
    `}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {title}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PageHeader;
