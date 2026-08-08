import { useState, useEffect } from 'react';
import { cloudSaveBucketList } from '../services/firebase';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Trash2, CheckCircle, BookOpen, Brain, ListTodo } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

const PHILOSOPHY_TOPICS = [
  "SOUL", "KARMA", "YOGA/CHANTING", "REINCARNATION", "3 MODES OF MATERIAL NATURE", 
  "IMP OF DEVOTIONAL SERVICE", "GOD-DEMIGOD", "ASPECTS OF ABSOLUTE TRUTH-FORM/FORMLESS", 
  "VEG-NONVEG", "SCRIPTURES", "PRANAMA MANTRAS", "DHAM IMP", "GURU-SP", "DHARMA", 
  "PANCHA TATTVA", "CAST Vs. VARNASHRAMA", "DEITY Vs. IDOL WORSHIP", 
  "MATERIAL WORLD/SPIRITUAL WORLD", "IF GOD IS EVERYWHERE WHY TO GO TEMPLES", 
  "MADHAVA SEVA Vs MANAVA SEVA", "WHY SO MANY RELIGION", "WHY TO ACCEPT KC IN YOUTH", 
  "LOVE Vs LUST", "5 FACTORS OF SUCCESS", "PURPOSE OF LIFE", "VAISHNAVA ETIQUETES", 
  "IQ-EQ-SQ", "B-D-O-D", "4 REGULATIVE PRINCIPLES", "PRASADAM Vs BHOGA", 
  "HUMAN BEING Vs ANIMALS", "TIME DIMENSION", "5 KINDS OF LIBERATION", 
  "IMPERSONALISM/VOIDISM-NIRVANA/MAYAVADA", "KRISHNA'S ENERGIES", "6 KINDS OF INCARNATION", 
  "5 DIFF KINDS OF RELATIONSHIP OF JIVA WITH KRISHNA", "IMP OF PREACHING", "IMP OF BOOK DISTRIBUTION"
];

const PRABHUPADA_BOOKS = [
  "Category I: On The Way to Krishna", "Category I: Elevation to Krishna Consciousness", "Category I: Krishna Consciousness the Matchless Gift", "Category I: Krishna the Reservoir of Pleasure", "Category I: Perfection of Yoga", "Category I: Krishna Consciousness – The Topmost Yoga System", "Category I: Beyond Birth and Death", "Category I: Perfect Questions Perfect Answers", "Category I: Laws of Nature", "Category I: Easy Journey to Other Planets", "Category I: Raja Vidya: The King of Knowledge", "Category I: Transcendental Teachings of Prahlad Maharaj", "Category I: Coming Back", "Category I: Message of Godhead", "Category I: Civilization and Transcendence", "Category I: Hare Krishna Challenge", "Category I: Scientific Basis of Krishna Consciousness", "Category I: Sword of Knowledge", "Category I: Nectar of Instruction", "Category I: Path of Perfection", "Category I: Issues of Back To Back to Godhead Magazine", "Category I: Prabhupada Lilamrita",
  "Category II: Introduction to Bhagvad Gita As It Is", "Category II: Science of Self-Realization", "Category II: Journey of Self Discovery", "Category II: Life comes from Life", "Category II: Nectar of Devotion (Only Part One)", "Category II: Teachings of Queen Kunti", "Category II: Teachings of Lord Kapila", "Category II: Teachings of Lord Chaitanya", "Category II: Sri Isopanishad", "Category II: Few Shlokas of Bhagvad Gita Everyday", "Category II: Krishna Book", "Category II: Srimad Bhagavatam (1st Canto)", "Category II: A Second Chance",
  "Category III: Bhagvad Gita As It Is", "Category III: Srimad Bhagavatam (Canto By Canto)", "Category III: Nectar Of Devotion (Part II And Part III)", "Category III: Chaitanya Charitamrita"
];

