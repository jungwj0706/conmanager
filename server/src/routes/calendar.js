const express = require('express');
const pool = require('../db');
const { authRequired } = require('../middleware/auth');
const HttpError = require('../httpError');

const router = express.Router();

router.get('/', authRequired, async (req, res, next) => {
  try {
    const month = String(req.query.month || '').trim();
    if (!/^\d{4}-\d{2}$/.test(month)) {
      throw new HttpError(400, 'month는 YYYY-MM 형식이어야 합니다.');
    }

    const start = `${month}-01`;
    const [[endRow]] = await pool.query('SELECT DATE_ADD(?, INTERVAL 1 MONTH) AS nextMonth', [start]);
    const nextMonth = endRow.nextMonth;

    const [rows] = await pool.query(
      `SELECT s.id, s.title, s.due_date, mc.id AS my_contest_id, mc.title AS my_contest_title
       FROM schedules s
       JOIN my_contests mc ON s.my_contest_id = mc.id
       WHERE mc.user_id = ? AND s.due_date >= ? AND s.due_date < ?
       ORDER BY s.due_date ASC, s.id ASC`,
      [req.user.id, start, nextMonth]
    );

    const byDate = new Map();
    for (const row of rows) {
      const date = row.due_date;
      if (!byDate.has(date)) byDate.set(date, []);
      byDate.get(date).push(row);
    }

    // 같은 날 일정이 2개 이상이면 충돌로 표시함
    const days = [...byDate.entries()].map(([date, schedules]) => ({
      date,
      conflict: schedules.length > 1,
      schedules,
    }));

    res.json({ month, days });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
