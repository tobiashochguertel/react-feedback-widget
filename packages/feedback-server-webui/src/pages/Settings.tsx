import { useState } from "react";
import { useAuthStore } from "../stores/auth";
import { Moon, Sun, Key, Bell, Palette, Save, Loader2 } from "lucide-react";

/**
 * Settings page for application configuration
 */
export function SettingsPage() {
  const apiKey = useAuthStore((state) => state.apiKey);
  const setApiKey = useAuthStore((state) => state.setApiKey);

  const [newApiKey, setNewApiKey] = useState(apiKey || "");
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.classList.contains("dark")
  );
  const [notifications, setNotifications] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleDarkModeToggle = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleSaveApiKey = async () => {
    if (!newApiKey.trim()) {
      setMessage("API key cannot be empty");
      return;
    }

    setIsSaving(true);
    setMessage("");

    try {
      // Validate the new API key
      const response = await fetch("/api/v1/health", {
        headers: {
          "X-API-Key": newApiKey,
        },
      });

      if (!response.ok) {
        throw new Error("Invalid API key");
      }

      setApiKey(newApiKey);
      setMessage("API key updated successfully");
    } catch {
      setMessage("Invalid API key. Please check and try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your application preferences
        </p>
      </div>

      {/* API Key section */}
      <section className="bg-card rounded-lg border border-border p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <Key className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">API Key</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Update your API key for authentication
        </p>
        <div className="flex gap-3">
          <input
            type="password"
            value={newApiKey}
            onChange={(e) => setNewApiKey(e.target.value)}
            placeholder="Enter new API key"
            className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={handleSaveApiKey}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save
          </button>
        </div>
        {message && (
          <p
            className={`mt-3 text-sm ${message.includes("success") ? "text-green-600" : "text-red-600"
              }`}
          >
            {message}
          </p>
        )}
      </section>

      {/* Appearance section */}
      <section className="bg-card rounded-lg border border-border p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <Palette className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Appearance</h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-foreground">Dark Mode</p>
            <p className="text-sm text-muted-foreground">
              Toggle dark mode for the interface
            </p>
          </div>
          <button
            onClick={handleDarkModeToggle}
            className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
            style={{
              backgroundColor: isDarkMode
                ? "rgb(var(--color-primary))"
                : "rgb(var(--color-muted))",
            }}
          >
            <span
              className="inline-flex h-4 w-4 transform items-center justify-center rounded-full bg-white transition-transform"
              style={{
                transform: isDarkMode ? "translateX(1.5rem)" : "translateX(0.25rem)",
              }}
            >
              {isDarkMode ? (
                <Moon className="w-3 h-3 text-gray-800" />
              ) : (
                <Sun className="w-3 h-3 text-yellow-500" />
              )}
            </span>
          </button>
        </div>
      </section>

      {/* Notifications section */}
      <section className="bg-card rounded-lg border border-border p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-foreground">Desktop Notifications</p>
            <p className="text-sm text-muted-foreground">
              Receive notifications for new feedback
            </p>
          </div>
          <button
            onClick={() => setNotifications(!notifications)}
            className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
            style={{
              backgroundColor: notifications
                ? "rgb(var(--color-primary))"
                : "rgb(var(--color-muted))",
            }}
          >
            <span
              className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
              style={{
                transform: notifications
                  ? "translateX(1.5rem)"
                  : "translateX(0.25rem)",
              }}
            />
          </button>
        </div>
      </section>

      {/* Version info */}
      <section className="text-center text-sm text-muted-foreground">
        <p>Feedback Admin Dashboard v0.1.0</p>
        <p className="mt-1">
          <a
            href="https://github.com/tobiashochguertel/react-feedback-widget"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            View on GitHub
          </a>
        </p>
      </section>
    </div>
  );
}
