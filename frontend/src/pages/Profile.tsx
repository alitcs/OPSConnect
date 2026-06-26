import { useAuth } from '../context/AuthContext';
import ProfileSection1 from '../components/ProfileSection1';
import ProfileSection2 from '../components/ProfileSection2';

// The user's own profile: Section 1 (read-only business card) + a subtle separator +
// Section 2 (editable extended info). Section 2 is always visible — no accordion.
export default function ProfilePage() {
  const { currentUser } = useAuth();
  if (!currentUser) return null;

  return (
    <div className="page">
      <div className="page__inner">
        <h1 className="page__title">My Profile</h1>
        <p className="page__subtitle">
          Section 1 is auto-populated. Fill in Section 2 to help others (and the AI) find you.
        </p>

        <ProfileSection1 user={currentUser} />

        <div className="profile__section-sep" />

        <ProfileSection2 key={currentUser.id} user={currentUser} />
      </div>
    </div>
  );
}
