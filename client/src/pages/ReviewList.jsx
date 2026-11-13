import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import ReviewCard from '../components/ReviewCard';

export default function ReviewList() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const { data } = await api.get('/reviews');
        if (!ignore) setItems(data);
      } catch (err) {
        if (!ignore) setError(err.response?.data?.message || '후기를 불러오지 못했습니다.');
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
      <div className="page-head">
        <div>
          <h1>참가 후기</h1>
          <p>작성자 닉네임과 대회명이 함께 보이는 후기 목록입니다.</p>
        </div>
        {user && (
          <Link to="/reviews/new" className="btn btn-primary">
            후기 작성
          </Link>
        )}
      </div>
      {loading && <p className="loading">불러오는 중...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && items.length === 0 && <p className="empty">아직 작성된 후기가 없습니다.</p>}
      <div className="card-list">
        {items.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </div>
  );
}
