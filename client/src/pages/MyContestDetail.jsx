import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import Modal from '../components/Modal';
import { STATUS_BADGE, STATUS_LABEL, formatDday } from '../format';

const STATUSES = ['interest', 'planned', 'ongoing', 'done'];

export default function MyContestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({ title: '', due_date: '' });
  const [editing, setEditing] = useState(null);

  const load = async () => {
    const { data } = await api.get(`/my-contests/${id}`);
    setItem(data);
  };

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const { data } = await api.get(`/my-contests/${id}`);
        if (!ignore) setItem(data);
      } catch (err) {
        if (!ignore) setError(err.response?.data?.message || '내 대회를 불러오지 못했습니다.');
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [id]);

  const changeStatus = async (status) => {
    try {
      const { data } = await api.put(`/my-contests/${id}`, { ...item, status });
      setItem(data);
    } catch (err) {
      setError(err.response?.data?.message || '상태 변경에 실패했습니다.');
    }
  };

  const addSchedule = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/my-contests/${id}/schedules`, scheduleForm);
      setScheduleForm({ title: '', due_date: '' });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || '일정 추가에 실패했습니다.');
    }
  };

  const saveSchedule = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/schedules/${editing.id}`, editing);
      setEditing(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || '일정 수정에 실패했습니다.');
    }
  };

  const deleteSchedule = async (scheduleId) => {
    try {
      await api.delete(`/schedules/${scheduleId}`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || '일정 삭제에 실패했습니다.');
    }
  };

  const onDelete = async () => {
    try {
      await api.delete(`/my-contests/${id}`);
      navigate('/my-contests');
    } catch (err) {
      setError(err.response?.data?.message || '삭제에 실패했습니다.');
      setConfirmOpen(false);
    }
  };

  if (loading) return <p className="loading">불러오는 중...</p>;
  if (error && !item) return <p className="error">{error}</p>;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="meta">
            <span className={`badge ${STATUS_BADGE[item.status]}`}>{STATUS_LABEL[item.status]}</span>
            <span className="badge">{formatDday(item.dday)}</span>
          </div>
          <h1>{item.title}</h1>
        </div>
        <button type="button" className="btn btn-danger" onClick={() => setConfirmOpen(true)}>
          삭제
        </button>
      </div>

      <section className="card">
        <div className="meta">
          {item.organizer && <span>주최 {item.organizer}</span>}
          {item.location && <span>장소 {item.location}</span>}
          <span>참가비 {item.fee ? `${Number(item.fee).toLocaleString()}원` : '무료'}</span>
        </div>
        {item.url && (
          <p>
            <a href={item.url} target="_blank" rel="noreferrer">
              {item.url}
            </a>
          </p>
        )}
        <div className="field" style={{ marginTop: 16 }}>
          <label htmlFor="status">진행 상태</label>
          <select id="status" value={item.status} onChange={(e) => changeStatus(e.target.value)}>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABEL[status]}
              </option>
            ))}
          </select>
        </div>
        {item.status === 'done' && item.source_contest_id && (
          <p style={{ marginTop: 16 }}>
            <Link to={`/reviews/new?contestId=${item.source_contest_id}`} className="btn btn-primary">
              후기 작성하기
            </Link>
          </p>
        )}
      </section>

      <section style={{ marginTop: 28 }}>
        <h2 style={{ fontFamily: 'var(--serif)' }}>일정</h2>
        {item.schedules.length === 0 && <p className="empty">아직 일정이 없습니다.</p>}
        <div className="card-list">
          {item.schedules.map((schedule) => (
            <div key={schedule.id} className="card">
              {editing?.id === schedule.id ? (
                <form className="grid-2" onSubmit={saveSchedule}>
                  <input
                    value={editing.title}
                    onChange={(e) => setEditing((prev) => ({ ...prev, title: e.target.value }))}
                    required
                  />
                  <input
                    type="date"
                    value={editing.due_date}
                    onChange={(e) => setEditing((prev) => ({ ...prev, due_date: e.target.value }))}
                    required
                  />
                  <button className="btn btn-primary" type="submit">
                    저장
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>
                    취소
                  </button>
                </form>
              ) : (
                <>
                  <strong>{schedule.title}</strong>
                  <p className="muted">{schedule.due_date}</p>
                  <div className="toolbar">
                    <button type="button" className="btn btn-navy btn-sm" onClick={() => setEditing(schedule)}>
                      수정
                    </button>
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => deleteSchedule(schedule.id)}>
                      삭제
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
        <form className="form card" onSubmit={addSchedule} style={{ marginTop: 16 }}>
          <div className="grid-2">
            <div className="field">
              <label>일정 이름</label>
              <input
                value={scheduleForm.title}
                onChange={(e) => setScheduleForm((prev) => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>
            <div className="field">
              <label>날짜</label>
              <input
                type="date"
                value={scheduleForm.due_date}
                onChange={(e) => setScheduleForm((prev) => ({ ...prev, due_date: e.target.value }))}
                required
              />
            </div>
          </div>
          <button className="btn btn-primary" type="submit">
            일정 추가
          </button>
        </form>
      </section>

      {error && <p className="error">{error}</p>}

      {confirmOpen && (
        <Modal title="내 대회 삭제" onClose={() => setConfirmOpen(false)}>
          <p>이 대회와 일정, 체크리스트, 아이디어, 메모가 모두 삭제됩니다.</p>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setConfirmOpen(false)}>
              취소
            </button>
            <button type="button" className="btn btn-danger" onClick={onDelete}>
              삭제
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
