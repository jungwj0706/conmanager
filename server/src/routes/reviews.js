const express = require('express');
const pool = require('../db');
const { authRequired } = require('../middleware/auth');
const HttpError = require('../httpError');

const router = express.Router();
const RESULTS = ['none', 'finalist', 'award'];

function emptyToNull(value) {
  if (value == null) return null;
  const text = String(value).trim();
  return text === '' ? null : text;
}

function reviewPayload(body) {
  const title = emptyToNull(body.title);
  const contestId = Number(body.contest_id);
  const difficulty = Number(body.difficulty);
  const result = body.result || 'none';

  if (!title) throw new HttpError(400, '후기 제목을 입력하세요.');
  if (!contestId) throw new HttpError(400, '대회를 선택하세요.');
  if (!RESULTS.includes(result)) throw new HttpError(400, '결과 값이 올바르지 않습니다.');
  if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 5) {
    throw new HttpError(400, '난이도는 1부터 5 사이여야 합니다.');
  }

  return {
    contest_id: contestId,
    title,
    result,
    difficulty,
    prep_period: emptyToNull(body.prep_period),
    team_size: body.team_size == null || body.team_size === '' ? null : Number(body.team_size),
    prep_process: emptyToNull(body.prep_process),
    cautions: emptyToNull(body.cautions),
    tips: emptyToNull(body.tips),
  };
}

async function rejectIfNotOwner(id, userId) {
  const [rows] = await pool.query('SELECT id, user_id FROM reviews WHERE id = ?', [id]);
  if (rows.length === 0) {
    throw new HttpError(404, '후기를 찾을 수 없습니다.');
  }
  if (rows[0].user_id !== userId) {
    throw new HttpError(403, '본인이 작성한 후기만 수정·삭제할 수 있습니다.');
  }
}

// 후기, 작성자, 대회명을 세 테이블 JOIN으로 함께 조회함
const DETAIL_SQL = `
  SELECT r.*, u.nickname, c.title AS contest_title
  FROM reviews r
  JOIN users u ON r.user_id = u.id
  JOIN contests c ON r.contest_id = c.id
`;

router.get('/', async (req, res, next) => {
  try {
    const { contest_id: contestId } = req.query;
    const where = [];
    const params = [];
    if (contestId) {
      where.push('r.contest_id = ?');
      params.push(contestId);
    }
    const [rows] = await pool.query(
      `${DETAIL_SQL}
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY r.created_at DESC`,
      params
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await pool.query(`${DETAIL_SQL} WHERE r.id = ?`, [req.params.id]);
    if (rows.length === 0) {
      throw new HttpError(404, '후기를 찾을 수 없습니다.');
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.post('/', authRequired, async (req, res, next) => {
  try {
    const data = reviewPayload(req.body || {});
    const [contests] = await pool.query('SELECT id FROM contests WHERE id = ?', [data.contest_id]);
    if (contests.length === 0) {
      throw new HttpError(404, '후기를 작성할 대회를 찾을 수 없습니다.');
    }

    const [result] = await pool.query(
      `INSERT INTO reviews
        (user_id, contest_id, title, result, difficulty, prep_period, team_size, prep_process, cautions, tips)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        data.contest_id,
        data.title,
        data.result,
        data.difficulty,
        data.prep_period,
        Number.isNaN(data.team_size) ? null : data.team_size,
        data.prep_process,
        data.cautions,
        data.tips,
      ]
    );
    const [rows] = await pool.query(`${DETAIL_SQL} WHERE r.id = ?`, [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return next(new HttpError(409, '이미 이 대회에 후기를 작성했습니다.'));
    }
    next(err);
  }
});

router.put('/:id', authRequired, async (req, res, next) => {
  try {
    await rejectIfNotOwner(req.params.id, req.user.id);
    const data = reviewPayload(req.body || {});
    const [result] = await pool.query(
      `UPDATE reviews
       SET contest_id = ?, title = ?, result = ?, difficulty = ?, prep_period = ?,
           team_size = ?, prep_process = ?, cautions = ?, tips = ?
       WHERE id = ? AND user_id = ?`,
      [
        data.contest_id,
        data.title,
        data.result,
        data.difficulty,
        data.prep_period,
        Number.isNaN(data.team_size) ? null : data.team_size,
        data.prep_process,
        data.cautions,
        data.tips,
        req.params.id,
        req.user.id,
      ]
    );
    if (result.affectedRows === 0) {
      throw new HttpError(404, '후기를 찾을 수 없습니다.');
    }
    const [rows] = await pool.query(`${DETAIL_SQL} WHERE r.id = ?`, [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return next(new HttpError(409, '이미 이 대회에 후기를 작성했습니다.'));
    }
    next(err);
  }
});

router.delete('/:id', authRequired, async (req, res, next) => {
  try {
    await rejectIfNotOwner(req.params.id, req.user.id);
    const [result] = await pool.query('DELETE FROM reviews WHERE id = ? AND user_id = ?', [
      req.params.id,
      req.user.id,
    ]);
    if (result.affectedRows === 0) {
      throw new HttpError(404, '후기를 찾을 수 없습니다.');
    }
    res.json({ message: '후기를 삭제했습니다.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
