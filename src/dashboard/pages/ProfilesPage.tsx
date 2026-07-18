import { ProfileEditor } from '../components/profile/ProfileEditor';
import { ProfileList } from '../components/profile/ProfileList';
import { useProfiles } from '../hooks/useProfiles';

export function ProfilesPage() {
  const {
    profiles,
    selectedProfile,
    selectedProfileId,
    loading,
    setSelectedProfileId,
    updateSelectedProfile,
    createProfile,
    duplicateProfile,
    deleteProfile,
    persistSelectedProfile,
  } = useProfiles();

  if (loading) {
    return (
      <section className="panel card">
        <h2 className="section-title">Loading profiles...</h2>
      </section>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 360px) minmax(0, 1fr)', gap: 20, alignItems: 'start' }}>
      <ProfileList
        profiles={profiles}
        selectedProfileId={selectedProfileId}
        onSelect={setSelectedProfileId}
        onCreate={createProfile}
        onDuplicate={duplicateProfile}
        onDelete={deleteProfile}
      />
      <ProfileEditor profile={selectedProfile} onChange={updateSelectedProfile} onSave={persistSelectedProfile} />
    </div>
  );
}
