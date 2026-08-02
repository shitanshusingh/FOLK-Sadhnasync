import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Trash2, CheckCircle, BookOpen, Brain, ListTodo } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

const BucketList = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState('seva');
  const [data, setData] = useState({ seva: [], topics: [], books: [] });

  const [newItem, setNewItem] = useState({ title: '', status: 'todo', remark: '', startDate: '' });
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(`sadhana_bucket_list_${currentUser.email}`);
    if (saved) {
      setData(JSON.parse(saved));
    } else {
      setData({ seva: [], topics: [], books: [] });
    }
  }, []);

  const saveData = (newData) => {
    setData(newData);
    localStorage.setItem(`sadhana_bucket_list_${currentUser.email}`, JSON.stringify(newData));
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newItem.title.trim()) return;

    const payload = { ...newItem, id: uuidv4() };
    if (activeTab === 'books' && !payload.startDate) {
      payload.startDate = format(new Date(), 'yyyy-MM-dd');
    }
    
    // Default starting statuses
    if (activeTab === 'seva' && !payload.status) payload.status = 'todo';
    if (activeTab === 'topics' && !payload.status) payload.status = 'todo';
    if (activeTab === 'books' && !payload.status) payload.status = 'reading';
    
    const newData = { ...data, [activeTab]: [...data[activeTab], payload] };
    saveData(newData);
    setIsAdding(false);
    setNewItem({ title: '', status: 'todo', remark: '', startDate: '' });
  };

  const deleteItem = (id) => {
    const item = data[activeTab].find(i => i.id === id);
    if (item && item.addedByGuide) {
      alert('This is a priority task assigned by your FOLK Guide. Complete it first!');
      return;
    }
    const newData = { ...data, [activeTab]: data[activeTab].filter(item => item.id !== id) };
    saveData(newData);
  };

  const updateStatus = (id, status) => {
    const newData = { 
      ...data, 
      [activeTab]: data[activeTab].map(item => item.id === id ? { ...item, status } : item) 
    };
    saveData(newData);
  };

  const updateRemark = (id, remark) => {
    const newData = { 
      ...data, 
      [activeTab]: data[activeTab].map(item => item.id === id ? { ...item, remark } : item) 
    };
    saveData(newData);
  };

  const renderTwoColumnLayout = (items, inProgressStatuses, completedStatus, renderInProgressContent, renderCompletedContent) => (
    <div className="grid-cols-2">
      <div className="panel" style={{ background: 'rgba(15,23,42,0.6)' }}>
        <h3 className="panel-title" style={{ color: 'var(--text-main)', marginBottom: '1rem' }}>To-Do & In Progress</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {items.filter(s => s.status !== completedStatus).map(item => (
            <div key={item.id} style={{ background: item.addedByGuide ? 'rgba(245, 158, 11, 0.08)' : 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: item.addedByGuide ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--border-subtle)' }}>
              {item.addedByGuide && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem', color: 'var(--primary-amber)', fontSize: '0.75rem', fontWeight: 'bold' }}>
                  <span>⭐ PRIORITY — Assigned by FOLK Guide</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontWeight: '500' }}>{item.title}</span>
                <button onClick={() => deleteItem(item.id)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer' }}><Trash2 size={16}/></button>
              </div>
              {renderInProgressContent(item)}
            </div>
          ))}
          {items.filter(s => s.status !== completedStatus).length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No pending items.</p>}
        </div>
      </div>

      <div className="panel" style={{ background: 'rgba(16,185,129,0.05)', borderColor: 'rgba(16,185,129,0.2)' }}>
        <h3 className="panel-title" style={{ color: 'var(--accent-emerald)', marginBottom: '1rem' }}>Completed</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {items.filter(s => s.status === completedStatus).map(item => (
            <div key={item.id} style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16,185,129,0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: '600', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle size={16}/> {item.title}
                </span>
                <button onClick={() => deleteItem(item.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><Trash2 size={14}/></button>
              </div>
              {renderCompletedContent(item)}
            </div>
          ))}
          {items.filter(s => s.status === completedStatus).length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No completed items yet.</p>}
        </div>
      </div>
    </div>
  );

  const renderSevaTab = () => renderTwoColumnLayout(
    data.seva,
    ['todo', 'progress'],
    'completed',
    (item) => (
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
        <button className={`badge ${item.status === 'todo' ? 'badge-amber' : 'badge-amber disabled'}`} onClick={() => updateStatus(item.id, 'todo')}>To-Do</button>
        <button className={`badge ${item.status === 'progress' ? 'badge-blue' : 'badge-blue disabled'}`} onClick={() => updateStatus(item.id, 'progress')}>In Progress</button>
        <button className="badge badge-emerald disabled" onClick={() => updateStatus(item.id, 'completed')}>Mark Complete</button>
      </div>
    ),
    (item) => (
      <input 
        type="text" 
        className="form-control" 
        placeholder="Add completion remark..." 
        value={item.remark || ''} 
        onChange={(e) => updateRemark(item.id, e.target.value)}
        style={{ fontSize: '0.85rem', padding: '0.4rem 0.6rem', marginTop: '0.5rem' }}
      />
    )
  );

  const renderTopicsTab = () => renderTwoColumnLayout(
    data.topics,
    ['todo', 'progress'],
    'completed',
    (item) => (
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
        <button className={`badge ${item.status === 'todo' ? 'badge-amber' : 'badge-amber disabled'}`} onClick={() => updateStatus(item.id, 'todo')}>To Learn</button>
        <button className={`badge ${item.status === 'progress' ? 'badge-blue' : 'badge-blue disabled'}`} onClick={() => updateStatus(item.id, 'progress')}>Studying</button>
        <button className="badge badge-emerald disabled" onClick={() => updateStatus(item.id, 'completed')}>Concept Clear</button>
      </div>
    ),
    (item) => (
      <input 
        type="text" 
        className="form-control" 
        placeholder="Key takeaway..." 
        value={item.remark || ''} 
        onChange={(e) => updateRemark(item.id, e.target.value)}
        style={{ fontSize: '0.85rem', padding: '0.4rem 0.6rem', marginTop: '0.5rem' }}
      />
    )
  );

  const renderBooksTab = () => renderTwoColumnLayout(
    data.books,
    ['reading'],
    'completed',
    (item) => {
      const days = differenceInDays(new Date(), new Date(item.startDate));
      return (
        <div style={{ marginTop: '1rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            Started: {item.startDate} ({days > 0 ? `${days} days ago` : 'Today'})
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className={`badge ${item.status === 'reading' ? 'badge-amber' : 'badge-amber disabled'}`} onClick={() => updateStatus(item.id, 'reading')}>Reading</button>
            <button className="badge badge-emerald disabled" onClick={() => updateStatus(item.id, 'completed')}>Finished</button>
          </div>
        </div>
      );
    },
    (item) => (
      <input 
        type="text" 
        className="form-control" 
        placeholder="Favorite quote or realization..." 
        value={item.remark || ''} 
        onChange={(e) => updateRemark(item.id, e.target.value)}
        style={{ fontSize: '0.85rem', padding: '0.4rem 0.6rem', marginTop: '0.5rem' }}
      />
    )
  );

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '4rem' }}>
      <div className="panel-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="panel-title" style={{ fontSize: '1.8rem', color: 'var(--primary-amber)' }}>Bucket List</h1>
          <p>Track your Seva, Philosophy Topics, and Srila Prabhupada's Books.</p>
        </div>
        <button className="nav-btn btn-primary" onClick={() => setIsAdding(true)}>
          <Plus size={18} /> Add New Item
        </button>
      </div>

      <nav className="tabs-bar" style={{ background: 'transparent', border: 'none', padding: 0, marginBottom: '1.5rem' }}>
        <div className="tabs-container" style={{ gap: '1rem' }}>
          <button className={`tab-item ${activeTab === 'seva' ? 'active' : ''}`} style={{ background: activeTab === 'seva' ? 'rgba(245, 158, 11, .12)' : 'var(--bg-card)', border: '1px solid var(--border-subtle)' }} onClick={() => setActiveTab('seva')}>
            <ListTodo size={16} /> 1. Seva To-Do List
          </button>
          <button className={`tab-item ${activeTab === 'topics' ? 'active' : ''}`} style={{ background: activeTab === 'topics' ? 'rgba(245, 158, 11, .12)' : 'var(--bg-card)', border: '1px solid var(--border-subtle)' }} onClick={() => setActiveTab('topics')}>
            <Brain size={16} /> 2. Philosophy Topics
          </button>
          <button className={`tab-item ${activeTab === 'books' ? 'active' : ''}`} style={{ background: activeTab === 'books' ? 'rgba(245, 158, 11, .12)' : 'var(--bg-card)', border: '1px solid var(--border-subtle)' }} onClick={() => setActiveTab('books')}>
            <BookOpen size={16} /> 3. Prabhupada Books
          </button>
        </div>
      </nav>

      {activeTab === 'seva' && renderSevaTab()}
      {activeTab === 'topics' && renderTopicsTab()}
      {activeTab === 'books' && renderBooksTab()}

      {isAdding && (
        <div className="modal-overlay" onClick={() => setIsAdding(false)}>
          <div className="modal-card animate-fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 style={{ color: 'var(--text-main)' }}>Add to {activeTab === 'seva' ? 'Seva List' : activeTab === 'topics' ? 'Philosophy Topics' : 'Book Tracker'}</h3>
            </div>
            <form onSubmit={handleAdd} className="modal-body">
              <div className="form-group">
                <label>Title</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={newItem.title} 
                  onChange={e => setNewItem({...newItem, title: e.target.value})} 
                  placeholder={activeTab === 'books' ? "e.g. Srimad Bhagavatam Canto 1" : "Enter title..."}
                  required 
                  autoFocus
                />
              </div>
              
              {activeTab === 'books' && (
                <div className="form-group">
                  <label>Start Date</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={newItem.startDate} 
                    onChange={e => setNewItem({...newItem, startDate: e.target.value})} 
                    required 
                  />
                </div>
              )}
              
              <div className="modal-footer" style={{ padding: '1rem 0 0', marginTop: '1rem', border: 'none' }}>
                <button type="button" className="nav-btn btn-secondary" onClick={() => setIsAdding(false)}>Cancel</button>
                <button type="submit" className="nav-btn btn-primary">Save Item</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BucketList;

