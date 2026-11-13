import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { STATUS_BADGE, STATUS_LABEL, formatDday } from '../format';

const TABS = [
  { value: '', label: '전체' },
  { value: 'interest', label: '관심' },
  { value: 'planned', label: '참가 예정' },
  { value: 'ongoing', label: '진행 중' },
  { value: 'done', label: '완료' },
];

export default function MyContestList() {
  const [status, setStatus] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get('/my-contests', {
          params: status ? { status } : undefined,
        });
        if (!ignore) setItems(data);
      } catch (err) {
        if (!ignore) setError(err.response?.data?.message || '내 대회를 불러오지 못했습니다.');
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [status]);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>내 대회</h1>
          <p>참가 중인 대회의 일정과 상태를 비공개로 관리합니다.</p>
        </div>
        <Link to="/my-contests/new" className="btn btn-primary">
          내 대회 등록
        </Link>
      </div>

      <div className="tabs">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            className={`tab ${status === tab.value ? 'active' : ''}`}
            onClick={() => setStatus(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && <p className="loading">불러오는 중...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && items.length === 0 && <p className="empty">등록된 내 대회가 없습니다.</p>}
      <div className="card-list">
        {items.map((item) => (
          <Link key={item.id} to={`/my-contests/${item.id}`} className="card">
            <div className="meta">
              <span className={`badge ${STATUS_BADGE[item.status]}`}>{STATUS_LABEL[item.status]}</span>
              <span className="badge">{formatDday(item.dday)}</span>
            </div>
            <h3 style={{ margin: '10px 0 8px', fontFamily: 'var(--serif)' }}>{item.title}</h3>
            <div className="meta">
              {item.organizer && <span>주최 {item.organizer}</span>}
              {item.next_due && <span>다음 일정 {item.next_due}</span>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
