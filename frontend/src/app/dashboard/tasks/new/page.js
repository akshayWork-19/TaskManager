'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../../utils/api';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { z } from 'zod';

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be under 200 characters'),
  description: z.string().max(2000, 'Description must be under 2000 characters').optional(),
  priority: z.enum(['low', 'medium', 'high']),
  dueDate: z.string().optional(),
});

export default function NewTaskPage() {
  const router = useRouter();
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', dueDate: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const result = schema.safeParse(form);
    if (!result.success) {
      const fieldErrors = {};
      result.error.errors.forEach(e => { fieldErrors[e.path[0]] = e.message; });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setServerError('');
    try {
      await api.post('/tasks', {
        title: form.title,
        description: form.description,
        priority: form.priority,
        ...(form.dueDate && { dueDate: new Date(form.dueDate).toISOString() }),
      });
      router.push('/dashboard');
    } catch (err) {
      const status = err.response?.status;
      if (status === 400) setServerError(err.response?.data?.message || 'Validation failed.');
      else if (status === 401) setServerError('Session expired. Please log in again.');
      else setServerError('Failed to create task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <Link href="/dashboard" className="btn btn-outline" style={{ marginBottom: '2rem' }}>
        <ArrowLeft size={16} style={{ marginRight: '0.5rem' }} /> Back to Dashboard
      </Link>

      <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Create New Task</h1>

        {serverError && (
          <div className="error-text" style={{ marginBottom: '1rem', padding: '0.75rem', background: 'rgba(239,68,68,0.1)', borderRadius: 'var(--radius)' }}>
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="task-title">Title <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input
              id="task-title"
              type="text"
              className="input"
              value={form.title}
              onChange={set('title')}
              style={errors.title ? { borderColor: 'var(--danger)' } : {}}
            />
            {errors.title && <p className="error-text">{errors.title}</p>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="task-desc">Description</label>
            <textarea
              id="task-desc"
              className="input"
              rows="4"
              value={form.description}
              onChange={set('description')}
              style={errors.description ? { borderColor: 'var(--danger)' } : {}}
            />
            {errors.description && <p className="error-text">{errors.description}</p>}
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label" htmlFor="task-priority">Priority</label>
              <select id="task-priority" className="input" value={form.priority} onChange={set('priority')}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label" htmlFor="task-due">Due Date</label>
              <input id="task-due" type="date" className="input" value={form.dueDate} onChange={set('dueDate')} />
            </div>
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <Link href="/dashboard" className="btn btn-outline">Cancel</Link>
            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
