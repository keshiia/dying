import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense, useEffect } from 'react'
import Login from '@/pages/Login'
import AppShell from '@/components/AppShell'
import RouteFallback from '@/components/ui/RouteFallback'
import { ToastProvider } from '@/components/ui/Toast'
import { useAuthStore } from '@/stores/auth'

// 页面按需加载：登录页和 Shell 保持同步加载（首屏就要用），
// 其余页面拆成独立 chunk，避免进任何一个页面都下载全部功能与游戏数据
const Assistant = lazy(() => import('@/pages/Assistant'))
const Learn = lazy(() => import('@/pages/student/Learn'))
const Growth = lazy(() => import('@/pages/student/Growth'))
const Resources = lazy(() => import('@/pages/student/Resources'))
const Tasks = lazy(() => import('@/pages/student/Tasks'))
const Comics = lazy(() => import('@/pages/student/Comics'))
const Court = lazy(() => import('@/pages/student/games/Court'))
const Detective = lazy(() => import('@/pages/student/games/Detective'))
// 沉浸式页面挂在 /play/* 下，不套 AppShell —— 侧边栏和顶栏会让「全屏」变成假的
const ComicReader = lazy(() => import('@/pages/play/ComicReader'))
const DetectiveWorkbench = lazy(() => import('@/pages/play/DetectiveWorkbench'))
const CourtWorkbench = lazy(() => import('@/pages/play/CourtWorkbench'))
const Dashboard = lazy(() => import('@/pages/teacher/Dashboard'))
const Classes = lazy(() => import('@/pages/teacher/Classes'))
const Assignments = lazy(() => import('@/pages/teacher/Assignments'))
const TeacherResources = lazy(() => import('@/pages/teacher/Resources'))
const RiskAlerts = lazy(() => import('@/pages/teacher/RiskAlerts'))

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { status, user, bootstrap } = useAuthStore()
  useEffect(() => {
    void bootstrap()
  }, [bootstrap])
  if (status !== 'ready') return <div className="min-h-screen" />
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <ToastProvider>
      <Router>
      <Suspense fallback={<RouteFallback fullscreen />}>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        <Route
          path="/assistant"
          element={
            <RequireAuth>
              <Assistant />
            </RequireAuth>
          }
        />

        {/* 沉浸式路由：不套 AppShell，学生从这里「进入」而非「浏览」 */}
        <Route
          path="/play/comics/:storyId"
          element={
            <RequireAuth>
              <ComicReader />
            </RequireAuth>
          }
        />
        <Route
          path="/play/detective/:caseId"
          element={
            <RequireAuth>
              <DetectiveWorkbench />
            </RequireAuth>
          }
        />
        <Route
          path="/play/court/:caseId"
          element={
            <RequireAuth>
              <CourtWorkbench />
            </RequireAuth>
          }
        />

        <Route
          path="/app"
          element={
            <RequireAuth>
              <AppShell mode="student" />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/app/comics" replace />} />
          <Route path="learn" element={<Learn />} />
          <Route path="growth" element={<Growth />} />
          <Route path="resources" element={<Resources />} />
          <Route path="comics" element={<Comics />} />
          <Route path="games/court" element={<Court />} />
          <Route path="games/detective" element={<Detective />} />
          <Route path="tasks" element={<Tasks />} />
        </Route>

        <Route
          path="/teacher"
          element={
            <RequireAuth>
              <AppShell mode="teacher" />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/teacher/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="classes" element={<Classes />} />
          <Route path="assignments" element={<Assignments />} />
          <Route path="resources" element={<TeacherResources />} />
          <Route path="risk-alerts" element={<RiskAlerts />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      </Suspense>
      </Router>
    </ToastProvider>
  )
}
