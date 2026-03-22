import { useState, useEffect } from 'react';

export default function Calendar() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    loadCalendar();
  }, []);

  const loadCalendar = async () => {
    try {
      const res = await fetch('/config/calendar.json');
      const data = await res.json();
      setEvents(data);
    } catch (err) {
      console.error('Error loading calendar:', err);
      setEvents([
        { date: '2026-03-20', time: '09:00', title: 'Dentist - Ayush', member: 'ayush', type: 'appointment' },
        { date: '2026-03-21', time: '15:00', title: 'Piano Lesson', member: 'ayush', type: 'activity' },
        { date: '2026-03-22', time: '10:00', title: 'Swimming Class', member: 'ahana', type: 'activity' },
        { date: '2026-03-25', time: '18:00', title: 'Birthday Party', member: 'family', type: 'event' },
      ]);
    }
  };

  const getMemberColor = (member) => {
    const colors = {
      ayush: 'var(--accent-green)',
      ahana: '#ec4899',
      snehal: 'var(--accent-blue)',
      family: 'var(--accent-purple)'
    };
    return colors[member] || 'var(--text-muted)';
  };

  const getTypeIcon = (type) => {
    const icons = {
      appointment: '🩺',
      activity: '🎯',
      event: '🎉',
      birthday: '🎂',
      school: '🏫'
    };
    return icons[type] || '📅';
  };

  const today = new Date().toISOString().split('T')[0];
  const sortedEvents = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
        📅 Family Calendar
      </h1>

      <div className="space-y-3">
        {sortedEvents.map((event, i) => {
          const isToday = event.date === today;
          const isPast = new Date(event.date) < new Date(today);
          const eventDate = new Date(event.date);
          
          return (
            <div
              key={i}
              className="glass-card p-5"
              style={{
                borderLeft: `4px solid ${getMemberColor(event.member)}`,
                opacity: isPast ? 0.5 : 1
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{getTypeIcon(event.type)}</div>
                  <div>
                    <h3 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
                      {event.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {eventDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                      </span>
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        • {event.time}
                      </span>
                      <span
                        className="px-2 py-1 rounded-full text-xs capitalize"
                        style={{
                          background: `${getMemberColor(event.member)}20`,
                          color: getMemberColor(event.member)
                        }}
                      >
                        {event.member}
                      </span>
                    </div>
                  </div>
                </div>
                {isToday && (
                  <span
                    className="px-3 py-1 rounded-full text-sm font-semibold"
                    style={{ background: 'var(--accent-blue)', color: 'white' }}
                  >
                    Today
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {events.length === 0 && (
          <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
            No upcoming events
          </div>
        )}
      </div>
    </div>
  );
}
