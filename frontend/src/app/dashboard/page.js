'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '../../utils/api';
import Link from 'next/link';
import { Search, Plus, Trash2, Edit, Sun, Moon } from 'lucide-react';

const fetcher = url => api.get(url).then(res => res.data);

export default function Dashboard() {
  const { user, logout, loading: authLoading, theme, toggleTheme } = useAuth();
  const router = useRouter();

  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  const queryParams = new URLSearchParams({
    page,
    limit: 10,
    sortBy,
    sortOrder,
    ...(status && { status }),
    ...(search && { search })
  }).toString();

  const { data, error, mutate } = useSWR(user ? `/tasks?${queryParams}` : null, fetcher);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  // Optimistic delete
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    const previousData = data;
    mutate(
      { ...data, tasks: data.tasks.filter(t => t.id !== id) },
      false // don't revalidate yet
    );
    try {
      await api.delete(`/tasks/${id}`);
      mutate(); // revalidate after success
    } catch {
      mutate(previousData, false); // rollback on failure
    }
  };

  // Optimistic status change
  const handleStatusChange = async (id, newStatus) => {
    const previousData = data;
    mutate(
      { ...data, tasks: data.tasks.map(t => t.id === id ? { ...t, status: newStatus } : t) },
      false
    );
    try {
      await api.patch(`/tasks/${id}`, { status: newStatus });
      mutate();
    } catch {
      mutate(previousData, false); // rollback
    }
  };

  if (authLoading) return <div className="container" style={{ padding: '2rem' }}>Loading...</div>;

  return (
    <div>
      <nav className="navbar">
        <div className="container">
          <div className="navbar-brand">
            <div style={{ width: 32, height: 32, backgroundColor: 'var(--primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
              T
            </div>
            TaskMaster
            {user?.role === 'admin' && (
              <span className="badge" style={{ backgroundColor: '#7c3aed', color: '#fff', marginLeft: '0.5rem' }}>Admin</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>{user?.email}</span>
            <button
              className="btn btn-outline"
              onClick={toggleTheme}
              title="Toggle theme"
              style={{ padding: '0.4rem 0.6rem' }}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button className="btn btn-outline" onClick={logout}>Logout</button>
          </div>
        </div>
      </nav>

      <main className="main-content container">
        <div className="page-header">
          <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>
            {data?.isAdmin ? 'All Tasks (Admin)' : 'Your Tasks'}
          </h1>
          <Link href="/dashboard/tasks/new" className="btn">
            <Plus size={18} style={{ marginRight: '0.5rem' }} /> New Task
          </Link>
        </div>

        <div className="filters-row card" style={{ padding: '1rem' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', flex: 1, minWidth: '250px' }}>
            <input
              type="text"
              className="input"
              placeholder="Search tasks..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
            <button type="submit" className="btn"><Search size={18} /></button>
          </form>

          <select className="input" style={{ width: 'auto' }} value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>

          <select className="input" style={{ width: 'auto' }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="createdAt">Date Created</option>
            <option value="dueDate">Due Date</option>
            <option value="priority">Priority</option>
          </select>

          <select className="input" style={{ width: 'auto' }} value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>

        {error && <div className="error-text" style={{ margin: '1rem 0' }}>Failed to load tasks</div>}
        {!data && !error && <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading tasks...</div>}

        {data && data.tasks.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', color: '#94a3b8' }}>
            <div style={{ marginBottom: '1rem' }}><Plus size={48} opacity={0.2} /></div>
            <h3>No tasks found</h3>
            <p>Try adjusting your filters or create a new task.</p>
          </div>
        )}

        <div className="task-grid">
          {data?.tasks.map(task => (
            <div key={task.id} className="card task-card">
              <div className="task-card-header">
                <h3 className="task-card-title">{task.title}</h3>
                <span className={`badge badge-${task.status}`}>{task.status.replace('_', ' ')}</span>
              </div>
              <div className="task-card-body">
                <p style={{ marginBottom: '1rem' }}>{task.description}</p>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#94a3b8', flexWrap: 'wrap' }}>
                  <span><strong>Priority:</strong> <span style={{ textTransform: 'capitalize' }}>{task.priority}</span></span>
                  {task.dueDate && <span><strong>Due:</strong> {new Date(task.dueDate).toLocaleDateString()}</span>}
                  {data?.isAdmin && task.user && (
                    <span><strong>Owner:</strong> {task.user.email}</span>
                  )}
                </div>
              </div>
              <div className="task-card-footer">
                <select
                  className="input"
                  style={{ width: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
                  value={task.status}
                  onChange={(e) => handleStatusChange(task.id, e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Link href={`/dashboard/tasks/${task.id}`} className="btn btn-outline" style={{ padding: '0.25rem 0.5rem' }}>
                    <Edit size={16} />
                  </Link>
                  <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem' }} onClick={() => handleDelete(task.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {data && data.pagination.totalPages > 1 && (
          <div className="pagination">
            <button
              className="btn btn-outline"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </button>
            <span>Page {page} of {data.pagination.totalPages}</span>
            <button
              className="btn btn-outline"
              disabled={page === data.pagination.totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
