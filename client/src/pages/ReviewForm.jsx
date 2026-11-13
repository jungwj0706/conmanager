import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '../api';

const EMPTY = {
  contest_id: '',
  title: '',
  result: 'none',
  difficulty: 3,
  prep_period: '',
  team_size: '',
  prep_process: '',
  cautions: '',
  tips: '',
};

export default function ReviewForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    ...EMPTY,
    contest_id: searchParams.get('contestId') || '',
  });
  const [contests, setContests] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const { data: contestRows } = await api.get('/contests');
        if (!ignore) setContests(contestRows);
        if (isEdit) {
          const { data } = await api.get(`/reviews/${id}`);
          if (ignore) return;
          setForm({
            contest_id: String(data.contest_id),
            title: data.title || '',
            result: data.result || 'none',
            difficulty: data.difficulty || 3,
            prep_period: data.prep_period || '',
            team_size: data.team_size ?? '',
            prep_process: data.prep_process || '',
            cautions: data.cautions || '',
            tips: data.tips || '',
          });
        }
      } catch (err) {
        if (!ignore) setError(err.response?.data?.message || '후기를 불러오지 못했습니다.');
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [id, isEdit]);

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        ...form,
        contest_id: Number(form.contest_id),
        difficulty: Number(form.difficulty),
        team_size: form.team_size === '' ? null : Number(form.team_size),
      };
      if (isEdit) {
        await api.put(`/reviews/${id}`, payload);
        navigate(`/reviews/${id}`);
      } else {
        const { data } = await api.post('/reviews', payload);
        navigate(`/reviews/${data.id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || '저장에 실패했습니다.');
    }
  };

  if (loading) return <p className="loading">불러오는 중...</p>;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>{isEdit ? '후기 수정' : '후기 작성'}</h1>
          <p>난이도, 준비 과정, 수상 팁을 남겨 다음 참가자를 돕습니다.</p>
        </div>
      </div>
      <form className="form wide card" onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="contest_id">대회</label>
          <select id="contest_id" name="contest_id" value={form.contest_id} onChange={onChange} required>
            <option value="">대회를 선택하세요</option>
            {contests.map((contest) => (
              <option key={contest.id} value={contest.id}>
                {contest.title}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="title">제목</label>
          <input id="title" name="title" value={form.title} onChange={onChange} required />
        </div>
        <div className="grid-2">
          <div className="field">
            <label htmlFor="result">결과</label>
            <select id="result" name="result" value={form.result} onChange={onChange}>
              <option value="none">참가</option>
              <option value="finalist">결선</option>
              <option value="award">수상</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="difficulty">난이도 (1~5)</label>
            <input
              id="difficulty"
              name="difficulty"
              type="number"
              min="1"
              max="5"
              value={form.difficulty}
              onChange={onChange}
              required
            />
          </div>
        </div>
        <div className="grid-2">
          <div className="field">
            <label htmlFor="prep_period">준비 기간</label>
            <input id="prep_period" name="prep_period" value={form.prep_period} onChange={onChange} />
          </div>
          <div className="field">
            <label htmlFor="team_size">팀 규모</label>
            <input id="team_size" name="team_size" type="number" min="1" value={form.team_size} onChange={onChange} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="prep_process">준비 과정</label>
          <textarea id="prep_process" name="prep_process" value={form.prep_process} onChange={onChange} />
        </div>
        <div className="field">
          <label htmlFor="cautions">유의사항</label>
          <textarea id="cautions" name="cautions" value={form.cautions} onChange={onChange} />
        </div>
        <div className="field">
          <label htmlFor="tips">수상 팁</label>
          <textarea id="tips" name="tips" value={form.tips} onChange={onChange} />
        </div>
        {error && <p className="error">{error}</p>}
        <button className="btn btn-primary" type="submit">
          {isEdit ? '수정하기' : '등록하기'}
        </button>
      </form>
    </div>
  );
}
