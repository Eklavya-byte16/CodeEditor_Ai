import React, { useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import PixelBlast from "@/Components/ui/PixelBlast.jsx";
import "./Login.css";

const API_BASE = import.meta.env.VITE_BACKEND_URL;

const Signup = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Same flow as Login.jsx — see note there re: access_token vs ID token
  // if your backend verifies a Google credential/JWT instead.
  const handleGoogleSignup = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setError("");
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/auth/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ access_token: tokenResponse.access_token }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || "Google sign-up failed.");
        }

        console.log("google signup success");
        // TODO: redirect on success, e.g. navigate('/dashboard')
      } catch (err) {
        setError(err.message || "Something went wrong. Try again.");
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError("Google sign-up failed."),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const { username, email, password, confirmPassword } = formData;

    if (!username || !email || !password || !confirmPassword) {
      setError("Fill in every field.");
      return;
    }

    if (username.trim().length < 3) {
      setError("Username needs at least 3 characters.");
      return;
    }

    if (password.length < 8) {
      setError("Password needs at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        // Flat object, no confirmPassword — the backend only needs
        // the fields it will actually store/verify.
        body: JSON.stringify({ username, email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Can't create account.");
      }

      console.log("signup success", { username, email });
      // TODO: redirect on success, e.g. navigate('/login')
    } catch (err) {
      setError(err.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        position: "relative",
        background: "black",
      }}
    >
      {/* Background */}
      <PixelBlast
        variant="square"
        pixelSize={4}
        color="#B497CF"
        patternScale={2}
        patternDensity={1}
        pixelSizeJitter={0}
        enableRipples
        rippleSpeed={0.4}
        rippleThickness={0.12}
        rippleIntensityScale={1.5}
        liquid={false}
        liquidStrength={0.12}
        liquidRadius={1.2}
        liquidWobbleSpeed={5}
        speed={0.5}
        edgeFade={0.25}
        transparent
      />

      <div className="login-wrap">
        <div className="login-card">
          <div className="login-head">
            <span className="login-eyebrow">NEW SESSION</span>
            <h1 className="login-title">Create your account</h1>
            <p className="login-subtext">Start building in minutes.</p>
          </div>
          {/* Google sign in btn */}
          <button
            type="button"
            className="google-btn"
            onClick={() => handleGoogleSignup()}
            disabled={loading}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.85 2.09-1.81 2.73v2.27h2.92c1.71-1.57 2.69-3.89 2.69-6.64z"
              />
              <path
                fill="#34A853"
                d="M9 18c2.43 0 4.47-.8 5.96-2.16l-2.92-2.27c-.81.54-1.85.87-3.04.87-2.34 0-4.32-1.58-5.03-3.71H.96v2.33C2.44 15.98 5.48 18 9 18z"
              />
              <path
                fill="#FBBC05"
                d="M3.97 10.73c-.18-.54-.28-1.11-.28-1.73s.1-1.19.28-1.73V4.94H.96A8.996 8.996 0 000 9c0 1.45.35 2.83.96 4.06l3.01-2.33z"
              />
              <path
                fill="#EA4335"
                d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.94l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="login-divider">
            <span>or use your email</span>
          </div>

          {/* OUR LOGIN BTN */}

          <form className="login-form" onSubmit={handleSubmit}>
            <label className="login-label" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              placeholder="yourname"
              value={formData.username}
              onChange={handleChange}
              className="login-input"
            />

            <label className="login-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              className="login-input"
            />

            <label className="login-label" htmlFor="password">
              Password
            </label>
            <div className="login-password-field">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className="login-input"
              />
              <button
                type="button"
                className="toggle-visibility"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "hide" : "show"}
              </button>
            </div>

            <label className="login-label" htmlFor="confirmPassword">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="login-input"
            />

            {error && <p className="login-error">{error}</p>}

            <button type="submit" className="login-submit" disabled={loading}>
              <span className="login-submit-dot" />
              <span>{loading ? "creating account" : "create-account"}</span>
              {!loading && <span className="login-submit-cursor" />}
            </button>
          </form>

          <p className="login-footer">
            Already have an account?{" "}
            <a href="/login" className="login-link">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;