import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import VerifyCertificate from "./pages/VerifyCertificate";
import "./App.css";

function App() {
  return (
    <Router>
      
      <Routes>
        <Route path="/" element={
          <Home />
        } />
        <Route path="/login" element={
          <>
          <Navbar />
          <Login />
          </>
        } />
        <Route path="/verify/:id" element={
          <>
          <Navbar />
          <VerifyCertificate />
          </>
        } />

        {/* 🔐 Protected routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Navbar />
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student"
          element={
            <ProtectedRoute>
              <Navbar />
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
