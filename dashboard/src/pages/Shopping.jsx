import { useState, useEffect } from 'react';

export default function Shopping() {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState('');
  const [newCategory, setNewCategory] = useState('Groceries');

  useEffect(() => {
    loadItems();
  }, []);

  function loadItems() {
    // Load from localStorage for now (can hook up to API later)
    const saved = localStorage.getItem('shopping_items');
    if (saved) {
      setItems(JSON.parse(saved));
    } else {
      // Sample data
      setItems([
        { id: 1, item: 'Milk', category: 'Groceries', completed: false, added_by: 'Snehal' },
        { id: 2, item: 'Bread', category: 'Groceries', completed: false, added_by: 'Anushka' },
        { id: 3, item: 'Chicken', category: 'Groceries', completed: false, added_by: 'Snehal' },
        { id: 4, item: 'Laundry Detergent', category: 'Household', completed: false, added_by: 'Anushka' },
        { id: 5, item: 'Kids Toys', category: 'Kids', completed: false, added_by: 'Ayush' },
      ]);
    }
  }

  function saveItems(newItems) {
    setItems(newItems);
    localStorage.setItem('shopping_items', JSON.stringify(newItems));
  }

  function addItem() {
    if (!newItem.trim()) return;
    
    const item = {
      id: Date.now(),
      item: newItem,
      category: newCategory,
      completed: false,
      added_by: 'Snehal'
    };
    
    saveItems([...items, item]);
    setNewItem('');
  }

  function toggleItem(id) {
    const updated = items.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    saveItems(updated);
  }

  function deleteItem(id) {
    saveItems(items.filter(item => item.id !== id));
  }

  return (
    <div className="max-w-3xl">
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛒</span>
            <h2 className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
              Shopping List
            </h2>
          </div>
        </div>

        {/* Add Item Form */}
        <div className="flex gap-3 mb-6">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addItem()}
            placeholder="Add an item..."
            className="flex-1 px-4 py-3 rounded-xl text-sm"
            style={{ 
              background: 'var(--bg-secondary)', 
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)'
            }}
          />
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="px-4 py-3 rounded-xl text-sm"
            style={{ 
              background: 'var(--bg-secondary)', 
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)'
            }}
          >
            <option>Groceries</option>
            <option>Household</option>
            <option>Kids</option>
            <option>Other</option>
          </select>
          <button
            onClick={addItem}
            className="px-6 py-3 rounded-xl text-sm font-medium text-white transition-all hover:scale-105"
            style={{ background: 'var(--accent-orange)' }}
          >
            + Add
          </button>
        </div>

        {/* Shopping Items */}
        <div className="space-y-3">
          {items.filter(item => !item.completed).length === 0 && (
            <p className="text-center text-slate-400 py-8">
              No items yet. Add something to get started!
            </p>
          )}
          
          {items.filter(item => !item.completed).map(item => (
            <ShoppingItem 
              key={item.id} 
              item={item} 
              onToggle={toggleItem}
              onDelete={deleteItem}
            />
          ))}
        </div>

        {/* Completed Items */}
        {items.filter(item => item.completed).length > 0 && (
          <div className="mt-8">
            <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-3">
              Completed
            </h3>
            <div className="space-y-2">
              {items.filter(item => item.completed).map(item => (
                <ShoppingItem 
                  key={item.id} 
                  item={item} 
                  onToggle={toggleItem}
                  onDelete={deleteItem}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ShoppingItem({ item, onToggle, onDelete }) {
  const categoryColors = {
    Groceries: 'rgba(16,185,129,0.1)',
    Household: 'rgba(79,156,249,0.1)',
    Kids: 'rgba(245,158,11,0.1)',
    Other: 'rgba(139,92,246,0.1)'
  };

  return (
    <div 
      className="flex items-center gap-3 p-4 rounded-xl transition-all"
      style={{ 
        background: 'var(--bg-secondary)', 
        border: '1px solid var(--border-subtle)',
        opacity: item.completed ? 0.6 : 1
      }}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(item.id)}
        className="w-6 h-6 rounded-lg flex items-center justify-center transition-all"
        style={{ 
          background: item.completed ? 'var(--accent-green)' : 'transparent',
          border: `2px solid ${item.completed ? 'var(--accent-green)' : 'var(--border-subtle)'}`
        }}
      >
        {item.completed && <span className="text-white text-sm">✓</span>}
      </button>

      {/* Item Text */}
      <div 
        className="flex-1 text-sm"
        style={{ 
          textDecoration: item.completed ? 'line-through' : 'none',
          color: item.completed ? 'var(--text-muted)' : 'var(--text-primary)'
        }}
      >
        {item.item}
      </div>

      {/* Category Badge */}
      <div 
        className="px-3 py-1 rounded-lg text-xs"
        style={{ 
          background: categoryColors[item.category] || categoryColors.Other,
          color: 'var(--text-secondary)'
        }}
      >
        {item.category}
      </div>

      {/* Delete Button */}
      <button
        onClick={() => onDelete(item.id)}
        className="text-slate-500 hover:text-red-400 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
