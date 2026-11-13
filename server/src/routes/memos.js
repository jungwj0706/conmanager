const express = require('express');
const pool = require('../db');
const { authRequired } = require('../middleware/auth');
const HttpError = require('../httpError');

const router = express.Router();

async function findOwnedMemo(id, userId) {
  const [rows] = await pool.query(
    `SELECT m.*, mc.user_id
     FROM memos m
     JOIN my_contests mc ON m.my_contest_id = mc.id
     WHERE m.id = ?`,
    [id]
  );
  if (rows.length === 0) {
    throw new HttpError(404, '메모를 찾을 수 없습니다.');
  }
  if (rows[0].user_id !== userId) {
    throw new HttpError(403, '본인의 메모만 변경할 수 있습니다.');
  }
  return rows[0];
}

router.put('/:id', authRequired, async (req, res, next) => {
  try {
    await findOwnedMemo(req.params.id, req.user.id);
    const content = req.body?.content == null ? '' : String(req.body.content).trim();
    if (!content) throw new HttpError(400, '메모 내용을 입력하세요.');
    await pool.query('UPDATE memos SET content = ? WHERE id = ?', [content, req.params.id]);
    const [rows] = await pool.query('SELECT * FROM memos WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authRequired, async (req, res, next) => {
  try {
    await findOwnedMemo(req.params.id, req.user.id);
    await pool.query('DELETE FROM memos WHERE id = ?', [req.params.id]);
    res.json({ message: '메모를 삭제했습니다.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
