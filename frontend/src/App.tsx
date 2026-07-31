import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import Login from '@/pages/Login'
import Assistant from '@/pages/Assistant'
import Learn from '@/pages/student/Learn'
import Growth from '@/pages/student/Growth'
import Resources from '@/pages/student/Resources'
import Tasks from '@/pages/student/Tasks'
import Comics from '@/pages/student/Comics'
import Court from '@/pages/student/games/Court'
import Detective from '@/pages/student/games/Detective'
import Dashboard from '@/pages/teacher/Dashboard'
import Classes from '@/pages/teacher/Classes'
import Assignments from '@/pages/teacher/Assignments'
import TeacherResources from '@/pages/teacher/Resources'
import AppShell from '@/components/AppShell'
import { ToastProvider } from '@/components/ui/Toast'
import { useAuthStore } from '@/stores/auth'

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
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      </Router>
    </ToastProvider>
  )
}
