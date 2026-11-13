import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="nav">
      <div className="nav-inner">
        <Link to="/" className="brand">
          콘매니저
        </Link>
        <nav className="nav-links">
          <NavLink to="/" end>
            홈
          </NavLink>
          <NavLink to="/contests">대회 정보</NavLink>
          <NavLink to="/reviews">후기</NavLink>
          {user && <NavLink to="/my-contests">내 대회</NavLink>}
          {user && <NavLink to="/calendar">캘린더</NavLink>}
        </nav>
        <div className="nav-auth">
          {user ? (
            <>
              <Link to="/mypage" className="nav-nick">
                {user.nickname}
              </Link>
              <button type="button" className="btn btn-ghost" onClick={logout}>
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link to="/login">로그인</Link>
              <Link to="/signup" className="btn btn-primary btn-sm">
                회원가입
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
