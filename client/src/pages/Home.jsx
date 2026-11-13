import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import ContestCard from '../components/ContestCard';
import ReviewCard from '../components/ReviewCard';
import { STATUS_LABEL } from '../format';

function ScheduleList({ items, empty }) {
  if (items.length === 0) return <p className="empty">{empty}</p>;
  return (
    <div className="card-list">
      {items.map((item) => (
        <Link key={item.id} to={`/my-contests/${item.my_contest_id}`} className="card">
          <strong>{item.title}</strong>
          <p className="muted" style={{ margin: '6px 0 0' }}>
            {item.my_contest_title} · {item.due_date}
          </p>
        </Link>
      ))}
    </div>
  );
}

function PublicHome({ contests, reviews, loading, error }) {
  return (
    <>
      <section>
        <div className="page-head">
          <h2 style={{ fontFamily: 'var(--serif)', margin: 0 }}>최신 대회 정보</h2>
          <Link to="/contests">전체 보기</Link>
        </div>
        {loading && <p className="loading">불러오는 중...</p>}
        {error && <p className="error">{error}</p>}
        {!loading && !error && contests.length === 0 && <p className="empty">아직 등록된 대회 정보가 없습니다.</p>}
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
        {!loading && !error && reviews.length === 0 && <p className="empty">아직 작성된 후기가 없습니다.</p>}
        <div className="card-list">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      </section>
    </>
  );
}

export default function Home() {
  const { user } = useAuth();
  const [contests, setContests] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [dash, setDash] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        if (user) {
          const { data } = await api.get('/home');
          if (!ignore) setDash(data);
        } else {
          const [{ data: contestRows }, { data: reviewRows }] = await Promise.all([
            api.get('/contests'),
            api.get('/reviews'),
          ]);
          if (ignore) return;
          setContests(contestRows.slice(0, 4));
          setReviews(reviewRows.slice(0, 4));
        }
      } catch (err) {
        if (!ignore) {
          setContests([]);
          setReviews([]);
          setDash(null);
          setError(err.response?.data?.message || '목록을 불러오지 못했습니다.');
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [user]);

  return (
    <div className="page">
      <section className="hero">
        <p className="eyebrow">대회 운영 데스크</p>
        <h1>{user ? `${user.nickname}님의 오늘` : '대회의 모든 도전을 한곳에서'}</h1>
        <p className="lede">
          {user
            ? '오늘 할 일, 마감 임박, 이번 주 일정을 한눈에 봅니다.'
            : '공모전, 해커톤, 경진 대회의 일정과 준비물, 참가 후기를 흩어지지 않게 모읍니다.'}
        </p>
        <div className="hero-actions">
          <Link to={user ? '/my-contests' : '/contests'} className="btn btn-primary">
            {user ? '내 대회 보기' : '대회 정보 보기'}
          </Link>
          {!user && (
            <Link to="/signup" className="btn btn-ghost">
              회원가입
            </Link>
          )}
        </div>
      </section>

      {user ? (
        <>
          {loading && <p className="loading">불러오는 중...</p>}
          {error && <p className="error">{error}</p>}
          {dash && (
            <>
              <div className="dash-grid">
                {['interest', 'planned', 'ongoing', 'done'].map((key) => (
                  <div className="stat" key={key}>
                    {STATUS_LABEL[key]}
                    <b>{dash.statusCounts[key]}</b>
                  </div>
                ))}
              </div>
              <section>
                <h2 style={{ fontFamily: 'var(--serif)' }}>오늘 해야 할 것</h2>
                <ScheduleList items={dash.today} empty="오늘 예정된 일정이 없습니다." />
              </section>
              <section style={{ marginTop: 28 }}>
                <h2 style={{ fontFamily: 'var(--serif)' }}>마감 임박 (7일 이내)</h2>
                <ScheduleList items={dash.upcoming} empty="7일 이내 마감 일정이 없습니다." />
              </section>
              <section style={{ marginTop: 28 }}>
                <h2 style={{ fontFamily: 'var(--serif)' }}>이번 주 일정</h2>
                <ScheduleList items={dash.thisWeek} empty="이번 주 일정이 없습니다." />
              </section>
            </>
          )}
        </>
      ) : (
        <PublicHome contests={contests} reviews={reviews} loading={loading} error={error} />
      )}
    </div>
  );
}
