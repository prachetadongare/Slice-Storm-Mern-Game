import { useState } from "react";
import "../styles/auth.css";

const API_URL = "http://localhost:5000/api/auth";

function AuthPage({ onBack, onAuthenticated }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setMessage("");
    setError(false);
    setLoading(true);

    try {
      const endpoint = isRegister ? "register" : "login";

      const response = await fetch(`${API_URL}/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          isRegister ? { username, email, password } : { email, password },
        ),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Authentication failed.");
      }

      // Save the token and basic user information for this session.
      sessionStorage.setItem("sliceStormToken", data.token);
      sessionStorage.setItem("sliceStormUser", JSON.stringify(data.user));

      onAuthenticated(data.user);
    } catch (err) {
      setError(true);
      setMessage(
        err.message === "Failed to fetch"
          ? "Cannot reach the server. Check that your backend is running."
          : err.message,
      );
    } finally {
      setLoading(false);
    }
  }

  function switchForm() {
    setIsRegister((current) => !current);
    setMessage("");
    setError(false);
  }

  return (
    <section className="auth-screen">
      <div className="auth-card">
        <button type="button" className="auth-back" onClick={onBack}>
          ← Back to menu
        </button>

        <div className="auth-logo">✦ SLICE STORM</div>

        <p className="auth-eyebrow">YOUR NEXT ADVENTURE STARTS HERE</p>

        <h1>{isRegister ? "Create Account" : "Welcome Back"}</h1>

        <p className="auth-subtitle">
          {isRegister
            ? "Join the arena and begin your slicing journey."
            : "Log in to continue your fruit-slicing adventure."}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {isRegister && (
            <label>
              Username
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Choose a username"
                minLength={3}
                maxLength={30}
                autoComplete="username"
                required
              />
            </label>
          )}

          <label>
            Email address
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={
                isRegister ? "At least 8 characters" : "Enter your password"
              }
              minLength={isRegister ? 8 : undefined}
              autoComplete={isRegister ? "new-password" : "current-password"}
              required
            />
          </label>

          {message && (
            <p
              className={`auth-message ${error ? "auth-error" : "auth-success"}`}
              role="status"
            >
              {message}
            </p>
          )}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading
              ? "PLEASE WAIT..."
              : isRegister
                ? "CREATE ACCOUNT"
                : "LOGIN AND PLAY"}
          </button>
        </form>

        <p className="auth-switch">
          {isRegister ? "Already have an account?" : "New to Slice Storm?"}{" "}
          <button type="button" onClick={switchForm}>
            {isRegister ? "Login" : "Register"}
          </button>
        </p>

        <p className="auth-footer">
          ✦ READY YOUR BLADE · TRUST YOUR REFLEXES ✦
        </p>
      </div>
    </section>
  );
}

export default AuthPage;
