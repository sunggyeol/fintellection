export default function SettingsPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your preferences and data
        </p>
      </div>

      <div className="space-y-4">
        <div className="border border-border bg-card p-4">
          <h3 className="mb-1 text-sm font-medium text-foreground">Theme</h3>
          <p className="text-xs text-muted-foreground">
            Light mode is active. Dark mode toggle coming soon.
          </p>
        </div>

        <div className="border border-border bg-card p-4">
          <h3 className="mb-1 text-sm font-medium text-foreground">
            Clear All Data
          </h3>
          <p className="mb-3 text-xs text-muted-foreground">
            Remove all watchlists, research history, and preferences from this
            browser.
          </p>
          <button className="bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/20">
            Clear Data
          </button>
        </div>
      </div>
    </div>
  );
}
