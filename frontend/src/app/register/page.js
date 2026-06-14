'use client';

import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirm: z.string(),
}).refine(data => data.password === data.confirm, {
  message: 'Passwords do not match',
  path: ['confirm'],
});

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const validate = () => {
    const result = schema.safeParse({ email, password, confirm });
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
      await register(email, password);
    } catch (err) {
      const status = err.response?.status;
      if (status === 409) setServerError('An account with this email already exists.');
      else if (status === 400) setServerError(err.response?.data?.message || 'Invalid input.');
      else setServerError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="card auth-card">
        <h1 className="auth-title">Create an Account</h1>
        {serverError && (
          <div className="error-text" style={{ marginBottom: '1rem', textAlign: 'center', padding: '0.75rem', background: 'rgba(239,68,68,0.1)', borderRadius: 'var(--radius)' }}>
            {serverError}
          </div>
        )}
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
              type="email"
              className="input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={errors.email ? { borderColor: 'var(--danger)' } : {}}
            />
            {errors.email && <p className="error-text">{errors.email}</p>}
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">Password</label>
            <input
              id="reg-password"
              type="password"
              className="input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={errors.password ? { borderColor: 'var(--danger)' } : {}}
            />
            {errors.password && <p className="error-text">{errors.password}</p>}
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-confirm">Confirm Password</label>
            <input
              id="reg-confirm"
              type="password"
              className="input"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              style={errors.confirm ? { borderColor: 'var(--danger)' } : {}}
            />
            {errors.confirm && <p className="error-text">{errors.confirm}</p>}
          </div>
          <button type="submit" className="btn" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>
        <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: '#94a3b8' }}>
          Already have an account? <Link href="/login" style={{ color: 'var(--primary)' }}>Log in</Link>
        </p>
      </div>
    </div>
  );
}
