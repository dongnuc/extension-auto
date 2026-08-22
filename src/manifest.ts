const manifest = {
  manifest_version: 3,
  name: 'Gemini Gem Auto Flow',
  description: 'Automate Gemini Gem processing flows for batched scripts.',
  version: '0.1.0',
  permissions: ['storage', 'tabs', 'downloads', 'scripting'],
  host_permissions: ['https://gemini.google.com/*', 'https://docs.google.com/*', 'https://script.google.com/*', 'https://translate.googleapis.com/*', 'https://www.youtube.com/*', 'https://youtu.be/*', 'https://*.supabase.co/*'],
  background: {
    service_worker: 'src/background/service-worker.ts',
    type: 'module',
  },
  action: {
    default_title: 'Gem Auto Flow',
    default_popup: 'src/popup/index.html',
  },
  options_page: 'src/dashboard/index.html',
  content_scripts: [
    {
      matches: ['https://gemini.google.com/*'],
      js: ['src/content/gemini-content.ts'],
      run_at: 'document_idle',
    },
    {
      matches: ['https://www.youtube.com/*', 'https://youtu.be/*'],
      js: ['src/content/youtube-content.ts'],
      run_at: 'document_idle',
    },
  ],
  web_accessible_resources: [
    {
      resources: ['src/assets/*'],
      matches: ['https://gemini.google.com/*'],
    },
  ],
};

export default manifest;
