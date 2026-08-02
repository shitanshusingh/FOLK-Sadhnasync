import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Trash2, CheckCircle, Edit3 } from 'lucide-react';

const COLUMNS = [
  { id: 'todo', title: 'To-Do' },
  { id: 'progress', title: 'In Progress' },
  { id: 'completed', title: 'Completed' }
];

const SevaGoalsBoard = () => {
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [remark, setRemark] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('sadhana_seva_tasks');
    if (saved) setTasks(JSON.parse(saved));
  }, []);

  const saveTasks = (newTasks) => {
    setTasks(newTasks);
    localStorage.setItem('sadhana_seva_tasks', JSON.stringify(newTasks));
  };

  const addTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    
    const newTask = {
      id: uuidv4(),
      title: newTaskTitle,
      status: 'todo',
      createdAt: new Date().toISOString(),
      remark: ''
    };
    
    saveTasks([...tasks, newTask]);
    setNewTaskTitle('');
  };

  const moveTask = (taskId, newStatus) => {
    if (newStatus === 'completed') {
      // Open remark modal instead of just moving
      const task = tasks.find(t => t.id === taskId);
      setEditingTask({ ...task, status: 'completed' });
      return;
    }

    const updated = tasks.map(t => 
      t.id === taskId ? { ...t, status: newStatus } : t
    );
    saveTasks(updated);
  };

  const completeTaskWithRemark = () => {
    const updated = tasks.map(t => 
      t.id === editingTask.id ? { ...t, status: 'completed', remark: remark, completedAt: new Date().toISOString() } : t
    );
    saveTasks(updated);
    setEditingTask(null);
    setRemark('');
  };

  const deleteTask = (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      saveTasks(tasks.filter(t => t.id !== taskId));
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '4rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ color: 'var(--primary-color)' }}>Seva & Goals Board</h1>
        <p>Manage your spiritual projects, reading lists, and bucket list.</p>
      </div>

      <form onSubmit={addTask} className="panel" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
        <input 
          type="text" 
          value={newTaskTitle} 
          onChange={(e) => setNewTaskTitle(e.target.value)} 
          className="input-field" 
          placeholder="Add a new goal or Seva... (e.g. Finish reading Bhagavad-Gita Chapter 2)"
          style={{ flex: 1 }}
        />
        <button type="submit" className="btn btn-primary">
          <Plus size={18} /> Add Goal
        </button>
      </form>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {COLUMNS.map(col => (
          <div key={col.id} className="panel" style={{ padding: '1.5rem', minHeight: '500px', backgroundColor: 'var(--bg-color)' }}>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {col.title}
              <span style={{ fontSize: '0.8rem', backgroundColor: 'var(--surface-color)', padding: '0.2rem 0.6rem', borderRadius: '1rem' }}>
                {tasks.filter(t => t.status === col.id).length}
              </span>
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {tasks.filter(t => t.status === col.id).map(task => (
                <div key={task.id} className="panel" style={{ padding: '1rem', cursor: 'pointer', position: 'relative' }}>
                  <h4 style={{ marginBottom: '0.5rem', paddingRight: '2rem' }}>{task.title}</h4>
                  
                  {task.remark && (
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem', padding: '0.5rem', backgroundColor: 'var(--surface-color)', borderRadius: 'var(--radius-sm)' }}>
                      <em>"{task.remark}"</em>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    {col.id !== 'todo' && (
                      <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => moveTask(task.id, 'todo')}>
                        To-Do
                      </button>
                    )}
                    {col.id !== 'progress' && (
                      <button className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => moveTask(task.id, 'progress')}>
                        In Progress
                      </button>
                    )}
                    {col.id !== 'completed' && (
                      <button className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', backgroundColor: 'var(--success-color)' }} onClick={() => moveTask(task.id, 'completed')}>
                        Complete
                      </button>
                    )}
                  </div>
                  
                  <button 
                    className="btn-icon" 
                    style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', color: 'var(--danger-color)' }}
                    onClick={() => deleteTask(task.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Completion Modal */}
      {editingTask && (
        <div className="event-modal-overlay">
          <div className="event-modal glass-panel">
            <h2 style={{ color: 'var(--success-color)', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <CheckCircle /> Goal Completed!
            </h2>
            <p style={{ marginBottom: '1.5rem' }}>{editingTask.title}</p>
            
            <div className="input-group" style={{ textAlign: 'left' }}>
              <label className="input-label">Realization / Remark</label>
              <textarea 
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                className="input-field"
                placeholder="What did you learn? Any notes for the future?"
                style={{ minHeight: '100px' }}
              ></textarea>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setEditingTask(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={completeTaskWithRemark}>Save to Journey Log</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SevaGoalsBoard;
