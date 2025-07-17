import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { useAuth } from './context/AuthContext'
import ClockLoader from './components/ClockLoader'
import RecruiterOverview from './pages/RecruiterOverview'

const Home = lazy(() => import('./pages/Home'))
const CandidateLogin = lazy(() => import('./pages/CandidateLogin'))
const CandidateSignup = lazy(() => import('./pages/CandidateSignup'))
const RecruiterLogin = lazy(() => import('./pages/RecruiterLogin'))
const AuthRoute = lazy(() => import('./components/AuthRoute'))
const ProtectedRoute = lazy(() => import('./components/ProtectedRoute'))
const RecruiterDashboard = lazy(() => import('./RecruiterDashboard'))
const CandidateDashboard = lazy(() => import('./CandidateDashboard'))
const CompleteProfile = lazy(() => import('./CompleteProfile'))
const AssessmentChatbot = lazy(() => import('./AssessmentChatbot'))
const CandidateRanking = lazy(() => import('./CandidateRanking'))
const PostAssessmentReport = lazy(() => import('./pages/PostAssessmentReport'))
const CombinedReport = lazy(() => import('./pages/CombinedReport'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const CandidateConfirm = lazy(() => import('./pages/CandidateConfirm'))
const CandidateResult = lazy(() => import('./pages/CandidateResult'))
const AssessmentResults = lazy(() => import('./pages/AssessmentResults'))
const CandidateOverview = lazy(() => import('./pages/CandidateOverview'))
const Analytics = lazy(() => import('./Analytics'))
const CandidateProctoring = lazy(() =>
  import('./components/CandidateProctoring')
)

export default function App() {
  const { user } = useAuth()

  console.log(user)

  return (
    <Suspense fallback={<ClockLoader />}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />

        <Route element={<AuthRoute />}>
          <Route path="/candidate/login" element={<CandidateLogin />} />
          <Route path="/candidate/signup" element={<CandidateSignup />} />
          <Route
            path="/candidate/forgot-password"
            element={<ForgotPassword />}
          />
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
          path="candidate"
        >
          <Route index element={<CandidateOverview />} />
          <Route path="dashboard" element={<CandidateDashboard />} />
          <Route path="complete-profile" element={<CompleteProfile />} />
          <Route path="assessment/:attemptId" element={<AssessmentChatbot />} />
          <Route
            path="assessment/:attemptId/results"
            element={<CandidateResult />}
          />
          <Route path="results" element={<AssessmentResults />} />
        </Route>

        <Route
          element={
            <ProtectedRoute allowedRoles={['recruiter']} redirectPath="/" />
          }
          path="recruiter"
        >
          <Route index element={<RecruiterOverview />} />
          <Route path="dashboard" element={<RecruiterDashboard />} />
          <Route path="candidates/:job_id" element={<CandidateRanking />} />
          <Route path="report/:job_id" element={<PostAssessmentReport />} />
          <Route path="combined-report/:job_id" element={<CombinedReport />} />
          <Route path="analytics" element={<Analytics />} />
          <Route
            path="candidate/:candidateId/proctoring"
            element={<CandidateProctoring />}
          />
        </Route>
      </Routes>
    </Suspense>
  )
}
