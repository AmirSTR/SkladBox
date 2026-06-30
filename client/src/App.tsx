import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AnalysisPage } from './pages/AnalysisPage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { SettingsPage } from './pages/SettingsPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { UploadPage } from './pages/UploadPage';

function App() {
  return (
    <Routes>
      <Route element={<LoginPage />} path="/login" />
      <Route element={<RegisterPage />} path="/register" />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route element={<Navigate replace to="/upload" />} path="/" />
          <Route element={<DashboardPage />} path="/dashboard" />
          <Route element={<UploadPage />} path="/upload" />
          <Route element={<AnalysisPage />} path="/analysis" />
          <Route element={<SuppliersPage />} path="/suppliers" />
          <Route element={<SettingsPage />} path="/settings" />
        </Route>
      </Route>

      <Route element={<Navigate replace to="/upload" />} path="*" />
    </Routes>
  );
}

export default App;
