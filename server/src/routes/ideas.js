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

function ideaPayload(body) {
  const title = emptyToNull(body.title);
  if (!title) throw new HttpError(400, '아이디어 제목을 입력하세요.');
  return {
    title,
    problem: emptyToNull(body.problem),
    solution: emptyToNull(body.solution),
    features: emptyToNull(body.features),
    tech_stack: emptyToNull(body.tech_stack),
    effect: emptyToNull(body.effect),
    ref_link: emptyToNull(body.ref_link),
  };
}

async function findOwnedIdea(id, userId) {
  const [rows] = await pool.query(
    `SELECT i.*, mc.user_id
     FROM ideas i
     JOIN my_contests mc ON i.my_contest_id = mc.id
     WHERE i.id = ?`,
    [id]
  );
  if (rows.length === 0) {
    throw new HttpError(404, '아이디어를 찾을 수 없습니다.');
  }
  if (rows[0].user_id !== userId) {
    throw new HttpError(403, '본인의 아이디어만 변경할 수 있습니다.');
  }
  return rows[0];
}

router.put('/:id', authRequired, async (req, res, next) => {
  try {
    await findOwnedIdea(req.params.id, req.user.id);
    const data = ideaPayload(req.body || {});
    await pool.query(
      `UPDATE ideas
       SET title = ?, problem = ?, solution = ?, features = ?, tech_stack = ?, effect = ?, ref_link = ?
       WHERE id = ?`,
      [data.title, data.problem, data.solution, data.features, data.tech_stack, data.effect, data.ref_link, req.params.id]
    );
    const [rows] = await pool.query('SELECT * FROM ideas WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/final', authRequired, async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const idea = await findOwnedIdea(req.params.id, req.user.id);
    await conn.beginTransaction();
    // 대회당 최종 아이디어는 1개만 유지함
    await conn.query('UPDATE ideas SET is_final = 0 WHERE my_contest_id = ?', [idea.my_contest_id]);
    await conn.query('UPDATE ideas SET is_final = 1 WHERE id = ?', [idea.id]);
    await conn.commit();
    const [rows] = await pool.query('SELECT * FROM ideas WHERE my_contest_id = ? ORDER BY is_final DESC, id DESC', [
      idea.my_contest_id,
    ]);
    res.json(rows);
  } catch (err) {
    try { await conn.rollback(); } catch { /* 트랜잭션 시작 전 오류일 수 있음 */ }
    next(err);
  } finally {
    conn.release();
  }
});

router.delete('/:id', authRequired, async (req, res, next) => {
  try {
    await findOwnedIdea(req.params.id, req.user.id);
    await pool.query('DELETE FROM ideas WHERE id = ?', [req.params.id]);
    res.json({ message: '아이디어를 삭제했습니다.' });
  } catch (err) {
    next(err);
  }
});

module.exports = { router, ideaPayload };
