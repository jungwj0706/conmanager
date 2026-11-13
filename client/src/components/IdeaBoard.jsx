import { useState } from 'react';
import api from '../api';

const EMPTY = {
  title: '',
  problem: '',
  solution: '',
  features: '',
  tech_stack: '',
  effect: '',
  ref_link: '',
};

export default function IdeaBoard({ item, onChanged, onError }) {
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);

  const onChange = (e, setter) => {
    setter((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const add = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/my-contests/${item.id}/ideas`, form);
      setForm(EMPTY);
      await onChanged();
    } catch (err) {
      onError(err.response?.data?.message || '아이디어 추가에 실패했습니다.');
    }
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/ideas/${editing.id}`, editing);
      setEditing(null);
      await onChanged();
    } catch (err) {
      onError(err.response?.data?.message || '아이디어 수정에 실패했습니다.');
    }
  };

  const setFinal = async (id) => {
    try {
      await api.patch(`/ideas/${id}/final`);
      await onChanged();
    } catch (err) {
      onError(err.response?.data?.message || '최종 선정에 실패했습니다.');
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/ideas/${id}`);
      await onChanged();
    } catch (err) {
      onError(err.response?.data?.message || '삭제에 실패했습니다.');
    }
  };

  const labels = {
    title: '제목',
    problem: '문제 정의',
    solution: '해결 방법',
    features: '핵심 기능',
    tech_stack: '기술 스택',
    effect: '기대 효과',
    ref_link: '참고 링크',
  };

  return (
    <section>
      <p className="muted">출품 아이템을 여러 개 적어 비교하고, 최종 아이디어 1개를 고릅니다.</p>
      {item.ideas.length === 0 && <p className="empty">아직 아이디어가 없습니다.</p>}
      <div className="card-list">
        {item.ideas.map((idea) => (
          <div key={idea.id} className="card">
            {editing?.id === idea.id ? (
              <form className="form" onSubmit={save}>
                {['title', 'problem', 'solution', 'features', 'tech_stack', 'effect', 'ref_link'].map((key) => (
                  <div className="field" key={key}>
                    <label>{labels[key]}</label>
                    {['problem', 'solution', 'features', 'effect'].includes(key) ? (
                      <textarea name={key} value={editing[key] || ''} onChange={(e) => onChange(e, setEditing)} />
                    ) : (
                      <input
                        name={key}
                        value={editing[key] || ''}
                        onChange={(e) => onChange(e, setEditing)}
                        required={key === 'title'}
                      />
                    )}
                  </div>
                ))}
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
                <div className="meta">
                  {Boolean(idea.is_final) && <span className="badge badge-ok">최종</span>}
                </div>
                <h3 style={{ fontFamily: 'var(--serif)', marginTop: 8 }}>{idea.title}</h3>
                {idea.problem && <p>문제: {idea.problem}</p>}
                {idea.solution && <p>해결: {idea.solution}</p>}
                {idea.features && <p>기능: {idea.features}</p>}
                {idea.tech_stack && <p>스택: {idea.tech_stack}</p>}
                {idea.effect && <p>효과: {idea.effect}</p>}
                {idea.ref_link && (
                  <p>
                    <a href={idea.ref_link} target="_blank" rel="noreferrer">
                      {idea.ref_link}
                    </a>
                  </p>
                )}
                <div className="toolbar">
                  {!idea.is_final && (
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => setFinal(idea.id)}>
                      최종 선정
                    </button>
                  )}
                  <button type="button" className="btn btn-navy btn-sm" onClick={() => setEditing(idea)}>
                    수정
                  </button>
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => remove(idea.id)}>
                    삭제
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
      <form className="form card" onSubmit={add} style={{ marginTop: 16 }}>
        <h3>아이디어 추가</h3>
        <div className="field">
          <label>제목</label>
          <input name="title" value={form.title} onChange={(e) => onChange(e, setForm)} required />
        </div>
        <div className="field">
          <label>문제 정의</label>
          <textarea name="problem" value={form.problem} onChange={(e) => onChange(e, setForm)} />
        </div>
        <div className="field">
          <label>해결 방법</label>
          <textarea name="solution" value={form.solution} onChange={(e) => onChange(e, setForm)} />
        </div>
        <div className="field">
          <label>핵심 기능</label>
          <textarea name="features" value={form.features} onChange={(e) => onChange(e, setForm)} />
        </div>
        <div className="field">
          <label>기술 스택</label>
          <input name="tech_stack" value={form.tech_stack} onChange={(e) => onChange(e, setForm)} />
        </div>
        <div className="field">
          <label>기대 효과</label>
          <textarea name="effect" value={form.effect} onChange={(e) => onChange(e, setForm)} />
        </div>
        <div className="field">
          <label>참고 링크</label>
          <input name="ref_link" value={form.ref_link} onChange={(e) => onChange(e, setForm)} />
        </div>
        <button className="btn btn-primary" type="submit">
          추가
        </button>
      </form>
    </section>
  );
}
