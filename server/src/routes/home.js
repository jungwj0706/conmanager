const express = require('express');
const pool = require('../db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

const SCHEDULE_SQL = `
  SELECT s.*, mc.title AS my_contest_title, mc.id AS my_contest_id, mc.status
  FROM schedules s
  JOIN my_contests mc ON s.my_contest_id = mc.id
  WHERE mc.user_id = ?
`;

router.get('/', authRequired, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [today] = await pool.query(
      `${SCHEDULE_SQL} AND s.due_date = CURDATE() ORDER BY s.due_date ASC, s.id ASC`,
      [userId]
    );
    const [upcoming] = await pool.query(
      `${SCHEDULE_SQL} AND s.due_date > CURDATE() AND s.due_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
       ORDER BY s.due_date ASC, s.id ASC`,
      [userId]
    );
    const [thisWeek] = await pool.query(
      `${SCHEDULE_SQL} AND YEARWEEK(s.due_date, 1) = YEARWEEK(CURDATE(), 1)
       ORDER BY s.due_date ASC, s.id ASC`,
      [userId]
    );
    const [statusRows] = await pool.query(
      `SELECT status, COUNT(*) AS count
       FROM my_contests
       WHERE user_id = ?
       GROUP BY status`,
      [userId]
    );

    const statusCounts = { interest: 0, planned: 0, ongoing: 0, done: 0, total: 0 };
    for (const row of statusRows) {
      statusCounts[row.status] = Number(row.count);
      statusCounts.total += Number(row.count);
    }

    res.json({
      today,
      upcoming,
      thisWeek,
      statusCounts,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
