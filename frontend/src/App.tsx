import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { PollProvider } from './context/PollContext';
import { useSocket } from './hooks/useSocket';
import RoleSelectPage from './pages/RoleSelectPage';
import StudentPage from './pages/StudentPage';
import TeacherPage from './pages/TeacherPage';

const SocketInitializer = () => {
  useSocket(); // Initialize socket listeners
  return null;
};

function App() {
  return (
    <PollProvider>
      <SocketInitializer />
      <Router>
        <Routes>
          <Route path="/" element={<RoleSelectPage />} />
          <Route path="/student" element={<StudentPage />} />
          <Route path="/teacher" element={<TeacherPage />} />
        </Routes>
      </Router>
    </PollProvider>
  );
}

export default App;
