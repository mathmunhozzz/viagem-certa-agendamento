import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';
import Auth from '@/pages/Auth';
import Tickets from '@/pages/Tickets';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/tickets" element={<Tickets />} />
        <Route path="/" element={<Navigate to="/tickets" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;