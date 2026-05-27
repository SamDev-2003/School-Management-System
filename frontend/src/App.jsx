import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import LoginPage from "./pages/auth/Login";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminStudents from "./pages/admin/Students";
import AdminTeachers from "./pages/admin/Teachers";
import AdminCourses from "./pages/admin/Courses";
import AdminReports from "./pages/admin/Reports";
import TeacherDashboard from "./pages/teacher/Dashboard";
import TeacherAttendance from "./pages/teacher/Attendance";
import TeacherMarks from "./pages/teacher/Marks";
import TeacherStudents from "./pages/teacher/Students";
import StudentDashboard from "./pages/student/Dashboard";
import StudentMarks from "./pages/student/Marks";
import StudentAttendance from "./pages/student/Attendance";
import StudentReport from "./pages/student/Report";

function Guard({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"/></div>;
  if (!user) return <Navigate to="/login" replace/>;
  if (roles && !roles.includes(user.role)) return <Navigate to="/login" replace/>;
  return children;
}
function Root() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace/>;
  if (user.role==="admin") return <Navigate to="/admin" replace/>;
  if (user.role==="teacher") return <Navigate to="/teacher" replace/>;
  return <Navigate to="/student" replace/>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration:3500, style:{ fontFamily:"Inter,sans-serif", fontSize:"0.875rem", borderRadius:"10px" }, success:{ style:{background:"#f0fdf4",color:"#166534",border:"1px solid #bbf7d0"} }, error:{ style:{background:"#fef2f2",color:"#991b1b",border:"1px solid #fecaca"} } }}/>
        <Routes>
          <Route path="/" element={<Root/>}/>
          <Route path="/login" element={<LoginPage/>}/>
          <Route path="/admin"   element={<Guard roles={["admin"]}  ><Layout/></Guard>}>
            <Route index element={<AdminDashboard/>}/>
            <Route path="students" element={<AdminStudents/>}/>
            <Route path="teachers" element={<AdminTeachers/>}/>
            <Route path="courses"  element={<AdminCourses/>}/>
            <Route path="reports"  element={<AdminReports/>}/>
          </Route>
          <Route path="/teacher" element={<Guard roles={["teacher"]}><Layout/></Guard>}>
            <Route index element={<TeacherDashboard/>}/>
            <Route path="attendance" element={<TeacherAttendance/>}/>
            <Route path="marks"      element={<TeacherMarks/>}/>
            <Route path="students"   element={<TeacherStudents/>}/>
          </Route>
          <Route path="/student" element={<Guard roles={["student"]}><Layout/></Guard>}>
            <Route index element={<StudentDashboard/>}/>
            <Route path="marks"      element={<StudentMarks/>}/>
            <Route path="attendance" element={<StudentAttendance/>}/>
            <Route path="report"     element={<StudentReport/>}/>
          </Route>
          <Route path="*" element={<Navigate to="/" replace/>}/>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
