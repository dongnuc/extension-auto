import { useEffect, useMemo, useState } from 'react';
import { GoogleSheetsPage } from './pages/GoogleSheetsPage';
import { ProfilesPage } from './pages/ProfilesPage';
import { ResultsPage } from './pages/ResultsPage';
import { RunCalendarPage } from './pages/RunCalendarPage';
import { RunPage } from './pages/RunPage';
import { ScriptsPage } from './pages/ScriptsPage';

const sections = [
  { id: 'profiles', label: 'Profiles' },
  { id: 'scripts', label: 'Scripts' },
  { id: 'google-sheets', label: 'Google Sheets' },
  { id: 'run', label: 'Run' },
  { id: 'results', label: 'Results' },
  { id: 'run-calendar', label: 'Run Calendar' },
] as const;

type SectionId = (typeof sections)[number]['id'];

function getSectionFromHash(): SectionId {
  const hash = window.location.hash.replace(/^#\/?/, '');
  return sections.some((section) => section.id === hash) ? hash as SectionId : 'profiles';
}

function navigateToSection(sectionId: SectionId): void {
  window.location.hash = `/${sectionId}`;
}

export function DashboardApp() {
  const [activeSection, setActiveSection] = useState<SectionId>(() => getSectionFromHash());

  useEffect(() => {
    const onHashChange = () => setActiveSection(getSectionFromHash());
    window.addEventListener('hashchange', onHashChange);
    if (!window.location.hash) {
      navigateToSection('profiles');
    }
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const content = useMemo(() => {
    switch (activeSection) {
      case 'profiles':
        return <ProfilesPage />;
      case 'scripts':
        return <ScriptsPage />;
      case 'google-sheets':
        return <GoogleSheetsPage />;
      case 'run':
        return <RunPage />;
      case 'results':
        return <ResultsPage />;
      case 'run-calendar':
        return <RunCalendarPage />;
      default:
        return null;
    }
  }, [activeSection]);

  return (
    <div className="shell" style={{ display: 'grid', gap: 20 }}>
      <header
        className="panel card"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}
      >
        <div>
          <span className="badge">MVP Foundation</span>
          <h1 style={{ margin: '14px 0 6px', fontSize: 28 }}>Gemini Gem Auto Flow Dashboard</h1>
          <p style={{ margin: 0, maxWidth: 780, color: '#aabbd6' }}>
            Manage Gemini Gem profiles, prepare script batches, configure runs, and review results from one workspace.
          </p>
        </div>
        <nav style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {sections.map((section) => (
            <button
              key={section.id}
              className={`button ${activeSection === section.id ? '' : 'secondary'}`}
              onClick={() => navigateToSection(section.id)}
              type="button"
            >
              {section.label}
            </button>
          ))}
        </nav>
      </header>
      {content}
    </div>
  );
}
