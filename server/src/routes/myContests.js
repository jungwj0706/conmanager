const express = require('express');
const pool = require('../db');
const { authRequired } = require('../middleware/auth');
const HttpError = require('../httpError');
const { ideaPayload } = require('./ideas');

const router = express.Router();
const STATUSES = ['interest', 'planned', 'ongoing', 'done'];

function emptyToNull(value) {
  if (value == null) return null;
  const text = String(value).trim();
  return text === '' ? null : text;
}

// D-day는 저장하지 않고, 오늘 이후 남은 일정 중 가장 가까운 날짜로 계산함
const LIST_SQL = `
  SELECT mc.*,
    (
      SELECT MIN(s.due_date)
      FROM schedules s
      WHERE s.my_contest_id = mc.id AND s.due_date >= CURDATE()
    ) AS next_due,
    DATEDIFF((
      SELECT MIN(s.due_date)
      FROM schedules s
      WHERE s.my_contest_id = mc.id AND s.due_date >= CURDATE()
    ), CURDATE()) AS dday
  FROM my_contests mc
`;

async function assertOwner(id, userId) {
  const [rows] = await pool.query('SELECT * FROM my_contests WHERE id = ?', [id]);
  if (rows.length === 0) {
    throw new HttpError(404, '내 대회를 찾을 수 없습니다.');
  }
  if (rows[0].user_id !== userId) {
    throw new HttpError(403, '본인의 대회만 관리할 수 있습니다.');
  }
  return rows[0];
}

function normalizeSchedules(raw) {
  if (raw == null) return [];
  if (!Array.isArray(raw)) {
    throw new HttpError(400, '일정은 배열로 전달해야 합니다.');
  }
  return raw.map((item) => {
    const title = emptyToNull(item.title);
    const dueDate = emptyToNull(item.due_date);
    if (!title || !dueDate) {
      throw new HttpError(400, '일정의 이름과 날짜를 모두 입력하세요.');
    }
    return { title, due_date: dueDate };
  });
}

// 참가 여부: 관심 / 가장 이른 일정이 오늘 이후면 참가 예정, 아니면 진행 중
async function resolveStatus(participate, schedules) {
  if (!participate) return 'interest';
  const [[row]] = await pool.query('SELECT CURDATE() AS today');
  const dates = schedules.map((item) => item.due_date).sort();
  if (dates.length === 0) return 'planned';
  return dates[0] > row.today ? 'planned' : 'ongoing';
}

async function insertSchedules(conn, myContestId, schedules) {
  for (const item of schedules) {
    await conn.query('INSERT INTO schedules (my_contest_id, title, due_date) VALUES (?, ?, ?)', [
      myContestId,
      item.title,
      item.due_date,
    ]);
  }
}

async function getDetail(id, userId) {
  const [rows] = await pool.query(`${LIST_SQL} WHERE mc.id = ? AND mc.user_id = ?`, [id, userId]);
  if (rows.length === 0) {
    throw new HttpError(404, '내 대회를 찾을 수 없습니다.');
  }
  const [schedules] = await pool.query(
    'SELECT * FROM schedules WHERE my_contest_id = ? ORDER BY due_date ASC, id ASC',
    [id]
  );
  const [checklists] = await pool.query(
    'SELECT * FROM checklists WHERE my_contest_id = ? ORDER BY id ASC',
    [id]
  );
  const [ideas] = await pool.query(
    'SELECT * FROM ideas WHERE my_contest_id = ? ORDER BY is_final DESC, id DESC',
    [id]
  );
  const [memos] = await pool.query(
    'SELECT * FROM memos WHERE my_contest_id = ? ORDER BY created_at DESC, id DESC',
    [id]
  );
  return { ...rows[0], schedules, checklists, ideas, memos };
}

router.use(authRequired);

