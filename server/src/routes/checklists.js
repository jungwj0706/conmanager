const express = require('express');
const pool = require('../db');
const { authRequired } = require('../middleware/auth');
const HttpError = require('../httpError');

const router = express.Router();

async function findOwnedChecklist(id, userId) {
  const [rows] = await pool.query(
    `SELECT cl.*, mc.user_id
     FROM checklists cl
     JOIN my_contests mc ON cl.my_contest_id = mc.id
     WHERE cl.id = ?`,
    [id]
  );
  if (rows.length === 0) {
    throw new HttpError(404, '체크리스트를 찾을 수 없습니다.');
  }
  if (rows[0].user_id !== userId) {
    throw new HttpError(403, '본인의 체크리스트만 변경할 수 있습니다.');
  }
  return rows[0];
}

router.patch('/:id/toggle', authRequired, async (req, res, next) => {
  try {
    const row = await findOwnedChecklist(req.params.id, req.user.id);
    await pool.query('UPDATE checklists SET is_done = ? WHERE id = ?', [row.is_done ? 0 : 1, req.params.id]);
    const [updated] = await pool.query('SELECT * FROM checklists WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authRequired, async (req, res, next) => {
  try {
    await findOwnedChecklist(req.params.id, req.user.id);
    await pool.query('DELETE FROM checklists WHERE id = ?', [req.params.id]);
    res.json({ message: '체크리스트 항목을 삭제했습니다.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
