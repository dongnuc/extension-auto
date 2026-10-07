import { useEffect, useMemo, useState } from 'react';
import { DashboardPage } from './pages/DashboardPage';
import { GoogleSheetsPage } from './pages/GoogleSheetsPage';
import { ProfilesPage } from './pages/ProfilesPage';
import { ResultsPage } from './pages/ResultsPage';
import { RunCalendarPage } from './pages/RunCalendarPage';
import { RunPage } from './pages/RunPage';
import { ScriptsPage } from './pages/ScriptsPage';

const sections = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: '⌂',
    eyebrow: 'MVP Foundation',
    title: 'Automation Control Center',
    description: 'Manage Gemini Gem profiles, prepare script batches, configure runs, and review results from one workspace.',
  },
  {
    id: 'profiles',
    label: 'Profiles',
    icon: '◉',
    eyebrow: 'Configuration',
    title: 'Gemini Profiles',
    description: 'Create and maintain Gemini Gem profiles, stage settings, and output behavior.',
  },
  {
    id: 'scripts',
    label: 'Scripts',
    icon: '▦',
    eyebrow: 'Preparation',
    title: 'Scripts and Batches',
    description: 'Prepare script batches, import prompts, and organize stages before launching automation.',
  },
  {
    id: 'google-sheets',
    label: 'Google Sheets',
    icon: '▤',
    eyebrow: 'Import',
    title: 'Google Sheets',
    description: 'Configure sheet sources and imports while preserving the existing Google Sheets workflow.',
  },
  {
    id: 'run',
    label: 'Run',
    icon: '▶',
    eyebrow: 'Runtime',
    title: 'Run Automation',
    description: 'Configure and launch Gemini Auto Flow runs using existing profiles, batches, and data sources.',
  },
  {
    id: 'results',
    label: 'Results',
    icon: '✓',
    eyebrow: 'Review',
    title: 'Results',
    description: 'Review automation outputs, runtime artifacts, write-back status, and saved run details.',
  },
  {
    id: 'run-calendar',
    label: 'Run Calendar',
    icon: '◷',
    eyebrow: 'History',
    title: 'Run Calendar',
    description: 'Inspect run history and calendar-oriented runtime records.',
  },
] as const;

type SectionId = (typeof sections)[number]['id'];

function getSectionFromHash(): SectionId {
  const hash = window.location.hash.replace(/^#\/?/, '');
  return sections.some((section) => section.id === hash) ? hash as SectionId : 'dashboard';
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
      navigateToSection('dashboard');
    }
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const activeMetadata = sections.find((section) => section.id === activeSection) ?? sections[0];

  const content = useMemo(() => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardPage />;
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
    <div className="app-shell">
      <aside className="sidebar" aria-label="Dashboard navigation">
        <div className="sidebar-brand">
          <span className="sidebar-brand-mark">G</span>
          <span>Gemini Auto Flow</span>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-group-label">Workspace</div>
          {sections.map((section) => (
            <button
              key={section.id}
              className={`sidebar-item ${activeSection === section.id ? 'active' : ''}`}
              onClick={() => navigateToSection(section.id)}
              type="button"
            >
              <span className="sidebar-icon" aria-hidden="true">{section.icon}</span>
              <span>{section.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">Dark Automation System</div>
      </aside>

      <main className="main-shell">
        <header className="page-header">
          <div>
            <p className="page-eyebrow">{activeMetadata.eyebrow}</p>
            <h1 className="page-title">{activeMetadata.title}</h1>
            <p className="page-description">{activeMetadata.description}</p>
          </div>
        </header>
        {content}
      </main>
    </div>
  );
}
