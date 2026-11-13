import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

const RESULT_LABEL = {
  none: '참가',
  finalist: '결선',
  award: '수상',
};

export default function ReviewDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [review, setReview] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const { data } = await api.get(`/reviews/${id}`);
        if (!ignore) setReview(data);
      } catch (err) {
        if (!ignore) setError(err.response?.data?.message || '후기를 불러오지 못했습니다.');
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
      await api.delete(`/reviews/${id}`);
      navigate('/reviews');
    } catch (err) {
      setError(err.response?.data?.message || '삭제에 실패했습니다.');
      setConfirmOpen(false);
    }
  };

  if (loading) return <p className="loading">불러오는 중...</p>;
  if (error && !review) return <p className="error">{error}</p>;

  const mine = user && review && user.id === review.user_id;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="meta">
            <span className="badge">{RESULT_LABEL[review.result] || review.result}</span>
            <span>난이도 {review.difficulty}/5</span>
            <span>작성자 {review.nickname}</span>
          </div>
          <h1>{review.title}</h1>
          <p>
            대회 <Link to={`/contests/${review.contest_id}`}>{review.contest_title}</Link>
          </p>
        </div>
        {mine && (
          <div className="toolbar">
            <Link to={`/reviews/${id}/edit`} className="btn btn-navy">
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
          {review.prep_period && <span>준비 기간 {review.prep_period}</span>}
          {review.team_size && <span>팀 규모 {review.team_size}명</span>}
        </div>
        {review.prep_process && (
          <>
            <h3>준비 과정</h3>
            <p style={{ whiteSpace: 'pre-wrap' }}>{review.prep_process}</p>
          </>
        )}
        {review.cautions && (
          <>
            <h3>유의사항</h3>
            <p style={{ whiteSpace: 'pre-wrap' }}>{review.cautions}</p>
          </>
        )}
        {review.tips && (
          <>
            <h3>수상 팁</h3>
            <p style={{ whiteSpace: 'pre-wrap' }}>{review.tips}</p>
          </>
        )}
      </section>

      {error && <p className="error">{error}</p>}

      {confirmOpen && (
        <Modal title="후기 삭제" onClose={() => setConfirmOpen(false)}>
          <p>이 후기를 삭제할까요?</p>
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
