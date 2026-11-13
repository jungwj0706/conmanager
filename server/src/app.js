const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/contests', require('./routes/contests'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/my-contests', require('./routes/myContests'));
app.use('/api/schedules', require('./routes/schedules'));
app.use('/api/home', require('./routes/home'));

app.use((err, req, res, next) => {
  if (err.status) {
    return res.status(err.status).json({ message: err.message });
  }
  console.error(err);
  res.status(500).json({ message: '서버 오류가 발생했습니다.' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`server listening on ${PORT}`);
});
