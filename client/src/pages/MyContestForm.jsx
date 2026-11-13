import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Modal from '../components/Modal';

const EMPTY_SCHEDULE = { title: '', due_date: '' };

export default function MyContestForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    organizer: '',
    location: '',
    fee: 0,
    url: '',
  });
  const [schedules, setSchedules] = useState([{ ...EMPTY_SCHEDULE }]);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const changeSchedule = (index, key, value) => {
    setSchedules((prev) => prev.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    setError('');
    setModalOpen(true);
  };

  const save = async (participate) => {
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        participate,
        schedules: schedules.filter((item) => item.title && item.due_date),
      };
      const { data } = await api.post('/my-contests', payload);
      navigate(`/my-contests/${data.id}`);
    } catch (err) {
      setError(err.response?.data?.message || '등록에 실패했습니다.');
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>내 대회 등록</h1>
          <p>일정은 예선, 본선처럼 여러 개를 넣을 수 있습니다.</p>
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
            <label htmlFor="location">장소</label>
            <input id="location" name="location" value={form.location} onChange={onChange} />
          </div>
        </div>
        <div className="grid-2">
          <div className="field">
            <label htmlFor="fee">참가비(원)</label>
            <input id="fee" name="fee" type="number" min="0" value={form.fee} onChange={onChange} />
          </div>
          <div className="field">
            <label htmlFor="url">링크</label>
            <input id="url" name="url" value={form.url} onChange={onChange} />
          </div>
        </div>

        <h3>일정</h3>
        {schedules.map((item, index) => (
          <div className="grid-2" key={index}>
            <div className="field">
              <label>일정 이름</label>
              <input
                value={item.title}
                onChange={(e) => changeSchedule(index, 'title', e.target.value)}
                placeholder="예선, 본선"
              />
            </div>
            <div className="field">
              <label>날짜</label>
              <input
                type="date"
                value={item.due_date}
                onChange={(e) => changeSchedule(index, 'due_date', e.target.value)}
              />
            </div>
          </div>
        ))}
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setSchedules((prev) => [...prev, { ...EMPTY_SCHEDULE }])}
        >
          일정 추가
        </button>

        {error && <p className="error">{error}</p>}
        <button className="btn btn-primary" type="submit">
          등록하기
        </button>
      </form>

      {modalOpen && (
        <Modal title="이 대회에 참가하실 건가요?" onClose={() => setModalOpen(false)}>
          <p>참가하면 일정을 기준으로 참가 예정 또는 진행 중으로 분류합니다. 고민 중이면 관심으로 둡니다.</p>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" disabled={saving} onClick={() => save(false)}>
              고민 중이에요
            </button>
            <button type="button" className="btn btn-primary" disabled={saving} onClick={() => save(true)}>
              참가할 거에요
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
