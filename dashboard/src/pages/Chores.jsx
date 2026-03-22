import { useState, useEffect } from 'react';

export default function Chores() {
  const [chores, setChores] = useState([]);
  const [newChore, setNewChore] = useState('');
  const [assignedTo, setAssignedTo] = useState('Ayush');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    loadChores();
  }, []);

  function loadChores() {
    const saved = localStorage.getItem('chores_list');
    if (saved) {
      setChores(JSON.parse(saved));
    } else {
      // Sample data
      setChores([
        { id: 1, title: 'Clean room', assigned_to: 'Ayush', due_date: '2026-03-23', completed: false },
        { id: 2, title: 'Homework - Math', assigned_to: 'Ahana', due_date: '2026-03-22', completed: false },
        { id: 3, title: 'Make bed', assigned_to: 'Ayush', due_date: '2026-03-22', completed: false },
        { id: 4, title: 'Feed pets', assigned_to: 'Ahana', due_date: '2026-03-22', completed: false },
      ]);
    }
  }

  function saveChores(newChores) {
    setChores(newChores);
    localStorage.setItem('chores_list', JSON.stringify(newChores));
  }

  function addChore() {
    if (!newChore.trim()) return;
    
    const chore = {
      id: Date.now(),
      title: newChore,
      assigned_to: assignedTo,
      due_date: dueDate || new Date().toISOString().split('T')[0],
      completed: false
    };
    
    saveChores([...chores, chore]);
    setNewChore('');
    setDueDate('');
  }

  function toggleChore(id) {
    const updated = chores.map(chore => 
      chore.id === id ? { ...chore, completed: !chore.completed } : chore
    );
    saveChores(updated);
  }

  function deleteChore(id) {
    saveChores(chores.filter(chore => chore.id !== id));
  }

  const familyEmojis = {
    Snehal: '👨',
    Anushka: '👩',
    Ayush: '👦',
    Ahana: '👧'
  };

  return (
    <div className="max-w-3xl">
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="text-xl">✅</span>
            <h2 className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
              Chores & Tasks
            </h2>
          </div>
        </div>

        {/* Add Chore Form */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-6">
          <input
            type="text"
            value={newChore}
            onChange={(e) => setNewChore(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addChore()}
            placeholder="What needs to be done?"
            className="md:col-span-5 px-4 py-3 rounded-xl text-sm"
            style={{ 
              background: 'var(--bg-secondary)', 
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)'
            }}
          />
          <select
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            className="md:col-span-3 px-4 py-3 rounded-xl text-sm"
            style={{ 
              background: 'var(--bg-secondary)', 
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)'
            }}
          >
            <option>Snehal</option>
            <option>Anushka</option>
            <option>Ayush</option>
            <option>Ahana</option>
          </select>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="md:col-span-3 px-4 py-3 rounded-xl text-sm"
            style={{ 
              background: 'var(--bg-secondary)', 
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)'
            }}
          />
          <button
            onClick={addChore}
            className="px-6 py-3 rounded-xl text-sm font-medium text-white transition-all hover:scale-105"
            style={{ background: 'var(--accent-orange)' }}
          >
            + Add
          </button>
        </div>

        {/* Chores List */}
        <div className="space-y-3">
          {chores.filter(c => !c.completed).length === 0 && (
            <p className="text-center text-slate-400 py-8">
              No pending chores. Great work! 🎉
            </p>
          )}
          
          {chores.filter(c => !c.completed).map(chore => (
            <ChoreItem 
              key={chore.id} 
              chore={chore}
              emoji={familyEmojis[chore.assigned_to] || '👤'}
              onToggle={toggleChore}
              onDelete={deleteChore}
            />
          ))}
        </div>

        {/* Completed Chores */}
        {chores.filter(c => c.completed).length > 0 && (
          <div className="mt-8">
            <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-3">
              Completed
            </h3>
            <div className="space-y-2">
              {chores.filter(c => c.completed).map(chore => (
                <ChoreItem 
                  key={chore.id} 
                  chore={chore}
                  emoji={familyEmojis[chore.assigned_to] || '👤'}
                  onToggle={toggleChore}
                  onDelete={deleteChore}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ChoreItem({ chore, emoji, onToggle, onDelete }) {
  const dueDate = new Date(chore.due_date);
  const today = new Date();
  const isToday = dueDate.toDateString() === today.toDateString();
  const isOverdue = dueDate < today && !chore.completed;

  return (
    <div 
      className="flex items-center gap-4 p-4 rounded-xl transition-all"
      style={{ 
        background: 'var(--bg-secondary)', 
        border: '1px solid var(--border-subtle)',
        opacity: chore.completed ? 0.6 : 1
      }}
    >
      {/* Avatar */}
      <div 
        className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
        style={{ background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))' }}
      >
        {emoji}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div 
          className="font-medium mb-1"
          style={{ 
            textDecoration: chore.completed ? 'line-through' : 'none',
            color: chore.completed ? 'var(--text-muted)' : 'var(--text-primary)'
          }}
        >
          {chore.title}
        </div>
        <div className="text-xs text-slate-400">
          Assigned to {chore.assigned_to}
        </div>
      </div>

      {/* Due Date */}
      <div 
        className="px-3 py-1 rounded-lg text-xs whitespace-nowrap"
        style={{ 
          background: isOverdue 
            ? 'rgba(239,68,68,0.1)' 
            : isToday 
              ? 'rgba(255,107,53,0.1)'
              : 'rgba(79,156,249,0.1)',
          color: isOverdue 
            ? 'var(--accent-red)' 
            : isToday 
              ? 'var(--accent-orange)'
              : 'var(--accent-blue)'
        }}
      >
        {isToday ? 'Today' : dueDate.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })}
      </div>

      {/* Complete Button */}
      <button
        onClick={() => onToggle(chore.id)}
        className="px-4 py-2 rounded-lg text-xs font-medium transition-all hover:scale-105"
        style={{ 
          background: chore.completed ? 'rgba(16,185,129,0.2)' : 'var(--accent-green)',
          color: chore.completed ? 'var(--accent-green)' : 'white'
        }}
      >
        {chore.completed ? '✓ Done' : 'Complete'}
      </button>

      {/* Delete Button */}
      <button
        onClick={() => onDelete(chore.id)}
        className="text-slate-500 hover:text-red-400 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
