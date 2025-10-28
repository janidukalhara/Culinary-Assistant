
import React from 'react';

interface FilterSidebarProps {
  options: string[];
  activeFilters: string[];
  onFilterChange: (filter: string) => void;
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({ options, activeFilters, onFilterChange }) => {
  return (
    <aside className="w-full md:w-64 lg:w-72 bg-dark-card p-6 rounded-xl shadow-lg md:sticky top-8 self-start">
      <h3 className="text-xl font-bold mb-4 text-light-text border-b border-dark-surface pb-2">Dietary Filters</h3>
      <div className="space-y-3">
        {options.map(option => (
          <label key={option} className="flex items-center space-x-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={activeFilters.includes(option)}
              onChange={() => onFilterChange(option)}
              className="hidden"
            />
            <div className={`w-5 h-5 border-2 rounded-md flex items-center justify-center transition-all duration-200 ${activeFilters.includes(option) ? 'bg-brand-primary border-brand-primary' : 'bg-dark-surface border-subtle-text group-hover:border-brand-primary'}`}>
              {activeFilters.includes(option) && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className={`text-lg transition-colors duration-200 ${activeFilters.includes(option) ? 'text-light-text' : 'text-medium-text group-hover:text-light-text'}`}>{option}</span>
          </label>
        ))}
      </div>
    </aside>
  );
};

export default FilterSidebar;
