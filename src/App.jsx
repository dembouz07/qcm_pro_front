import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import ClassManager from './pages/ClassManager.jsx';
import QuizForm from './pages/QuizForm.jsx';
import QuizList from './pages/QuizList.jsx';
import QuizView from './pages/QuizView.jsx';
import QuizEdit from './pages/QuizEdit.jsx';
import ImportQuiz from './pages/ImportQuiz.jsx';
import ConvertQuiz from './pages/ConvertQuiz.jsx';
import ProgressiveQuizForm from './pages/ProgressiveQuizForm.jsx';
import Results from './pages/Results.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import TakeQuiz from './pages/TakeQuiz.jsx';
import PublicQuiz from './pages/PublicQuiz.jsx';
import MyResults from './pages/MyResults.jsx';

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div className="center-screen">Chargement...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'admin' ? '/admin' : '/student'} replace />;
}

export default function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Route publique pour accès au quiz via lien partagé */}
          <Route path="/quiz/:token" element={<PublicQuiz />} />
          <Route path="/mes-notes" element={<MyResults />} />

          <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/classes" element={<ProtectedRoute role="admin"><ClassManager /></ProtectedRoute>} />
          <Route path="/admin/quizzes" element={<ProtectedRoute role="admin"><QuizList /></ProtectedRoute>} />
          <Route path="/admin/quizzes/new" element={<ProtectedRoute role="admin"><QuizForm /></ProtectedRoute>} />
          <Route path="/admin/quizzes/:id" element={<ProtectedRoute role="admin"><QuizView /></ProtectedRoute>} />
          <Route path="/admin/quizzes/:id/edit" element={<ProtectedRoute role="admin"><QuizEdit /></ProtectedRoute>} />
          <Route path="/admin/quizzes/import" element={<ProtectedRoute role="admin"><ImportQuiz /></ProtectedRoute>} />
          <Route path="/admin/quizzes/progressive" element={<ProtectedRoute role="admin"><ProgressiveQuizForm /></ProtectedRoute>} />
          <Route path="/admin/quizzes/convert" element={<ProtectedRoute role="admin"><ConvertQuiz /></ProtectedRoute>} />
          <Route path="/admin/results" element={<ProtectedRoute role="admin"><Results /></ProtectedRoute>} />

          <Route path="/student" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
          <Route path="/student/quizzes/:id" element={<ProtectedRoute role="student"><TakeQuiz /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  );
}
