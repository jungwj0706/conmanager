import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';

const CATEGORIES = ['해커톤', '공모전', '경진대회', '아이디어 공모', '기타'];

const EMPTY = {
  title: '',
  organizer: '',
  category: '공모전',
  url: '',
  apply_end_date: '',
  event_start: '',
  event_end: '',
  location: '',
  fee: 0,
  description: '',
};

export default function ContestForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (!isEdit) return;
    let ignore = false;
    (async () => {
      try {
        const { data } = await api.get(`/contests/${id}`);
        if (ignore) return;
        setForm({
          title: data.title || '',
          organizer: data.organizer || '',
          category: data.category || '공모전',
          url: data.url || '',
          apply_end_date: data.apply_end_date || '',
          event_start: data.event_start || '',
          event_end: data.event_end || '',
          location: data.location || '',
          fee: data.fee ?? 0,
          description: data.description || '',
        });
      } catch (err) {
        if (!ignore) setError(err.response?.data?.message || '글을 불러오지 못했습니다.');
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
      if (isEdit) {
        await api.put(`/contests/${id}`, form);
        navigate(`/contests/${id}`);
      } else {
        const { data } = await api.post('/contests', form);
        navigate(`/contests/${data.id}`);
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
          <h1>{isEdit ? '대회 정보 수정' : '대회 정보 등록'}</h1>
          <p>발견한 대회 공고의 일정과 참가 정보를 공유합니다.</p>
        </div>
      </div>
      <form className="form wide card" onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="title">대회명</label>
          <input id="title" name="title" value={form.title} onChange={onChange} required />
        </div>
        <div className="grid-2">
          <div className="field">
            <label htmlFor="organizer">주최</label>
            <input id="organizer" name="organizer" value={form.organizer} onChange={onChange} />
          </div>
          <div className="field">
            <label htmlFor="category">카테고리</label>
            <select id="category" name="category" value={form.category} onChange={onChange}>
              {CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid-2">
          <div className="field">
            <label htmlFor="location">장소</label>
            <input id="location" name="location" value={form.location} onChange={onChange} />
          </div>
          <div className="field">
            <label htmlFor="fee">참가비(원)</label>
            <input id="fee" name="fee" type="number" min="0" value={form.fee} onChange={onChange} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="url">링크</label>
          <input id="url" name="url" value={form.url} onChange={onChange} />
        </div>
        <div className="grid-2">
          <div className="field">
            <label htmlFor="apply_end_date">접수 마감</label>
            <input id="apply_end_date" name="apply_end_date" type="date" value={form.apply_end_date} onChange={onChange} />
          </div>
          <div className="field">
            <label htmlFor="event_start">행사 시작</label>
            <input id="event_start" name="event_start" type="date" value={form.event_start} onChange={onChange} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="event_end">행사 종료</label>
          <input id="event_end" name="event_end" type="date" value={form.event_end} onChange={onChange} />
        </div>
        <div className="field">
          <label htmlFor="description">설명</label>
          <textarea id="description" name="description" value={form.description} onChange={onChange} />
        </div>
        {error && <p className="error">{error}</p>}
        <button className="btn btn-primary" type="submit">
          {isEdit ? '수정하기' : '등록하기'}
        </button>
      </form>
    </div>
  );
}
