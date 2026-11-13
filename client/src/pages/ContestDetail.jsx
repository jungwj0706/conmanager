import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

export default function ContestDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [contest, setContest] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const { data } = await api.get(`/contests/${id}`);
        if (!ignore) setContest(data);
      } catch (err) {
        if (!ignore) setError(err.response?.data?.message || '대회 정보를 불러오지 못했습니다.');
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [id]);

  const onDelete = async () => {
    try {
      await api.delete(`/contests/${id}`);
      navigate('/contests');
    } catch (err) {
      setError(err.response?.data?.message || '삭제에 실패했습니다.');
      setConfirmOpen(false);
    }
  };

  if (loading) return <p className="loading">불러오는 중...</p>;
  if (error && !contest) return <p className="error">{error}</p>;

  const mine = user && contest && user.id === contest.user_id;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="meta">
            {contest.category && <span className="badge">{contest.category}</span>}
            <span>등록자 {contest.nickname}</span>
          </div>
          <h1>{contest.title}</h1>
        </div>
        {mine && (
          <div className="toolbar">
            <Link to={`/contests/${id}/edit`} className="btn btn-navy">
              수정
            </Link>
            <button type="button" className="btn btn-danger" onClick={() => setConfirmOpen(true)}>
              삭제
            </button>
          </div>
        )}
      </div>

      <section className="card">
        <div className="meta">
          {contest.organizer && <span>주최 {contest.organizer}</span>}
          {contest.location && <span>장소 {contest.location}</span>}
          <span>참가비 {contest.fee ? `${Number(contest.fee).toLocaleString()}원` : '무료'}</span>
        </div>
        <div className="meta" style={{ marginTop: 12 }}>
          {contest.apply_end_date && <span>접수 마감 {contest.apply_end_date}</span>}
          {contest.event_start && <span>행사 시작 {contest.event_start}</span>}
          {contest.event_end && <span>행사 종료 {contest.event_end}</span>}
        </div>
        {contest.url && (
          <p style={{ marginTop: 16 }}>
            <a href={contest.url} target="_blank" rel="noreferrer">
              {contest.url}
            </a>
          </p>
        )}
        {contest.description && <p style={{ whiteSpace: 'pre-wrap' }}>{contest.description}</p>}
      </section>

      {error && <p className="error">{error}</p>}

      {confirmOpen && (
        <Modal title="대회 정보 삭제" onClose={() => setConfirmOpen(false)}>
          <p>이 대회 정보를 삭제할까요? 관련된 후기도 함께 삭제됩니다.</p>
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
