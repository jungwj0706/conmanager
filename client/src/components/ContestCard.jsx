import { Link } from 'react-router-dom';

export default function ContestCard({ contest }) {
  return (
    <Link to={`/contests/${contest.id}`} className="card">
      <div className="meta">
        {contest.category && <span className="badge">{contest.category}</span>}
        <span>등록자 {contest.nickname}</span>
      </div>
      <h3 style={{ margin: '10px 0 8px', fontFamily: 'var(--serif)' }}>{contest.title}</h3>
      <div className="meta">
        {contest.organizer && <span>주최 {contest.organizer}</span>}
        {contest.location && <span>장소 {contest.location}</span>}
        <span>참가비 {contest.fee ? `${contest.fee.toLocaleString()}원` : '무료'}</span>
        {contest.apply_end_date && <span>접수 마감 {contest.apply_end_date}</span>}
      </div>
    </Link>
  );
}
