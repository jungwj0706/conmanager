import { Link } from 'react-router-dom';

const RESULT_LABEL = {
  none: '참가',
  finalist: '결선',
  award: '수상',
};

export default function ReviewCard({ review }) {
  return (
    <Link to={`/reviews/${review.id}`} className="card">
      <div className="meta">
        <span className="badge">{RESULT_LABEL[review.result] || review.result}</span>
        <span>난이도 {review.difficulty}/5</span>
        <span>작성자 {review.nickname}</span>
      </div>
      <h3 style={{ margin: '10px 0 8px', fontFamily: 'var(--serif)' }}>{review.title}</h3>
      <p className="muted" style={{ margin: 0 }}>
        대회 {review.contest_title}
      </p>
    </Link>
  );
}
