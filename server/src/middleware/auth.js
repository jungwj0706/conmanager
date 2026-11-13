const jwt = require('jsonwebtoken');

function readToken(req) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  const token = header.slice(7);
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
  } catch {
    return null;
  }
}

function authRequired(req, res, next) {
  const payload = readToken(req);
  if (!payload) {
    return res.status(401).json({ message: '로그인이 필요합니다.' });
  }
  req.user = payload;
  next();
}

module.exports = { authRequired };
