import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import CandidateLogin from './pages/CandidateLogin'
import CandidateSignup from './pages/CandidateSignup'
import RecruiterLogin from './pages/RecruiterLogin'
import AssessmentDashboard from './pages/AssessmentDashboard'
import AuthRoute from './components/AuthRoute'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './context/AuthContext'
// import RecruiterDashboard from './pages/RecruiterDashboard'
import RecruiterDashboard from './RecruiterDashboard'
import CandidateDashboard from './CandidateDashboard'
import CompleteProfile from './CompleteProfile'
import AssessmentChatbot from './AssessmentChatbot'
import CandidateRanking from './CandidateRanking'
import PostAssessmentReport from './pages/PostAssessmentReport'
import CombinedReport from './pages/CombinedReport'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import CandidateConfirm from './pages/CandidateConfirm'
import CandidateResult from './pages/CandidateResult'
import AssessmentResults from './pages/AssessmentResults'

export default function App() {
  const { user } = useAuth()

  console.log(user)

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />

      <Route element={<AuthRoute />}>
        <Route path="/candidate/login" element={<CandidateLogin />} />
        <Route path="/candidate/signup" element={<CandidateSignup />} />
        <Route path="/candidate/forgot-password" element={<ForgotPassword />} />
        <Route path="/candidate/reset-password" element={<ResetPassword />} />
        <Route path="/candidate/confirm" element={<CandidateConfirm />} />
      </Route>

      <Route element={<AuthRoute redirectPath="/recruiter/dashboard" />}>
        <Route path="/recruiter/login" element={<RecruiterLogin />} />
      </Route>

      <Route
        element={
          <ProtectedRoute allowedRoles={['candidate']} redirectPath="/" />
        }
      >
        <Route path="/candidate/dashboard" element={<CandidateDashboard />} />
        <Route
          path="/candidate/complete-profile"
          element={<CompleteProfile />}
        />
        <Route
          path="/candidate/assessment/:attemptId"
          element={<AssessmentChatbot />}
        />
        <Route
          path="/candidate/assessment/:attemptId/results"
          element={<CandidateResult />}
        />
        <Route path="/candidate/results" element={<AssessmentResults />} />
      </Route>

      <Route
        element={
          <ProtectedRoute allowedRoles={['recruiter']} redirectPath="/" />
        }
      >
        <Route path="/recruiter/dashboard" element={<RecruiterDashboard />} />
        <Route
          path="/recruiter/candidates/:job_id"
          element={<CandidateRanking />}
        />
        <Route
          path="/recruiter/report/:job_id"
          element={<PostAssessmentReport />}
        />
        <Route
          path="/recruiter/combined-report/:job_id"
          element={<CombinedReport />}
        />
      </Route>
    </Routes>
  )
}
