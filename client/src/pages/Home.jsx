import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="page">
      <section className="hero">
        <p className="eyebrow">대회 운영 데스크</p>
        <h1>대회의 모든 도전을 한곳에서</h1>
        <p className="lede">
          공모전, 해커톤, 경진 대회의 일정과 준비물, 참가 후기를 흩어지지 않게 모읍니다.
        </p>
        <div className="hero-actions">
          <Link to="/contests" className="btn btn-primary">
            대회 정보 보기
          </Link>
          {!user && (
            <Link to="/signup" className="btn btn-ghost">
              회원가입
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
