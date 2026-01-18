import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound, Loader2 } from "lucide-react";
import { useAuthStore } from "../stores/auth";

/**
 * Login page with API key authentication
 */
export function LoginPage() {
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!apiKey.trim()) {
      setError("API key is required");
      return;
    }

    setIsLoading(true);

    try {
      // Validate API key by making a test request
      const response = await fetch("/api/v1/health", {
        headers: {
          "X-API-Key": apiKey,
        },
      });

      if (!response.ok) {
        throw new Error("Invalid API key");
      }

      // API key is valid, store it and redirect
      login(apiKey);
      navigate("/dashboard");
    } catch {
      setError("Invalid API key. Please check and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <KeyRound className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Feedback Admin
          </h1>
          <p className="text-muted-foreground mt-2">
            Enter your API key to access the dashboard
          </p>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="bg-card rounded-lg border border-border p-6 shadow-sm">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="apiKey"
                className="block text-sm font-medium text-foreground mb-2"
              >
                API Key
              </label>
              <input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your API key"
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Validating...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </div>
        </form>

        {/* Help text */}
        <p className="text-center text-sm text-muted-foreground mt-4">
          Don't have an API key?{" "}
          <a href="#" className="text-primary hover:underline">
            Contact your administrator
          </a>
        </p>
      </div>
    </div>
  );
}
