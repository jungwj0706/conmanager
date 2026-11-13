import { useState } from 'react';
import api from '../api';

export default function ChecklistPanel({ item, onChanged, onError }) {
  const [form, setForm] = useState({ content: '', schedule_id: '' });

  const add = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/my-contests/${item.id}/checklists`, {
        content: form.content,
        schedule_id: form.schedule_id || null,
      });
      setForm({ content: '', schedule_id: '' });
      await onChanged();
    } catch (err) {
      onError(err.response?.data?.message || '체크리스트 추가에 실패했습니다.');
    }
  };

  const toggle = async (id) => {
    try {
      await api.patch(`/checklists/${id}/toggle`);
      await onChanged();
    } catch (err) {
      onError(err.response?.data?.message || '완료 상태 변경에 실패했습니다.');
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/checklists/${id}`);
      await onChanged();
    } catch (err) {
      onError(err.response?.data?.message || '삭제에 실패했습니다.');
    }
  };

  return (
    <section>
      {item.checklists.length === 0 && <p className="empty">아직 체크리스트가 없습니다.</p>}
      <div className="card-list">
        {item.checklists.map((row) => (
          <div key={row.id} className="card" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <input type="checkbox" checked={Boolean(row.is_done)} onChange={() => toggle(row.id)} />
            <div style={{ flex: 1 }}>
              <div style={{ textDecoration: row.is_done ? 'line-through' : 'none' }}>{row.content}</div>
              {row.schedule_id && (
                <p className="muted" style={{ margin: '4px 0 0' }}>
                  일정 {item.schedules.find((s) => s.id === row.schedule_id)?.title || ''}
                </p>
              )}
            </div>
            <button type="button" className="btn btn-danger btn-sm" onClick={() => remove(row.id)}>
              삭제
            </button>
          </div>
        ))}
      </div>
      <form className="form card" onSubmit={add} style={{ marginTop: 16 }}>
        <div className="field">
          <label>할 일</label>
          <input
            value={form.content}
            onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
            required
          />
        </div>
        <div className="field">
          <label>연결 일정(선택)</label>
          <select
            value={form.schedule_id}
            onChange={(e) => setForm((prev) => ({ ...prev, schedule_id: e.target.value }))}
          >
            <option value="">없음</option>
            {item.schedules.map((schedule) => (
              <option key={schedule.id} value={schedule.id}>
                {schedule.title} ({schedule.due_date})
              </option>
            ))}
          </select>
        </div>
        <button className="btn btn-primary" type="submit">
          추가
        </button>
      </form>
    </section>
  );
}
