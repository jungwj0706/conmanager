import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const { loginSuccess } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', nickname: '' });
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
      const { data } = await api.post('/auth/signup', form);
      loginSuccess(data.token, data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>회원가입</h1>
          <p>이메일, 비밀번호, 닉네임만 있으면 됩니다.</p>
        </div>
      </div>
      <form className="form card" onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="email">이메일</label>
          <input id="email" name="email" type="email" value={form.email} onChange={onChange} required />
        </div>
        <div className="field">
          <label htmlFor="password">비밀번호</label>
          <input id="password" name="password" type="password" minLength={4} value={form.password} onChange={onChange} required />
        </div>
        <div className="field">
          <label htmlFor="nickname">닉네임</label>
          <input id="nickname" name="nickname" value={form.nickname} onChange={onChange} required />
        </div>
        {error && <p className="error">{error}</p>}
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? '가입 중...' : '가입하기'}
        </button>
        <p className="muted">
          이미 계정이 있으면 <Link to="/login">로그인</Link>
        </p>
      </form>
    </div>
  );
}
