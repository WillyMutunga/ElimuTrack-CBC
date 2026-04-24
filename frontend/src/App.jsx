import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ParentLogin from './pages/ParentLogin';

import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ParentDashboard from './pages/ParentDashboard';
import ExamPortal from './pages/ExamPortal';
import ModuleLearning from './pages/ModuleLearning';

// A simple PrivateRoute component
const PrivateRoute = ({ children }) => {
    const { user, loading } = React.useContext(AuthContext);
    
    if (loading) return <div>Loading...</div>;
    
    return user ? children : <Navigate to="/login" />;
};

// Main Dashboard Router based on role
const RoleBasedDashboard = () => {
    const { user, logout } = React.useContext(AuthContext);
    
    if (!user) return <Navigate to="/login" />;

    switch (user.role) {
        case 'TEACHER':
            return <TeacherDashboard />;
        case 'ADMIN':
            return <AdminDashboard />;
        case 'STUDENT':
            return <StudentDashboard />;
        case 'PARENT':
            return <ParentDashboard />;
        default:
            return <div>Unknown Role</div>;
    }
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/parent-login" element={<ParentLogin />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={
            <PrivateRoute>
              <RoleBasedDashboard />
            </PrivateRoute>
          } />
          <Route path="/exam/:id" element={
            <PrivateRoute>
              <ExamPortal />
            </PrivateRoute>
          } />
          <Route path="/learning/module/:moduleId" element={
            <PrivateRoute>
              <ModuleLearning />
            </PrivateRoute>
          } />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
