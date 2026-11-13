import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일'];

function toMonth(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function shiftMonth(month, diff) {
  const [year, mon] = month.split('-').map(Number);
  const date = new Date(year, mon - 1 + diff, 1);
  return toMonth(date);
}

function buildCells(month, days) {
  const [year, mon] = month.split('-').map(Number);
  const first = new Date(year, mon - 1, 1);
  const lastDate = new Date(year, mon, 0).getDate();
  const mondayIndex = (first.getDay() + 6) % 7;
  const map = new Map(days.map((day) => [day.date, day]));
  const cells = [];

  for (let i = 0; i < mondayIndex; i += 1) {
    cells.push(null);
  }
  for (let date = 1; date <= lastDate; date += 1) {
    const key = `${month}-${String(date).padStart(2, '0')}`;
    cells.push({ date, key, info: map.get(key) || null });
  }
  return cells;
}

export default function Calendar() {
  const [month, setMonth] = useState(() => toMonth(new Date()));
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get('/calendar', { params: { month } });
        if (!ignore) setDays(data.days || []);
      } catch (err) {
        if (!ignore) setError(err.response?.data?.message || '캘린더를 불러오지 못했습니다.');
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [month]);

  const cells = useMemo(() => buildCells(month, days), [month, days]);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>월간 캘린더</h1>
          <p>같은 날 일정이 겹치면 빨간 테두리로 충돌을 표시합니다.</p>
        </div>
        <div className="toolbar">
          <button type="button" className="btn btn-ghost" onClick={() => setMonth((prev) => shiftMonth(prev, -1))}>
            이전 달
          </button>
          <strong>{month}</strong>
          <button type="button" className="btn btn-ghost" onClick={() => setMonth((prev) => shiftMonth(prev, 1))}>
            다음 달
          </button>
        </div>
      </div>

      {loading && <p className="loading">불러오는 중...</p>}
      {error && <p className="error">{error}</p>}

      <div className="cal-grid">
        {WEEKDAYS.map((day) => (
          <div key={day} className="cal-head">
            {day}
          </div>
        ))}
        {cells.map((cell, index) =>
          cell ? (
            <div key={cell.key} className={`cal-cell ${cell.info?.conflict ? 'conflict' : ''}`}>
              <strong>
                {cell.date}
                {cell.info?.conflict && <span className="badge badge-danger">충돌</span>}
              </strong>
              {cell.info?.schedules.map((schedule) => (
                <Link
                  key={schedule.id}
                  className="cal-item"
                  to={`/my-contests/${schedule.my_contest_id}`}
                  title={`${schedule.my_contest_title} · ${schedule.title}`}
                >
                  {schedule.title}
                </Link>
              ))}
            </div>
          ) : (
            <div key={`empty-${index}`} className="cal-cell" style={{ visibility: 'hidden' }} />
          )
        )}
      </div>
    </div>
  );
}
