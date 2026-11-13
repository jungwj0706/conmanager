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

function contestPayload(body) {
  const title = emptyToNull(body.title);
  if (!title) {
    throw new HttpError(400, '대회명을 입력하세요.');
  }
  return {
    title,
    organizer: emptyToNull(body.organizer),
    category: emptyToNull(body.category),
    url: emptyToNull(body.url),
    apply_end_date: emptyToNull(body.apply_end_date),
    event_start: emptyToNull(body.event_start),
    event_end: emptyToNull(body.event_end),
    location: emptyToNull(body.location),
    fee: body.fee == null || body.fee === '' ? 0 : Number(body.fee),
    description: emptyToNull(body.description),
  };
}

async function rejectIfNotOwner(id, userId) {
  const [rows] = await pool.query('SELECT id, user_id FROM contests WHERE id = ?', [id]);
  if (rows.length === 0) {
    throw new HttpError(404, '대회 정보를 찾을 수 없습니다.');
  }
  if (rows[0].user_id !== userId) {
    throw new HttpError(403, '본인이 등록한 글만 수정·삭제할 수 있습니다.');
  }
}

router.get('/', async (req, res, next) => {
  try {
    const { category, keyword } = req.query;
    const where = [];
    const params = [];

    if (category) {
      where.push('c.category = ?');
      params.push(category);
    }
    if (keyword) {
      where.push('(c.title LIKE ? OR c.organizer LIKE ? OR c.description LIKE ?)');
      const like = `%${keyword}%`;
      params.push(like, like, like);
    }

    // 대회 정보와 등록자 닉네임을 JOIN으로 함께 조회함
    const sql = `
      SELECT c.*, u.nickname
      FROM contests c
      JOIN users u ON c.user_id = u.id
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY c.created_at DESC
    `;
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get('/:id/reviews', async (req, res, next) => {
  try {
    const [contests] = await pool.query('SELECT id FROM contests WHERE id = ?', [req.params.id]);
    if (contests.length === 0) {
      throw new HttpError(404, '대회 정보를 찾을 수 없습니다.');
    }
    const [reviews] = await pool.query(
      `SELECT r.*, u.nickname, c.title AS contest_title
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       JOIN contests c ON r.contest_id = c.id
       WHERE r.contest_id = ?
       ORDER BY r.created_at DESC`,
      [req.params.id]
    );
    const [avgRows] = await pool.query(
      'SELECT AVG(difficulty) AS averageDifficulty FROM reviews WHERE contest_id = ?',
      [req.params.id]
    );
    res.json({
      reviews,
      averageDifficulty: avgRows[0].averageDifficulty == null ? null : Number(avgRows[0].averageDifficulty),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.*, u.nickname
       FROM contests c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) {
      throw new HttpError(404, '대회 정보를 찾을 수 없습니다.');
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.post('/', authRequired, async (req, res, next) => {
  try {
    const data = contestPayload(req.body || {});
    const [result] = await pool.query(
      `INSERT INTO contests
        (user_id, title, organizer, category, url, apply_end_date, event_start, event_end, location, fee, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        data.title,
        data.organizer,
        data.category,
        data.url,
        data.apply_end_date,
        data.event_start,
        data.event_end,
        data.location,
        Number.isNaN(data.fee) ? 0 : data.fee,
        data.description,
      ]
    );
    const [rows] = await pool.query(
      `SELECT c.*, u.nickname
       FROM contests c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [result.insertId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return next(new HttpError(409, '이미 등록된 대회 링크입니다.'));
    }
    next(err);
  }
});

router.put('/:id', authRequired, async (req, res, next) => {
  try {
    await rejectIfNotOwner(req.params.id, req.user.id);
    const data = contestPayload(req.body || {});
    const [result] = await pool.query(
      `UPDATE contests
       SET title = ?, organizer = ?, category = ?, url = ?, apply_end_date = ?,
           event_start = ?, event_end = ?, location = ?, fee = ?, description = ?
       WHERE id = ? AND user_id = ?`,
      [
        data.title,
        data.organizer,
        data.category,
        data.url,
        data.apply_end_date,
        data.event_start,
        data.event_end,
        data.location,
        Number.isNaN(data.fee) ? 0 : data.fee,
        data.description,
        req.params.id,
        req.user.id,
      ]
    );
    if (result.affectedRows === 0) {
      throw new HttpError(404, '대회 정보를 찾을 수 없습니다.');
    }
    const [rows] = await pool.query(
      `SELECT c.*, u.nickname
       FROM contests c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return next(new HttpError(409, '이미 등록된 대회 링크입니다.'));
    }
    next(err);
  }
});

router.delete('/:id', authRequired, async (req, res, next) => {
  try {
    await rejectIfNotOwner(req.params.id, req.user.id);
    const [result] = await pool.query('DELETE FROM contests WHERE id = ? AND user_id = ?', [
      req.params.id,
      req.user.id,
    ]);
    if (result.affectedRows === 0) {
      throw new HttpError(404, '대회 정보를 찾을 수 없습니다.');
    }
    res.json({ message: '대회 정보를 삭제했습니다.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
