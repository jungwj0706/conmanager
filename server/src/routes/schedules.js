const express = require('express');
const pool = require('../db');
const { authRequired } = require('../middleware/auth');
const HttpError = require('../httpError');

const router = express.Router();

function emptyToNull(value) {
  if (value == null) return null;
  const text = String(value).trim();
  return text === '' ? null : text;
}

async function findOwnedSchedule(id, userId) {
  const [rows] = await pool.query(
    `SELECT s.*, mc.user_id
     FROM schedules s
     JOIN my_contests mc ON s.my_contest_id = mc.id
     WHERE s.id = ?`,
    [id]
  );
  if (rows.length === 0) {
    throw new HttpError(404, '일정을 찾을 수 없습니다.');
  }
  if (rows[0].user_id !== userId) {
    throw new HttpError(403, '본인의 일정만 수정·삭제할 수 있습니다.');
  }
  return rows[0];
}

router.put('/:id', authRequired, async (req, res, next) => {
  try {
    await findOwnedSchedule(req.params.id, req.user.id);
    const title = emptyToNull(req.body?.title);
    const dueDate = emptyToNull(req.body?.due_date);
    if (!title || !dueDate) {
      throw new HttpError(400, '일정의 이름과 날짜를 모두 입력하세요.');
    }
    await pool.query('UPDATE schedules SET title = ?, due_date = ? WHERE id = ?', [
      title,
      dueDate,
      req.params.id,
    ]);
    const [rows] = await pool.query('SELECT * FROM schedules WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authRequired, async (req, res, next) => {
  try {
    await findOwnedSchedule(req.params.id, req.user.id);
    await pool.query('DELETE FROM schedules WHERE id = ?', [req.params.id]);
    res.json({ message: '일정을 삭제했습니다.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
