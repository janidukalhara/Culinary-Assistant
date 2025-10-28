
import React from 'react';

interface ShoppingListProps {
  items: string[];
  onRemove: (item: string) => void;
}

const ShoppingList: React.FC<ShoppingListProps> = ({ items, onRemove }) => {
  if (items.length === 0) {
    return (
      <div className="bg-dark-card p-8 rounded-xl shadow-lg text-center">
        <h3 className="text-2xl font-bold text-light-text mb-2">Your Shopping List is Empty</h3>
        <p className="text-medium-text">Missing ingredients from recipes will appear here.</p>
      </div>
    );
  }

  return (
    <div className="bg-dark-card p-6 md:p-8 rounded-xl shadow-lg">
      <h3 className="text-2xl font-bold text-light-text mb-6 border-b border-dark-surface pb-3">Shopping List</h3>
      <ul className="space-y-3">
        {items.map((item, index) => (
          <li key={index} className="flex justify-between items-center bg-dark-bg p-3 rounded-lg group">
            <span className="text-lg text-medium-text">{item}</span>
            <button 
              onClick={() => onRemove(item)}
              className="text-subtle-text hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label={`Remove ${item}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ShoppingList;
