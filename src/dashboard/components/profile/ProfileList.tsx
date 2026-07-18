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
    <section className="panel card" style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div>
          <h2 className="section-title">Gem Profiles</h2>
          <p className="section-subtitle">Create and manage reusable Gemini Gem automation flows.</p>
        </div>
        <button className="button" onClick={onCreate} type="button">
          New Profile
        </button>
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
        {profiles.map((profile) => {
          const selected = selectedProfileId === profile.id;
          return (
            <button
              key={profile.id}
              type="button"
              onClick={() => onSelect(profile.id)}
              className="button ghost"
              style={{
                textAlign: 'left',
                padding: 16,
                borderRadius: 16,
                background: selected ? 'rgba(37, 99, 235, 0.18)' : 'rgba(2, 6, 23, 0.32)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div>
                  <strong style={{ display: 'block', marginBottom: 6 }}>{profile.name}</strong>
                  <span style={{ color: '#9fb1cd', fontSize: 13 }}>{profile.id}</span>
                </div>
                <span className="badge">{profile.enabled ? 'Enabled' : 'Disabled'}</span>
              </div>
              <div style={{ marginTop: 10, color: '#bfd0ea', fontSize: 13 }}>
                {profile.stages.length} stage(s) • Output: {profile.outputStageId}
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
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
