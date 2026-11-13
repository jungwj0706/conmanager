const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const HttpError = require('../httpError');

const router = express.Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET || 'dev-secret',
    { expiresIn: '7d' }
  );
}

function publicUser(row) {
  return { id: row.id, email: row.email, nickname: row.nickname };
}

router.post('/signup', async (req, res, next) => {
  try {
    const { email, password, nickname } = req.body || {};
    if (!email || !password || !nickname) {
      throw new HttpError(400, '이메일, 비밀번호, 닉네임을 모두 입력하세요.');
    }
    if (!EMAIL_RE.test(String(email))) {
      throw new HttpError(400, '이메일 형식이 올바르지 않습니다.');
    }
    if (String(password).length < 4) {
      throw new HttpError(400, '비밀번호는 4자 이상이어야 합니다.');
    }

    // 비밀번호는 bcrypt 해시로만 저장함
    const hash = await bcrypt.hash(String(password), 10);
    const [result] = await pool.query(
      'INSERT INTO users (email, password, nickname) VALUES (?, ?, ?)',
      [String(email).trim(), hash, String(nickname).trim()]
    );
    const user = { id: result.insertId, email: String(email).trim(), nickname: String(nickname).trim() };
    res.status(201).json({ token: signToken(user), user });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return next(new HttpError(409, '이미 사용 중인 이메일입니다.'));
    }
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      throw new HttpError(400, '이메일과 비밀번호를 입력하세요.');
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [String(email).trim()]);
    if (rows.length === 0) {
      throw new HttpError(401, '이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    const ok = await bcrypt.compare(String(password), rows[0].password);
    if (!ok) {
      throw new HttpError(401, '이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    const user = publicUser(rows[0]);
    res.json({ token: signToken(user), user });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
