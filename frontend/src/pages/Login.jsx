import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const formData = new URLSearchParams();

      formData.append("username", email);
      formData.append("password", password);

      const response = await api.post(
        "/auth/login",
        formData,
        {
          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded",
          },
        }
      );

      localStorage.setItem(
        "access_token",
        response.data.access_token
      );

      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Invalid email or password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-shell">
        <div className="auth-visual">
          <div className="auth-visual-content">
            <div className="auth-brand">
              <span className="brand-icon">+</span>
              <span>EVE Healthcare</span>
            </div>

            <div className="auth-visual-copy">
              <p className="auth-eyebrow">
                HEALTHCARE, SIMPLIFIED
              </p>

              <h1>
                Better care
                <br />
                starts here.
              </h1>

              <p>
                Find diagnostic centres, book tests,
                and manage your appointments from one
                simple healthcare platform.
              </p>
            </div>

            <div className="auth-feature-list">
              <div className="auth-feature">
                <span>✓</span>

                <div>
                  <strong>Easy appointments</strong>

                  <p>
                    Choose a convenient date and time.
                  </p>
                </div>
              </div>

              <div className="auth-feature">
                <span>✓</span>

                <div>
                  <strong>Trusted diagnostics</strong>

                  <p>
                    Explore tests across diagnostic centres.
                  </p>
                </div>
              </div>

              <div className="auth-feature">
                <span>✓</span>

                <div>
                  <strong>Simple management</strong>

                  <p>
                    Keep your bookings together in one place.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="auth-decoration decoration-one"></div>
          <div className="auth-decoration decoration-two"></div>
        </div>

        <div className="auth-form-side">
          <div className="auth-form-card">
            <div className="mobile-auth-brand">
              <span className="brand-icon">+</span>
              <span>EVE Healthcare</span>
            </div>

            <div className="auth-heading">
              <p className="auth-form-eyebrow">
                WELCOME BACK
              </p>

              <h2>Sign in to your account</h2>

              <p>
                Access your appointments and diagnostic
                bookings.
              </p>
            </div>

            {error && (
              <div
                className="error-message"
                role="alert"
              >
                <span>!</span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-field">
                <label htmlFor="login-email">
                  Email address
                </label>

                <input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  autoComplete="email"
                  required
                />
              </div>

              <div className="form-field">
                <div className="password-label-row">
                  <label htmlFor="login-password">
                    Password
                  </label>
                </div>

                <input
                  id="login-password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  autoComplete="current-password"
                  required
                />
              </div>

              <button
                type="submit"
                className="auth-submit"
                disabled={loading}
              >
                {loading
                  ? "Signing in..."
                  : "Sign in"}

                {!loading && <span>→</span>}
              </button>
            </form>

            <div className="auth-divider">
              <span>OR</span>
            </div>

            <p className="auth-footer">
              Don't have an account?{" "}
              <Link to="/signup">
                Create one
              </Link>
            </p>

            <p className="auth-security">
              <span>●</span>
              Your account information is securely handled.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Login;