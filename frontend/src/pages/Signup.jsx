import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

function Signup() {
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
      await api.post("/auth/signup", {
        email,
        password,
      });

      navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to create account"
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
                YOUR HEALTHCARE COMPANION
              </p>

              <h1>
                Take control
                <br />
                of your care.
              </h1>

              <p>
                Create your EVE Healthcare account and
                make diagnostic appointments simpler,
                faster, and easier to manage.
              </p>
            </div>

            <div className="auth-feature-list">
              <div className="auth-feature">
                <span>01</span>

                <div>
                  <strong>Find nearby care</strong>

                  <p>
                    Browse diagnostic centres and services.
                  </p>
                </div>
              </div>

              <div className="auth-feature">
                <span>02</span>

                <div>
                  <strong>Choose your test</strong>

                  <p>
                    Compare available diagnostic tests.
                  </p>
                </div>
              </div>

              <div className="auth-feature">
                <span>03</span>

                <div>
                  <strong>Book with confidence</strong>

                  <p>
                    Select an available appointment slot.
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
                GET STARTED
              </p>

              <h2>Create your account</h2>

              <p>
                Join EVE Healthcare and start managing
                your diagnostic appointments.
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
                <label htmlFor="signup-email">
                  Email address
                </label>

                <input
                  id="signup-email"
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
                <label htmlFor="signup-password">
                  Password
                </label>

                <input
                  id="signup-password"
                  type="password"
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  minLength={8}
                  autoComplete="new-password"
                  required
                />

                <span className="field-hint">
                  Use at least 8 characters for your password.
                </span>
              </div>

              <button
                type="submit"
                className="auth-submit"
                disabled={loading}
              >
                {loading
                  ? "Creating account..."
                  : "Create account"}

                {!loading && <span>→</span>}
              </button>
            </form>

            <div className="auth-divider">
              <span>OR</span>
            </div>

            <p className="auth-footer">
              Already have an account?{" "}
              <Link to="/">
                Sign in
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

export default Signup;