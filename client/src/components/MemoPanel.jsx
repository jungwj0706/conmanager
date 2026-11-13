import { useState } from 'react';
import api from '../api';

export default function MemoPanel({ item, onChanged, onError }) {
  const [content, setContent] = useState('');
  const [editing, setEditing] = useState(null);

  const add = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/my-contests/${item.id}/memos`, { content });
      setContent('');
      await onChanged();
    } catch (err) {
      onError(err.response?.data?.message || '메모 추가에 실패했습니다.');
    }
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/memos/${editing.id}`, { content: editing.content });
      setEditing(null);
      await onChanged();
    } catch (err) {
      onError(err.response?.data?.message || '메모 수정에 실패했습니다.');
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/memos/${id}`);
      await onChanged();
    } catch (err) {
      onError(err.response?.data?.message || '삭제에 실패했습니다.');
    }
  };

  return (
    <section>
      <p className="muted">회의 내용, 참고 링크, 역할 분담 같은 기타 기록을 남깁니다.</p>
      {item.memos.length === 0 && <p className="empty">아직 메모가 없습니다.</p>}
      <div className="card-list">
        {item.memos.map((memo) => (
          <div key={memo.id} className="card">
            {editing?.id === memo.id ? (
              <form onSubmit={save}>
                <textarea
                  value={editing.content}
                  onChange={(e) => setEditing((prev) => ({ ...prev, content: e.target.value }))}
                  required
                />
                <div className="toolbar">
                  <button className="btn btn-primary" type="submit">
                    저장
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>
                    취소
                  </button>
                </div>
              </form>
            ) : (
              <>
                <p style={{ whiteSpace: 'pre-wrap' }}>{memo.content}</p>
                <p className="muted">{memo.created_at}</p>
                <div className="toolbar">
                  <button type="button" className="btn btn-navy btn-sm" onClick={() => setEditing(memo)}>
                    수정
                  </button>
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => remove(memo.id)}>
                    삭제
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
      <form className="form card" onSubmit={add} style={{ marginTop: 16 }}>
        <div className="field">
          <label>메모</label>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} required />
        </div>
        <button className="btn btn-primary" type="submit">
          추가
        </button>
      </form>
    </section>
  );
}
