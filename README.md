# 콘매니저 (Conmanager)

공모전, 해커톤, 개발 경진 대회의 일정 관리부터 대회 정보·참가 후기 공유까지 한곳에서 다루는 웹 서비스입니다.

## 실행 환경

- Node.js 18 이상
- MySQL 8
- 포트: 서버 `4000`, 클라이언트 `5173`

## 실행 순서

실습실 컴퓨터에서 저장소를 clone한 뒤 아래 순서만 따라 하면 됩니다.

### 1. 저장소 받기

```bash
git clone <저장소URL>
cd conmanager
```

### 2. 데이터베이스 준비

MySQL 서버를 켠 다음 스키마를 적용합니다. DB 이름은 반드시 `db_programming_project_20417` 입니다.

```bash
mysql -u root -p < server/schema.sql
```

비밀번호가 없는 환경이면 `-p`를 빼고 실행합니다.

### 3. 서버 환경 변수

```bash
cd server
cp .env.example .env
```

실습실 MySQL 계정·비밀번호가 다르면 `.env`를 수정합니다.

```
PORT=4000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=db_programming_project_20417
JWT_SECRET=change-this-secret
```

- `DB_USER`, `DB_PASSWORD`: 실습실 MySQL 계정에 맞게 변경
- `DB_NAME`: 바꾸지 않음
- `JWT_SECRET`: 원하는 문자열로 변경 가능

### 4. 서버 실행

```bash
cd server
npm install
npm start
```

`bcrypt` 설치가 실패하면 `npm uninstall bcrypt` 후 `npm install bcryptjs`를 하고, `server/src/routes/auth.js`와 `server/src/routes/users.js`의 `require('bcrypt')`를 `require('bcryptjs')`로 바꿉니다.

### 5. 클라이언트 실행

새 터미널에서:

```bash
cd client
npm install
npm run dev
```

브라우저에서 [http://localhost:5173](http://localhost:5173) 을 엽니다.

클라이언트는 `/api` 요청을 서버(`localhost:4000`)로 프록시합니다.
