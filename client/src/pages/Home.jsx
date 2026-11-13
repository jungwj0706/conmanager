import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import ContestCard from '../components/ContestCard';
import ReviewCard from '../components/ReviewCard';

export default function Home() {
  const { user } = useAuth();
  const [contests, setContests] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const [{ data: contestRows }, { data: reviewRows }] = await Promise.all([
          api.get('/contests'),
          api.get('/reviews'),
        ]);
        if (ignore) return;
        setContests(contestRows.slice(0, 4));
        setReviews(reviewRows.slice(0, 4));
      } catch {
        if (!ignore) {
          setContests([]);
          setReviews([]);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="page">
      <section className="hero">
        <p className="eyebrow">대회 운영 데스크</p>
        <h1>대회의 모든 도전을 한곳에서</h1>
        <p className="lede">
          공모전, 해커톤, 경진 대회의 일정과 준비물, 참가 후기를 흩어지지 않게 모읍니다.
        </p>
        <div className="hero-actions">
          <Link to="/contests" className="btn btn-primary">
            대회 정보 보기
          </Link>
          {!user && (
            <Link to="/signup" className="btn btn-ghost">
              회원가입
            </Link>
          )}
        </div>
      </section>

      <section>
        <div className="page-head">
          <h2 style={{ fontFamily: 'var(--serif)', margin: 0 }}>최신 대회 정보</h2>
          <Link to="/contests">전체 보기</Link>
        </div>
        {loading && <p className="loading">불러오는 중...</p>}
        {!loading && contests.length === 0 && <p className="empty">아직 등록된 대회 정보가 없습니다.</p>}
        <div className="card-list">
          {contests.map((contest) => (
            <ContestCard key={contest.id} contest={contest} />
          ))}
        </div>
      </section>

      <section style={{ marginTop: 36 }}>
        <div className="page-head">
          <h2 style={{ fontFamily: 'var(--serif)', margin: 0 }}>최신 후기</h2>
          <Link to="/reviews">전체 보기</Link>
        </div>
        {!loading && reviews.length === 0 && <p className="empty">아직 작성된 후기가 없습니다.</p>}
        <div className="card-list">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      </section>
    </div>
  );
}
