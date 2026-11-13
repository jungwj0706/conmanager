import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import ReviewCard from '../components/ReviewCard';

export default function ContestDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [contest, setContest] = useState(null);
  const [reviewData, setReviewData] = useState({ reviews: [], averageDifficulty: null });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const [{ data: contestRow }, { data: reviewRow }] = await Promise.all([
          api.get(`/contests/${id}`),
          api.get(`/contests/${id}/reviews`),
        ]);
        if (ignore) return;
        setContest(contestRow);
        setReviewData(reviewRow);
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
  const myReview = user && reviewData.reviews.find((item) => item.user_id === user.id);

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

      <section style={{ marginTop: 28 }}>
        <div className="page-head">
          <div>
            <h2 style={{ fontFamily: 'var(--serif)', margin: 0 }}>이 대회의 후기</h2>
            {reviewData.averageDifficulty != null && (
              <p>평균 난이도 {Number(reviewData.averageDifficulty).toFixed(1)} / 5</p>
            )}
          </div>
          {user && !myReview && (
            <Link to={`/reviews/new?contestId=${id}`} className="btn btn-primary">
              후기 작성
            </Link>
          )}
          {myReview && (
            <Link to={`/reviews/${myReview.id}`} className="btn btn-navy">
              내 후기 보기
            </Link>
          )}
        </div>
        {reviewData.reviews.length === 0 && <p className="empty">아직 이 대회의 후기가 없습니다.</p>}
        <div className="card-list">
          {reviewData.reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
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
