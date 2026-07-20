import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from './AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import RegisterAdmin from './pages/RegisterAdmin.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import Subscription from './pages/Subscription.jsx';
import ClassManager from './pages/ClassManager.jsx';
import QuizForm from './pages/QuizForm.jsx';
import QuizList from './pages/QuizList.jsx';
import QuizView from './pages/QuizView.jsx';
import QuizEdit from './pages/QuizEdit.jsx';
import ImportQuiz from './pages/ImportQuiz.jsx';
import ConvertQuiz from './pages/ConvertQuiz.jsx';
import ProgressiveQuizForm from './pages/ProgressiveQuizForm.jsx';
import CreateQuizMenu from './pages/CreateQuizMenu.jsx';
import SmartCreateQuiz from './pages/SmartCreateQuiz.jsx';
import SurveyList from './pages/SurveyList.jsx';
import SurveyForm from './pages/SurveyForm.jsx';
import SurveyResults from './pages/SurveyResults.jsx';
import PublicSurvey from './pages/PublicSurvey.jsx';
import Results from './pages/Results.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import StudentResults from './pages/StudentResults.jsx';
import SuperAdminDashboard from './pages/SuperAdminDashboard.jsx';
import SuperAdminUsers from './pages/SuperAdminUsers.jsx';
import SuperAdminRevenue from './pages/SuperAdminRevenue.jsx';
import TakeQuiz from './pages/TakeQuiz.jsx';
import PublicQuiz from './pages/PublicQuiz.jsx';
import MyResults from './pages/MyResults.jsx';
import Landing from './pages/Landing.jsx';
import Account from './pages/Account.jsx';

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div className="center-screen">Chargement...</div>;
  if (!user) return <Landing />;
  if (user.role === 'superadmin') return <Navigate to="/superadmin" replace />;
  return <Navigate to={user.role === 'admin' ? '/admin' : '/student'} replace />;
}

export default function App() {
  const location = useLocation();
  return (
    <div className="app-shell">
      <Navbar />
      <main className="main-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <Routes location={location}>
              <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/register-admin" element={<RegisterAdmin />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Route publique pour accès au quiz via lien partagé */}
          <Route path="/quiz/:token" element={<PublicQuiz />} />
          <Route path="/sondage/:token" element={<PublicSurvey />} />
          <Route path="/mes-notes" element={<MyResults />} />

          <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />

          <Route path="/admin" element={<ProtectedRoute role="admin" requireSubscription><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/subscription" element={<ProtectedRoute role="admin"><Subscription /></ProtectedRoute>} />
          <Route path="/admin/classes" element={<ProtectedRoute role="admin" requireSubscription><ClassManager /></ProtectedRoute>} />
          <Route path="/admin/quizzes" element={<ProtectedRoute role="admin" requireSubscription><QuizList /></ProtectedRoute>} />
          <Route path="/admin/quizzes/create" element={<ProtectedRoute role="admin" requireSubscription><CreateQuizMenu /></ProtectedRoute>} />
          <Route path="/admin/quizzes/smart" element={<ProtectedRoute role="admin" requireSubscription><SmartCreateQuiz /></ProtectedRoute>} />
          <Route path="/admin/quizzes/new" element={<ProtectedRoute role="admin" requireSubscription><QuizForm /></ProtectedRoute>} />
          <Route path="/admin/quizzes/:id" element={<ProtectedRoute role="admin" requireSubscription><QuizView /></ProtectedRoute>} />
          <Route path="/admin/quizzes/:id/edit" element={<ProtectedRoute role="admin" requireSubscription><QuizEdit /></ProtectedRoute>} />
          <Route path="/admin/quizzes/import" element={<ProtectedRoute role="admin" requireSubscription><ImportQuiz /></ProtectedRoute>} />
          <Route path="/admin/quizzes/progressive" element={<ProtectedRoute role="admin" requireSubscription><ProgressiveQuizForm /></ProtectedRoute>} />
          <Route path="/admin/quizzes/:id/progressive/edit" element={<ProtectedRoute role="admin" requireSubscription><ProgressiveQuizForm /></ProtectedRoute>} />
          <Route path="/admin/quizzes/convert" element={<ProtectedRoute role="admin" requireSubscription><ConvertQuiz /></ProtectedRoute>} />
          <Route path="/admin/results" element={<ProtectedRoute role="admin" requireSubscription><Results /></ProtectedRoute>} />
          <Route path="/admin/surveys" element={<ProtectedRoute role="admin" requireSubscription><SurveyList /></ProtectedRoute>} />
          <Route path="/admin/surveys/new" element={<ProtectedRoute role="admin" requireSubscription><SurveyForm /></ProtectedRoute>} />
          <Route path="/admin/surveys/:id/edit" element={<ProtectedRoute role="admin" requireSubscription><SurveyForm /></ProtectedRoute>} />
          <Route path="/admin/surveys/:id" element={<ProtectedRoute role="admin" requireSubscription><SurveyResults /></ProtectedRoute>} />

          <Route path="/student" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
          <Route path="/student/notes" element={<ProtectedRoute role="student"><StudentResults /></ProtectedRoute>} />
          <Route path="/student/quizzes/:id" element={<ProtectedRoute role="student"><TakeQuiz /></ProtectedRoute>} />

          <Route path="/superadmin" element={<ProtectedRoute role="superadmin"><SuperAdminDashboard /></ProtectedRoute>} />
          <Route path="/superadmin/revenue" element={<ProtectedRoute role="superadmin"><SuperAdminRevenue /></ProtectedRoute>} />
          <Route path="/superadmin/users" element={<ProtectedRoute role="superadmin"><SuperAdminUsers /></ProtectedRoute>} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
