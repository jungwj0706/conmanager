import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import ContestCard from '../components/ContestCard';

const CATEGORIES = ['해커톤', '공모전', '경진대회', '아이디어 공모', '기타'];

export default function ContestList() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [category, setCategory] = useState('');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async (nextCategory = category, nextKeyword = keyword) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/contests', {
        params: {
          category: nextCategory || undefined,
          keyword: nextKeyword || undefined,
        },
      });
      setItems(data);
    } catch (err) {
      setError(err.response?.data?.message || '목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load('', '');
  }, []);

  const onSearch = (e) => {
    e.preventDefault();
    load(category, keyword);
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>대회 정보</h1>
          <p>사용자가 공유한 대회 공고를 모은 목록입니다. 등록자 닉네임이 함께 표시됩니다.</p>
        </div>
        {user && (
          <Link to="/contests/new" className="btn btn-primary">
            대회 등록
          </Link>
        )}
      </div>

      <form className="toolbar" onSubmit={onSearch}>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">전체 카테고리</option>
          {CATEGORIES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="대회명, 주최 검색"
        />
        <button className="btn btn-navy" type="submit">
          검색
        </button>
      </form>

      {loading && <p className="loading">불러오는 중...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && items.length === 0 && (
        <p className="empty">아직 등록된 대회 정보가 없습니다.</p>
      )}
      {!loading && items.length > 0 && (
        <div className="card-list" style={{ marginTop: 18 }}>
          {items.map((contest) => (
            <ContestCard key={contest.id} contest={contest} />
          ))}
        </div>
      )}
    </div>
  );
}
