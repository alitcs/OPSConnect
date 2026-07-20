import { useAuth } from '../context/AuthContext';
import ProfileSection1 from '../components/ProfileSection1';
import ProfileSection2 from '../components/ProfileSection2';
import ActivityMetric from '../components/ActivityMetric';

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
          Auto-filled up top. Add details below so others can find you.
        </p>

        <ProfileSection1 user={currentUser} self />

        <div className="profile__section-sep" />

        <ActivityMetric />

        <div className="profile__section-sep" />

        <ProfileSection2 key={currentUser.id} user={currentUser} />
      </div>
    </div>
  );
}
