const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db');
const { authRequired } = require('../middleware/auth');
const HttpError = require('../httpError');

const router = express.Router();

function publicUser(row) {
  return {
    id: row.id,
    email: row.email,
    nickname: row.nickname,
    created_at: row.created_at,
  };
}

router.get('/me', authRequired, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, email, nickname, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) {
      throw new HttpError(404, '사용자를 찾을 수 없습니다.');
    }
    res.json(publicUser(rows[0]));
  } catch (err) {
    next(err);
  }
});

router.put('/me', authRequired, async (req, res, next) => {
  try {
    const { nickname, currentPassword, newPassword } = req.body || {};
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (rows.length === 0) {
      throw new HttpError(404, '사용자를 찾을 수 없습니다.');
    }
    const me = rows[0];

    const nextNickname = nickname != null ? String(nickname).trim() : me.nickname;
    if (!nextNickname) {
      throw new HttpError(400, '닉네임을 입력하세요.');
    }

    // 비밀번호 변경 시에만 현재 비밀번호를 확인한 뒤 새 해시를 저장함
    let nextHash = me.password;
    if (newPassword) {
      if (!currentPassword) {
        throw new HttpError(400, '비밀번호를 바꾸려면 현재 비밀번호가 필요합니다.');
      }
      const ok = await bcrypt.compare(String(currentPassword), me.password);
      if (!ok) {
        throw new HttpError(400, '현재 비밀번호가 올바르지 않습니다.');
      }
      if (String(newPassword).length < 4) {
        throw new HttpError(400, '새 비밀번호는 4자 이상이어야 합니다.');
      }
      nextHash = await bcrypt.hash(String(newPassword), 10);
    }

    await pool.query('UPDATE users SET nickname = ?, password = ? WHERE id = ?', [
      nextNickname,
      nextHash,
      req.user.id,
    ]);

    const [updated] = await pool.query(
      'SELECT id, email, nickname, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    res.json(publicUser(updated[0]));
  } catch (err) {
    next(err);
  }
});

router.delete('/me', authRequired, async (req, res, next) => {
  try {
    const { password } = req.body || {};
    if (!password) {
      throw new HttpError(400, '탈퇴하려면 비밀번호를 입력하세요.');
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (rows.length === 0) {
      throw new HttpError(404, '사용자를 찾을 수 없습니다.');
    }

    const ok = await bcrypt.compare(String(password), rows[0].password);
    if (!ok) {
      throw new HttpError(400, '비밀번호가 올바르지 않습니다.');
    }

    // 하위 데이터는 FK CASCADE로 함께 삭제됨
    await pool.query('DELETE FROM users WHERE id = ?', [req.user.id]);
    res.json({ message: '회원 탈퇴가 완료되었습니다.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
