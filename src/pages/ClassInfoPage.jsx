import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import ClassInfo from '../components/ClassInfo';

export default function ClassInfoPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) navigate('/');
  }, [currentUser, navigate]);

  if (!currentUser) return null;

  return (
    <div className="profile-page">
      <ClassInfo />
    </div>
  );
}
