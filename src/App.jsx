import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useAuth } from './AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Landing from './pages/LandingImpact.jsx';
import { homePathFor } from './utils/homePath.js';

const Login = lazy(() => import('./pages/Login.jsx'));
const Register = lazy(() => import('./pages/Register.jsx'));
const RegisterAdmin = lazy(() => import('./pages/RegisterAdmin.jsx'));
const RegisterEnterprise = lazy(() => import('./pages/RegisterEnterprise.jsx'));
const ForgotPassword = lazy(() => import('./pages/ForgotPasswordSecure.jsx'));
const DemoQuiz = lazy(() => import('./pages/DemoQuiz.jsx'));
const Resources = lazy(() => import('./pages/Resources.jsx'));
const LegalPage = lazy(() => import('./pages/LegalPage.jsx'));
const KnowledgeAssessment = lazy(() => import('./pages/ProfessionalSolutions.jsx').then((module) => ({ default: module.KnowledgeAssessment })));
const SoftSkillsDevelopment = lazy(() => import('./pages/ProfessionalSolutions.jsx').then((module) => ({ default: module.SoftSkillsDevelopment })));
const Account = lazy(() => import('./pages/Account.jsx'));
const UsageGuide = lazy(() => import('./pages/UsageGuide.jsx'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard.jsx'));
const Subscription = lazy(() => import('./pages/Subscription.jsx'));
const ClassManager = lazy(() => import('./pages/ClassManager.jsx'));
const QuizForm = lazy(() => import('./pages/QuizForm.jsx'));
const QuizList = lazy(() => import('./pages/QuizList.jsx'));
const QuizView = lazy(() => import('./pages/QuizView.jsx'));
const QuizEdit = lazy(() => import('./pages/QuizEdit.jsx'));
const ImportQuiz = lazy(() => import('./pages/ImportQuiz.jsx'));
const ConvertQuiz = lazy(() => import('./pages/ConvertQuiz.jsx'));
const ProgressiveQuizForm = lazy(() => import('./pages/ProgressiveQuizForm.jsx'));
const CreateQuizMenu = lazy(() => import('./pages/CreateQuizMenu.jsx'));
const SmartCreateQuiz = lazy(() => import('./pages/SmartCreateQuiz.jsx'));
const SurveyList = lazy(() => import('./pages/SurveyList.jsx'));
const SurveyForm = lazy(() => import('./pages/SurveyForm.jsx'));
const SurveyResults = lazy(() => import('./pages/SurveyResults.jsx'));
const PublicSurvey = lazy(() => import('./pages/PublicSurvey.jsx'));
const Results = lazy(() => import('./pages/Results.jsx'));
const StudentGradebook = lazy(() => import('./pages/StudentGradebook.jsx'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard.jsx'));
const StudentResults = lazy(() => import('./pages/StudentResults.jsx'));
const SuperAdminDashboard = lazy(() => import('./pages/SuperAdminDashboard.jsx'));
const SuperAdminUsers = lazy(() => import('./pages/SuperAdminUsers.jsx'));
const SuperAdminRevenue = lazy(() => import('./pages/SuperAdminRevenue.jsx'));
const TakeQuiz = lazy(() => import('./pages/TakeQuiz.jsx'));
const PublicQuiz = lazy(() => import('./pages/PublicQuiz.jsx'));
const MyResults = lazy(() => import('./pages/MyResults.jsx'));
const EnterpriseDashboard = lazy(() => import('./pages/enterprise/EnterpriseDashboard.jsx'));
const EnterpriseEmployees = lazy(() => import('./pages/enterprise/EnterpriseEmployees.jsx'));
const EnterpriseEmployeeForm = lazy(() => import('./pages/enterprise/EnterpriseEmployeeForm.jsx'));
const EnterpriseAssessments = lazy(() => import('./pages/enterprise/EnterpriseAssessments.jsx'));
const EnterpriseAssessmentForm = lazy(() => import('./pages/enterprise/EnterpriseAssessmentForm.jsx'));
const EnterpriseAssessmentView = lazy(() => import('./pages/enterprise/EnterpriseAssessmentView.jsx'));
const EnterpriseProgress = lazy(() => import('./pages/enterprise/EnterpriseProgress.jsx'));
const EnterpriseSubscription = lazy(() => import('./pages/enterprise/EnterpriseSubscriptionV2.jsx'));

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div className="center-screen">Chargement...</div>;
  if (!user) return <Landing />;
  if (user.role === 'superadmin') return <Navigate to="/superadmin" replace />;
  return <Navigate to={homePathFor(user)} replace />;
}

export default function App() {
  const location = useLocation();
  const reducedMotion = useReducedMotion();
  return (
    <div className="app-shell">
      <Navbar />
      <main className="main-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={reducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
            transition={{ duration: reducedMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <Suspense fallback={<div className="center-screen">Chargement...</div>}>
            <Routes location={location}>
              <Route path="/" element={<HomeRedirect />} />
          <Route path="/demo-qcm" element={<DemoQuiz />} />
          <Route path="/evaluation-des-acquis" element={<KnowledgeAssessment />} />
          <Route path="/developpement-soft-skills" element={<SoftSkillsDevelopment />} />
          <Route path="/ressources" element={<Resources />} />
          <Route path="/confidentialite" element={<LegalPage document="privacy" />} />
          <Route path="/cgu" element={<LegalPage document="terms" />} />
          <Route path="/cgv" element={<LegalPage document="sales" />} />
          <Route path="/mentions-legales" element={<LegalPage document="notices" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/register-admin" element={<RegisterAdmin />} />
          <Route path="/register-enterprise" element={<RegisterEnterprise />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Route publique pour accès au quiz via lien partagé */}
          <Route path="/quiz/:token" element={<PublicQuiz />} />
          <Route path="/sondage/:token" element={<PublicSurvey />} />
          <Route path="/mes-notes" element={<MyResults />} />

          <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
          <Route path="/guide" element={<ProtectedRoute><UsageGuide /></ProtectedRoute>} />

          <Route path="/admin" element={<ProtectedRoute role="admin" requireSubscription><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/subscription" element={<ProtectedRoute role="admin"><Subscription /></ProtectedRoute>} />
          <Route path="/admin/classes" element={<ProtectedRoute role="admin" requireSubscription><ClassManager /></ProtectedRoute>} />
          <Route path="/admin/quizzes" element={<ProtectedRoute role="admin" requireSubscription><QuizList /></ProtectedRoute>} />
          <Route path="/admin/quizzes/create" element={<ProtectedRoute role="admin" requireSubscription><CreateQuizMenu /></ProtectedRoute>} />
          <Route path="/admin/quizzes/smart" element={<ProtectedRoute role="admin" requireSubscription requireFeature="quiz_smart"><SmartCreateQuiz /></ProtectedRoute>} />
          <Route path="/admin/quizzes/new" element={<ProtectedRoute role="admin" requireSubscription><QuizForm /></ProtectedRoute>} />
          <Route path="/admin/quizzes/:id" element={<ProtectedRoute role="admin" requireSubscription><QuizView /></ProtectedRoute>} />
          <Route path="/admin/quizzes/:id/edit" element={<ProtectedRoute role="admin" requireSubscription><QuizEdit /></ProtectedRoute>} />
          <Route path="/admin/quizzes/import" element={<ProtectedRoute role="admin" requireSubscription><ImportQuiz /></ProtectedRoute>} />
          <Route path="/admin/quizzes/progressive" element={<ProtectedRoute role="admin" requireSubscription><ProgressiveQuizForm /></ProtectedRoute>} />
          <Route path="/admin/quizzes/:id/progressive/edit" element={<ProtectedRoute role="admin" requireSubscription><ProgressiveQuizForm /></ProtectedRoute>} />
          <Route path="/admin/quizzes/convert" element={<ProtectedRoute role="admin" requireSubscription><ConvertQuiz /></ProtectedRoute>} />
          <Route path="/admin/results" element={<ProtectedRoute role="admin" requireSubscription><Results /></ProtectedRoute>} />
          <Route path="/admin/students/:id/results" element={<ProtectedRoute role="admin" requireSubscription><StudentGradebook /></ProtectedRoute>} />
          <Route path="/admin/surveys" element={<ProtectedRoute role="admin" requireSubscription requireFeature="surveys"><SurveyList /></ProtectedRoute>} />
          <Route path="/admin/surveys/new" element={<ProtectedRoute role="admin" requireSubscription requireFeature="surveys"><SurveyForm /></ProtectedRoute>} />
          <Route path="/admin/surveys/:id/edit" element={<ProtectedRoute role="admin" requireSubscription requireFeature="surveys"><SurveyForm /></ProtectedRoute>} />
          <Route path="/admin/surveys/:id" element={<ProtectedRoute role="admin" requireSubscription requireFeature="surveys"><SurveyResults /></ProtectedRoute>} />

          <Route path="/entreprise" element={<ProtectedRoute role="enterprise" requireSubscription><EnterpriseDashboard /></ProtectedRoute>} />
          <Route path="/entreprise/abonnement" element={<ProtectedRoute role="enterprise"><EnterpriseSubscription /></ProtectedRoute>} />
          <Route path="/entreprise/collaborateurs" element={<ProtectedRoute role="enterprise" requireSubscription><EnterpriseEmployees /></ProtectedRoute>} />
          <Route path="/entreprise/collaborateurs/nouveau" element={<ProtectedRoute role="enterprise" requireSubscription><EnterpriseEmployeeForm /></ProtectedRoute>} />
          <Route path="/entreprise/collaborateurs/:id/modifier" element={<ProtectedRoute role="enterprise" requireSubscription><EnterpriseEmployeeForm /></ProtectedRoute>} />
          <Route path="/entreprise/diagnostics" element={<ProtectedRoute role="enterprise" requireSubscription><EnterpriseAssessments /></ProtectedRoute>} />
          <Route path="/entreprise/diagnostics/nouveau" element={<ProtectedRoute role="enterprise" requireSubscription><EnterpriseAssessmentForm /></ProtectedRoute>} />
          <Route path="/entreprise/diagnostics/:id" element={<ProtectedRoute role="enterprise" requireSubscription><EnterpriseAssessmentView /></ProtectedRoute>} />
          <Route path="/entreprise/diagnostics/:id/modifier" element={<ProtectedRoute role="enterprise" requireSubscription><EnterpriseAssessmentForm /></ProtectedRoute>} />
          <Route path="/entreprise/suivi" element={<ProtectedRoute role="enterprise" requireSubscription><EnterpriseProgress /></ProtectedRoute>} />

          <Route path="/student" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
          <Route path="/student/notes" element={<ProtectedRoute role="student"><StudentResults /></ProtectedRoute>} />
          <Route path="/student/quizzes/:id" element={<ProtectedRoute role="student"><TakeQuiz /></ProtectedRoute>} />

          <Route path="/superadmin" element={<ProtectedRoute role="superadmin"><SuperAdminDashboard /></ProtectedRoute>} />
          <Route path="/superadmin/revenue" element={<ProtectedRoute role="superadmin"><SuperAdminRevenue /></ProtectedRoute>} />
          <Route path="/superadmin/users" element={<ProtectedRoute role="superadmin"><SuperAdminUsers /></ProtectedRoute>} />
            </Routes>
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