router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = ['mc.user_id = ?'];
    const params = [req.user.id];
    if (status) {
      if (!STATUSES.includes(status)) {
        throw new HttpError(400, '상태 값이 올바르지 않습니다.');
      }
      where.push('mc.status = ?');
      params.push(status);
    }
    const [rows] = await pool.query(
      `${LIST_SQL} WHERE ${where.join(' AND ')} ORDER BY mc.created_at DESC`,
      params
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.post('/from-contest/:contestId', async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const [contests] = await conn.query('SELECT * FROM contests WHERE id = ?', [req.params.contestId]);
    if (contests.length === 0) {
      throw new HttpError(404, '복사할 대회 정보를 찾을 수 없습니다.');
    }
    const contest = contests[0];
    await conn.beginTransaction();
    const [result] = await conn.query(
      `INSERT INTO my_contests
        (user_id, source_contest_id, title, organizer, location, fee, url, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'interest')`,
      [
        req.user.id,
        contest.id,
        contest.title,
        contest.organizer,
        contest.location,
        contest.fee || 0,
        contest.url,
      ]
    );
    const schedules = [];
    if (contest.apply_end_date) schedules.push({ title: '접수 마감', due_date: contest.apply_end_date });
    if (contest.event_start) schedules.push({ title: '행사 시작', due_date: contest.event_start });
    if (contest.event_end) schedules.push({ title: '행사 종료', due_date: contest.event_end });
    await insertSchedules(conn, result.insertId, schedules);
    await conn.commit();
    res.status(201).json(await getDetail(result.insertId, req.user.id));
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    res.json(await getDetail(req.params.id, req.user.id));
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const title = emptyToNull(req.body?.title);
    if (!title) throw new HttpError(400, '대회명을 입력하세요.');
    const schedules = normalizeSchedules(req.body?.schedules);
    const status = await resolveStatus(Boolean(req.body?.participate), schedules);

    await conn.beginTransaction();
    const [result] = await conn.query(
      `INSERT INTO my_contests
        (user_id, title, organizer, location, fee, url, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        title,
        emptyToNull(req.body.organizer),
        emptyToNull(req.body.location),
        req.body.fee == null || req.body.fee === '' ? 0 : Number(req.body.fee) || 0,
        emptyToNull(req.body.url),
        status,
      ]
    );
    await insertSchedules(conn, result.insertId, schedules);
    await conn.commit();
    res.status(201).json(await getDetail(result.insertId, req.user.id));
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    await assertOwner(req.params.id, req.user.id);
    const title = emptyToNull(req.body?.title);
    if (!title) throw new HttpError(400, '대회명을 입력하세요.');
    const status = req.body?.status;
    if (status && !STATUSES.includes(status)) {
      throw new HttpError(400, '상태 값이 올바르지 않습니다.');
    }
    const [result] = await pool.query(
      `UPDATE my_contests
       SET title = ?, organizer = ?, location = ?, fee = ?, url = ?, status = COALESCE(?, status)
       WHERE id = ? AND user_id = ?`,
      [
        title,
        emptyToNull(req.body.organizer),
        emptyToNull(req.body.location),
        req.body.fee == null || req.body.fee === '' ? 0 : Number(req.body.fee) || 0,
        emptyToNull(req.body.url),
        status || null,
        req.params.id,
        req.user.id,
      ]
    );
    if (result.affectedRows === 0) {
      throw new HttpError(404, '내 대회를 찾을 수 없습니다.');
    }
    res.json(await getDetail(req.params.id, req.user.id));
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await assertOwner(req.params.id, req.user.id);
    const [result] = await pool.query('DELETE FROM my_contests WHERE id = ? AND user_id = ?', [
      req.params.id,
      req.user.id,
    ]);
    if (result.affectedRows === 0) {
      throw new HttpError(404, '내 대회를 찾을 수 없습니다.');
    }
    res.json({ message: '내 대회를 삭제했습니다.' });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/checklists', async (req, res, next) => {
  try {
    await assertOwner(req.params.id, req.user.id);
    const [rows] = await pool.query('SELECT * FROM checklists WHERE my_contest_id = ? ORDER BY id ASC', [
      req.params.id,
    ]);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/checklists', async (req, res, next) => {
  try {
    await assertOwner(req.params.id, req.user.id);
    const content = emptyToNull(req.body?.content);
    if (!content) throw new HttpError(400, '체크리스트 내용을 입력하세요.');
    const scheduleId = req.body?.schedule_id ? Number(req.body.schedule_id) : null;
    const [result] = await pool.query(
      'INSERT INTO checklists (my_contest_id, schedule_id, content) VALUES (?, ?, ?)',
      [req.params.id, scheduleId, content]
    );
    const [rows] = await pool.query('SELECT * FROM checklists WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.get('/:id/ideas', async (req, res, next) => {
  try {
    await assertOwner(req.params.id, req.user.id);
    const [rows] = await pool.query(
      'SELECT * FROM ideas WHERE my_contest_id = ? ORDER BY is_final DESC, id DESC',
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/ideas', async (req, res, next) => {
  try {
    await assertOwner(req.params.id, req.user.id);
    const data = ideaPayload(req.body || {});
    const [result] = await pool.query(
      `INSERT INTO ideas
        (my_contest_id, title, problem, solution, features, tech_stack, effect, ref_link)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.params.id, data.title, data.problem, data.solution, data.features, data.tech_stack, data.effect, data.ref_link]
    );
    const [rows] = await pool.query('SELECT * FROM ideas WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.get('/:id/memos', async (req, res, next) => {
  try {
    await assertOwner(req.params.id, req.user.id);
    const [rows] = await pool.query(
      'SELECT * FROM memos WHERE my_contest_id = ? ORDER BY created_at DESC, id DESC',
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/memos', async (req, res, next) => {
  try {
    await assertOwner(req.params.id, req.user.id);
    const content = emptyToNull(req.body?.content);
    if (!content) throw new HttpError(400, '메모 내용을 입력하세요.');
    const [result] = await pool.query('INSERT INTO memos (my_contest_id, content) VALUES (?, ?)', [
      req.params.id,
      content,
    ]);
    const [rows] = await pool.query('SELECT * FROM memos WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/schedules', async (req, res, next) => {
  try {
    await assertOwner(req.params.id, req.user.id);
    const title = emptyToNull(req.body?.title);
    const dueDate = emptyToNull(req.body?.due_date);
    if (!title || !dueDate) {
      throw new HttpError(400, '일정의 이름과 날짜를 모두 입력하세요.');
    }
    const [result] = await pool.query(
      'INSERT INTO schedules (my_contest_id, title, due_date) VALUES (?, ?, ?)',
      [req.params.id, title, dueDate]
    );
    const [rows] = await pool.query('SELECT * FROM schedules WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
