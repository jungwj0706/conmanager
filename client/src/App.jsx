import { Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import MyPage from './pages/MyPage';
import ContestList from './pages/ContestList';
import ContestDetail from './pages/ContestDetail';
import ContestForm from './pages/ContestForm';
import ReviewList from './pages/ReviewList';
import ReviewDetail from './pages/ReviewDetail';
import ReviewForm from './pages/ReviewForm';

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/mypage"
            element={
              <ProtectedRoute>
                <MyPage />
              </ProtectedRoute>
            }
          />
          <Route path="/contests" element={<ContestList />} />
          <Route
            path="/contests/new"
            element={
              <ProtectedRoute>
                <ContestForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contests/:id/edit"
            element={
              <ProtectedRoute>
                <ContestForm />
              </ProtectedRoute>
            }
          />
          <Route path="/contests/:id" element={<ContestDetail />} />
          <Route path="/reviews" element={<ReviewList />} />
          <Route
            path="/reviews/new"
            element={
              <ProtectedRoute>
                <ReviewForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reviews/:id/edit"
            element={
              <ProtectedRoute>
                <ReviewForm />
              </ProtectedRoute>
            }
          />
          <Route path="/reviews/:id" element={<ReviewDetail />} />
        </Routes>
      </main>
    </>
  );
}
