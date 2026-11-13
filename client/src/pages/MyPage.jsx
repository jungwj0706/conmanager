import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

export default function MyPage() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ nickname: '', currentPassword: '', newPassword: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawPassword, setWithdrawPassword] = useState('');

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const { data } = await api.get('/users/me');
        if (ignore) return;
        setProfile(data);
        setForm((prev) => ({ ...prev, nickname: data.nickname }));
      } catch (err) {
        if (!ignore) setError(err.response?.data?.message || '프로필을 불러오지 못했습니다.');
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const payload = { nickname: form.nickname };
      if (form.newPassword) {
        payload.currentPassword = form.currentPassword;
        payload.newPassword = form.newPassword;
      }
      const { data } = await api.put('/users/me', payload);
      setProfile(data);
      setUser({ ...user, nickname: data.nickname, email: data.email, id: data.id });
      localStorage.setItem(
        'user',
        JSON.stringify({ id: data.id, email: data.email, nickname: data.nickname })
      );
      setForm((prev) => ({ ...prev, currentPassword: '', newPassword: '' }));
      setMessage('프로필이 저장되었습니다.');
    } catch (err) {
      setError(err.response?.data?.message || '저장에 실패했습니다.');
    }
  };

  const onWithdraw = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.delete('/users/me', { data: { password: withdrawPassword } });
      logout();
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || '탈퇴에 실패했습니다.');
    }
  };

  if (loading) return <p className="loading">불러오는 중...</p>;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>마이페이지</h1>
          <p>프로필을 확인하고 닉네임·비밀번호를 바꿀 수 있습니다.</p>
        </div>
      </div>

      <form className="form card" onSubmit={onSubmit}>
        <div className="field">
          <label>이메일</label>
          <input value={profile?.email || ''} disabled />
        </div>
        <div className="field">
          <label htmlFor="nickname">닉네임</label>
          <input id="nickname" name="nickname" value={form.nickname} onChange={onChange} required />
        </div>
        <div className="field">
          <label htmlFor="currentPassword">현재 비밀번호</label>
          <input
            id="currentPassword"
            name="currentPassword"
            type="password"
            value={form.currentPassword}
            onChange={onChange}
          />
        </div>
        <div className="field">
          <label htmlFor="newPassword">새 비밀번호</label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            minLength={4}
            value={form.newPassword}
            onChange={onChange}
          />
        </div>
        {message && <p className="muted">{message}</p>}
        {error && <p className="error">{error}</p>}
        <div className="toolbar">
          <button className="btn btn-primary" type="submit">
            저장
          </button>
          <button className="btn btn-danger" type="button" onClick={() => setWithdrawOpen(true)}>
            회원 탈퇴
          </button>
        </div>
      </form>

      {withdrawOpen && (
        <Modal title="회원 탈퇴" onClose={() => setWithdrawOpen(false)}>
          <p>탈퇴하면 작성한 글과 내 대회 기록이 모두 삭제됩니다. 비밀번호를 입력해 확인하세요.</p>
          <form onSubmit={onWithdraw}>
            <div className="field">
              <label htmlFor="withdrawPassword">비밀번호</label>
              <input
                id="withdrawPassword"
                type="password"
                value={withdrawPassword}
                onChange={(e) => setWithdrawPassword(e.target.value)}
                required
              />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setWithdrawOpen(false)}>
                취소
              </button>
              <button type="submit" className="btn btn-danger">
                탈퇴하기
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
