import { useState, useEffect } from 'react';

export default function Meals() {
  const [meals, setMeals] = useState({});
  const [editMode, setEditMode] = useState(null);
  const [editValue, setEditValue] = useState('');

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const mealTypes = ['Breakfast', 'Lunch', 'Dinner'];

  useEffect(() => {
    loadMeals();
  }, []);

  function loadMeals() {
    const saved = localStorage.getItem('meal_plan');
    if (saved) {
      setMeals(JSON.parse(saved));
    } else {
      // Sample data
      setMeals({
        Monday: {
          Breakfast: 'Pancakes',
          Lunch: 'Sandwiches',
          Dinner: 'Butter Chicken & Rice'
        },
        Tuesday: {
          Breakfast: 'Cereal',
          Lunch: 'Leftover',
          Dinner: 'Spaghetti Bolognese'
        },
        Wednesday: {
          Breakfast: 'Toast & Eggs',
          Lunch: 'Salad',
          Dinner: 'Stir Fry'
        },
        Thursday: {
          Breakfast: 'Oatmeal',
          Lunch: 'Soup',
          Dinner: 'Pizza Night'
        },
        Friday: {
          Breakfast: 'Smoothie Bowl',
          Lunch: 'Wraps',
          Dinner: 'Fish & Chips'
        },
        Saturday: {
          Breakfast: 'French Toast',
          Lunch: 'BBQ',
          Dinner: 'Tacos'
        },
        Sunday: {
          Breakfast: 'Big Breakfast',
          Lunch: 'Roast',
          Dinner: 'Pasta'
        }
      });
    }
  }

  function saveMeals(newMeals) {
    setMeals(newMeals);
    localStorage.setItem('meal_plan', JSON.stringify(newMeals));
  }

  function startEdit(day, mealType) {
    setEditMode(`${day}-${mealType}`);
    setEditValue(meals[day]?.[mealType] || '');
  }

  function saveEdit(day, mealType) {
    const updated = {
      ...meals,
      [day]: {
        ...meals[day],
        [mealType]: editValue
      }
    };
    saveMeals(updated);
    setEditMode(null);
  }

  function cancelEdit() {
    setEditMode(null);
    setEditValue('');
  }

  return (
    <div>
      <div className="glass-card p-6 mb-6">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-xl">🍽️</span>
          <h2 className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
            Meal Planner
          </h2>
        </div>

        {/* Weekly Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {days.map(day => (
            <DayCard
              key={day}
              day={day}
              meals={meals[day] || {}}
              editMode={editMode}
              editValue={editValue}
              onStartEdit={startEdit}
              onSaveEdit={saveEdit}
              onCancelEdit={cancelEdit}
              setEditValue={setEditValue}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function DayCard({ day, meals, editMode, editValue, onStartEdit, onSaveEdit, onCancelEdit, setEditValue }) {
  const mealTypes = ['Breakfast', 'Lunch', 'Dinner'];
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const isToday = day === today;

  return (
    <div 
      className="p-4 rounded-xl"
      style={{ 
        background: 'var(--bg-secondary)', 
        border: `1px solid ${isToday ? 'var(--accent-orange)' : 'var(--border-subtle)'}`,
        boxShadow: isToday ? '0 0 20px rgba(255,107,53,0.2)' : 'none'
      }}
    >
      <div 
        className="text-xs uppercase tracking-wider font-semibold mb-4"
        style={{ color: isToday ? 'var(--accent-orange)' : 'var(--text-secondary)' }}
      >
        {day}
      </div>
      
      {mealTypes.map(mealType => {
        const editKey = `${day}-${mealType}`;
        const isEditing = editMode === editKey;

        return (
          <div 
            key={mealType} 
            className="mb-3 pb-3"
            style={{ 
              borderBottom: mealType !== 'Dinner' ? '1px solid var(--border-subtle)' : 'none' 
            }}
          >
            <div className="text-xs uppercase text-slate-500 mb-1">
              {mealType}
            </div>
            
            {isEditing ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') onSaveEdit(day, mealType);
                    if (e.key === 'Escape') onCancelEdit();
                  }}
                  autoFocus
                  className="w-full px-2 py-1 rounded text-xs"
                  style={{ 
                    background: 'var(--bg-primary)', 
                    border: '1px solid var(--accent-orange)',
                    color: 'var(--text-primary)'
                  }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => onSaveEdit(day, mealType)}
                    className="flex-1 px-2 py-1 rounded text-xs text-white"
                    style={{ background: 'var(--accent-green)' }}
                  >
                    ✓
                  </button>
                  <button
                    onClick={onCancelEdit}
                    className="flex-1 px-2 py-1 rounded text-xs"
                    style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)' }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => onStartEdit(day, mealType)}
                className="text-sm font-medium cursor-pointer hover:opacity-80 transition-opacity"
                style={{ color: 'var(--text-primary)' }}
              >
                {meals[mealType] || '—'}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