const isDefaultItem = (title, tab) => {
  if (tab === 'topics') return PHILOSOPHY_TOPICS.includes(title);
  if (tab === 'books') return PRABHUPADA_BOOKS.includes(title);
  return false;
};

const BucketList = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState('seva');
  const [data, setData] = useState({ seva: [], topics: [], books: [] });

  const [newItem, setNewItem] = useState({ title: '', status: 'todo', remark: '', startDate: '' });
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(`sadhana_bucket_list_${currentUser.email}`);
    let parsedData = { seva: [], topics: [], books: [] };
    if (saved) {
      parsedData = JSON.parse(saved);
    }
    
    // Inject missing topics
    const existingTopics = new Set(parsedData.topics.map(t => t.title));
    PHILOSOPHY_TOPICS.forEach(topic => {
      if (!existingTopics.has(topic)) {
        parsedData.topics.push({ id: uuidv4(), title: topic, status: 'todo', remark: '', startDate: '' });
      }
    });

    // Inject missing books
    const existingBooks = new Set(parsedData.books.map(b => b.title));
    PRABHUPADA_BOOKS.forEach(book => {
      if (!existingBooks.has(book)) {
        parsedData.books.push({ id: uuidv4(), title: book, status: 'todo', remark: '', startDate: '' });
      }
    });

    setData(parsedData);
  }, []);

  const saveData = (newData) => {
    setData(newData);
    cloudSaveBucketList(currentUser.email, newData);
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
    
    const newData = { ...data, [activeTab]: [payload, ...data[activeTab]] };
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
    if (status === 'completed') {
      const item = data[activeTab].find(i => i.id === id);
      if (!item.remark || !item.remark.trim()) {
        alert("Please add a remark/takeaway before marking as completed.");
        return;
      }
    }
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

  const renderTwoColumnLayout = (items, inProgressStatuses, completedStatus, renderInProgressContent, renderCompletedContent, tabName) => {
    const defaults = items.filter(i => isDefaultItem(i.title, tabName));
    const customs = items.filter(i => !isDefaultItem(i.title, tabName));
    const sorted = [...defaults, ...customs];

    return (
      <div className="grid-cols-2" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)' }}>
        <div className="panel" style={{ background: 'rgba(15,23,42,0.6)' }}>
          <h3 className="panel-title" style={{ color: 'var(--text-main)', marginBottom: '1rem' }}>To-Do & In Progress</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {sorted.filter(s => s.status !== completedStatus).map(item => (
              <div key={item.id} style={{ background: item.addedByGuide ? 'rgba(245, 158, 11, 0.08)' : 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: item.addedByGuide ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--border-subtle)' }}>
                {item.addedByGuide && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem', color: 'var(--primary-amber)', fontSize: '0.75rem', fontWeight: 'bold' }}>
                    <span>⭐ PRIORITY — Assigned by FOLK Guide</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontWeight: '500' }}>{item.title}</span>
                  {!isDefaultItem(item.title, tabName) && (
                    <button onClick={() => deleteItem(item.id)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer' }}><Trash2 size={16}/></button>
                  )}
                </div>
                {renderInProgressContent(item)}
              </div>
            ))}
            {sorted.filter(s => s.status !== completedStatus).length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No pending items.</p>}
          </div>
        </div>

        <div className="panel" style={{ background: 'rgba(16,185,129,0.05)', borderColor: 'rgba(16,185,129,0.2)' }}>
          <h3 className="panel-title" style={{ color: 'var(--accent-emerald)', marginBottom: '1rem' }}>Completed</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {sorted.filter(s => s.status === completedStatus).map(item => (
              <div key={item.id} style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16,185,129,0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: '600', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <CheckCircle size={16}/> {item.title}
                  </span>
                  {!isDefaultItem(item.title, tabName) && (
                    <button onClick={() => deleteItem(item.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><Trash2 size={14}/></button>
                  )}
                </div>
                {renderCompletedContent(item)}
              </div>
            ))}
            {sorted.filter(s => s.status === completedStatus).length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No completed items yet.</p>}
          </div>
        </div>
      </div>
    );
  };

  const renderSevaTab = () => renderTwoColumnLayout(
    data.seva,
    ['todo', 'progress'],
    'completed',
    (item) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className={`badge ${item.status === 'todo' ? 'badge-amber' : 'badge-amber disabled'}`} onClick={() => updateStatus(item.id, 'todo')}>To-Do</button>
          <button className={`badge ${item.status === 'progress' ? 'badge-blue' : 'badge-blue disabled'}`} onClick={() => updateStatus(item.id, 'progress')}>In Progress</button>
          <button className="badge badge-emerald disabled" onClick={() => updateStatus(item.id, 'completed')}>Mark Complete</button>
        </div>
        {item.status !== 'todo' && (
          <input 
            type="text" 
            className="form-control" 
            placeholder="Add completion remark (required to finish)..." 
            value={item.remark || ''} 
            onChange={(e) => updateRemark(item.id, e.target.value)}
            style={{ fontSize: '0.85rem', padding: '0.4rem 0.6rem' }}
          />
        )}
      </div>
    ),
    (item) => (
      <input 
        type="text" 
        className="form-control" 
        placeholder="Completion remark..." 
        value={item.remark || ''} 
        onChange={(e) => updateRemark(item.id, e.target.value)}
        style={{ fontSize: '0.85rem', padding: '0.4rem 0.6rem', marginTop: '0.5rem' }}
      />
    ),
    'seva'
  );

  const renderTopicsTab = () => renderTwoColumnLayout(
    data.topics,
    ['todo', 'progress'],
    'completed',
    (item) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className={`badge ${item.status === 'todo' ? 'badge-amber' : 'badge-amber disabled'}`} onClick={() => updateStatus(item.id, 'todo')}>To Learn</button>
          <button className={`badge ${item.status === 'progress' ? 'badge-blue' : 'badge-blue disabled'}`} onClick={() => updateStatus(item.id, 'progress')}>Studying</button>
          <button className="badge badge-emerald disabled" onClick={() => updateStatus(item.id, 'completed')}>Concept Clear</button>
        </div>
        {item.status !== 'todo' && (
          <input 
            type="text" 
            className="form-control" 
            placeholder="Key takeaway (required to finish)..." 
            value={item.remark || ''} 
            onChange={(e) => updateRemark(item.id, e.target.value)}
            style={{ fontSize: '0.85rem', padding: '0.4rem 0.6rem' }}
          />
        )}
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
    ),
    'topics'
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
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
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
    ),
    'books'
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
        <div className="tabs-container" style={{ gap: '0.8rem', flexWrap: 'wrap', overflowX: 'visible' }}>
          <button className={`tab-item ${activeTab === 'seva' ? 'active' : ''}`} style={{ flex: 1, minWidth: '150px', justifyContent: 'center', background: activeTab === 'seva' ? 'rgba(245, 158, 11, .12)' : 'var(--bg-card)', border: '1px solid var(--border-subtle)' }} onClick={() => setActiveTab('seva')}>
            <ListTodo size={16} /> 1. Seva To-Do List
          </button>
          <button className={`tab-item ${activeTab === 'topics' ? 'active' : ''}`} style={{ flex: 1, minWidth: '150px', justifyContent: 'center', background: activeTab === 'topics' ? 'rgba(245, 158, 11, .12)' : 'var(--bg-card)', border: '1px solid var(--border-subtle)' }} onClick={() => setActiveTab('topics')}>
            <Brain size={16} /> 2. Philosophy Topics
          </button>
          <button className={`tab-item ${activeTab === 'books' ? 'active' : ''}`} style={{ flex: 1, minWidth: '150px', justifyContent: 'center', background: activeTab === 'books' ? 'rgba(245, 158, 11, .12)' : 'var(--bg-card)', border: '1px solid var(--border-subtle)' }} onClick={() => setActiveTab('books')}>
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

