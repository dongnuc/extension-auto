import type { GemProfile } from '../../../core/models';

interface ProfileListProps {
  profiles: GemProfile[];
  selectedProfileId: string | null;
  onSelect: (profileId: string) => void;
  onCreate: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export function ProfileList({
  profiles,
  selectedProfileId,
  onSelect,
  onCreate,
  onDuplicate,
  onDelete,
}: ProfileListProps) {
  return (
    <section className="panel card section-stack profile-list-panel">
      <div className="section-toolbar">
        <div>
          <h2 className="section-title">Gem Profiles</h2>
          <p className="section-subtitle">Create and manage reusable Gemini Gem automation flows.</p>
        </div>
        <button className="button" onClick={onCreate} type="button">
          New Profile
        </button>
      </div>

      <div className="compact-list">
        {profiles.length === 0 ? (
          <div className="empty-state compact-empty">
            <h3>No profiles yet</h3>
            <p>Create a Gemini profile to define stages, output, and export options.</p>
          </div>
        ) : profiles.map((profile) => {
          const selected = selectedProfileId === profile.id;
          return (
            <button
              key={profile.id}
              type="button"
              onClick={() => onSelect(profile.id)}
              className={`selectable-card ${selected ? 'selected' : ''}`}
            >
              <div className="selectable-card-header">
                <div>
                  <strong>{profile.name}</strong>
                  <span>{profile.id}</span>
                </div>
                <span className={`status-badge ${profile.enabled ? 'enabled' : 'disabled'}`}>{profile.enabled ? 'Enabled' : 'Disabled'}</span>
              </div>
              <div className="meta-row">
                <span>{profile.stages.length} stage(s)</span>
                <span>Output: {profile.outputStageId}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="action-row">
        <button className="button secondary" onClick={onDuplicate} type="button">
          Duplicate
        </button>
        <button className="button secondary" onClick={onDelete} type="button">
          Delete
        </button>
      </div>
    </section>
  );
}
