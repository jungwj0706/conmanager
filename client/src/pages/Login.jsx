import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { loginSuccess } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      loginSuccess(data.token, data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>로그인</h1>
          <p>가입한 이메일과 비밀번호로 들어옵니다.</p>
        </div>
      </div>
      <form className="form card" onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="email">이메일</label>
          <input id="email" name="email" type="email" value={form.email} onChange={onChange} required />
        </div>
        <div className="field">
          <label htmlFor="password">비밀번호</label>
          <input id="password" name="password" type="password" value={form.password} onChange={onChange} required />
        </div>
        {error && <p className="error">{error}</p>}
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? '확인 중...' : '로그인'}
        </button>
        <p className="muted">
          계정이 없으면 <Link to="/signup">회원가입</Link>
        </p>
      </form>
    </div>
  );
}
