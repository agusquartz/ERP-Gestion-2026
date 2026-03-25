// import Image from "next/image";

// export default function Home() {
//   return (
//     <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
//       <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
//         <Image
//           className="dark:invert"
//           src="/next.svg"
//           alt="Next.js logo"
//           width={100}
//           height={20}
//           priority
//         />
//         <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
//           <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
//             To get started, edit the page.js file.
//           </h1>
//           <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
//             Looking for a starting point or more instructions? Head over to{" "}
//             <a
//               href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//               className="font-medium text-zinc-950 dark:text-zinc-50"
//             >
//               Templates
//             </a>{" "}
//             or the{" "}
//             <a
//               href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//               className="font-medium text-zinc-950 dark:text-zinc-50"
//             >
//               Learning
//             </a>{" "}
//             center.
//           </p>
//         </div>
//         <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
//           <a
//             className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
//             href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//             target="_blank"
//             rel="noopener noreferrer"
//           >
//             <Image
//               className="dark:invert"
//               src="/vercel.svg"
//               alt="Vercel logomark"
//               width={16}
//               height={16}
//             />
//             Deploy Now
//           </a>
//           <a
//             className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
//             href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//             target="_blank"
//             rel="noopener noreferrer"
//           >
//             Documentation
//           </a>
//         </div>
//       </main>
//     </div>
//   );
// }
"use client"
import { useState } from "react";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --white: #ffffff;
    --bg: #F2F3F7;
    --blue: #185bff;
    --blue-hover: #0f47d9;
    --blue-light: rgba(24, 91, 255, 0.08);
    --shadow: 2px 2px 5px #555555;
    --shadow-card: 2px 2px 5px #555555;
    --radius: 5px;
    --text-dark: #1a1d2e;
    --text-muted: #7a7f99;
    --border: #e0e3f0;
  }

  .login-root {
    min-height: 100vh;
    background: var(--bg);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'DM Sans', sans-serif;
    padding: 24px;
  }

  .login-card {
    background: var(--white);
    border-radius: var(--radius);
    box-shadow: var(--shadow-card);
    display: flex;
    width: 100%;
    max-width: 860px;
    min-height: 520px;
    overflow: hidden;
  }

  /* ── Left panel ── */
  .login-panel-left {
    background: var(--blue);
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 40px;
    position: relative;
    overflow: hidden;
  }

  .login-panel-left::before {
    content: '';
    position: absolute;
    width: 320px;
    height: 320px;
    border-radius: 50%;
    background: rgba(255,255,255,0.06);
    top: -80px;
    right: -80px;
  }

  .login-panel-left::after {
    content: '';
    position: absolute;
    width: 200px;
    height: 200px;
    border-radius: 50%;
    background: rgba(255,255,255,0.05);
    bottom: -60px;
    left: -40px;
  }

  .brand-logo {
    width: 52px;
    height: 52px;
    background: var(--white);
    border-radius: var(--radius);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 28px;
    box-shadow: var(--shadow);
    position: relative;
    z-index: 1;
  }

  .brand-logo svg {
    width: 28px;
    height: 28px;
  }

  .panel-headline {
    font-family: 'Syne', sans-serif;
    font-size: 28px;
    font-weight: 800;
    color: var(--white);
    text-align: center;
    line-height: 1.2;
    margin-bottom: 16px;
    position: relative;
    z-index: 1;
  }

  .panel-sub {
    font-size: 14px;
    color: rgba(255,255,255,0.72);
    text-align: center;
    line-height: 1.6;
    position: relative;
    z-index: 1;
    max-width: 220px;
  }

  .panel-dots {
    display: flex;
    gap: 8px;
    margin-top: 36px;
    position: relative;
    z-index: 1;
  }

  .panel-dots span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: rgba(255,255,255,0.35);
  }

  .panel-dots span.active {
    background: var(--white);
    width: 22px;
    border-radius: 4px;
  }

  /* ── Right panel (form) ── */
  .login-panel-right {
    flex: 1.1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 48px 48px;
  }

  .form-eyebrow {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--blue);
    margin-bottom: 10px;
  }

  .form-title {
    font-family: 'Syne', sans-serif;
    font-size: 26px;
    font-weight: 700;
    color: var(--text-dark);
    margin-bottom: 6px;
  }

  .form-subtitle {
    font-size: 13.5px;
    color: var(--text-muted);
    margin-bottom: 32px;
  }

  .field-group {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 24px;
  }

  .field-label {
    display: block;
    font-size: 12.5px;
    font-weight: 500;
    color: var(--text-dark);
    margin-bottom: 6px;
    letter-spacing: 0.01em;
  }

  .input-wrap {
    position: relative;
  }

  .input-icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-muted);
    display: flex;
    align-items: center;
    pointer-events: none;
    transition: color 0.2s;
  }

  .input-field {
    width: 100%;
    height: 44px;
    padding: 0 14px 0 42px;
    border: 1.5px solid var(--border);
    border-radius: var(--radius);
    background: var(--bg);
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    color: var(--text-dark);
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
  }

  .input-field::placeholder {
    color: #b0b5cc;
  }

  .input-field:focus {
    border-color: var(--blue);
    background: var(--white);
    box-shadow: var(--shadow);
  }

  .input-field:focus + .input-icon-after,
  .input-wrap:focus-within .input-icon {
    color: var(--blue);
  }

  .row-opts {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 28px;
  }

  .remember-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: var(--text-muted);
    cursor: pointer;
    user-select: none;
  }

  .custom-checkbox {
    width: 16px;
    height: 16px;
    border: 1.5px solid var(--border);
    border-radius: 3px;
    background: var(--bg);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.2s;
  }

  .custom-checkbox.checked {
    background: var(--blue);
    border-color: var(--blue);
  }

  .custom-checkbox svg {
    width: 10px;
    height: 10px;
  }

  .forgot-link {
    font-size: 13px;
    color: var(--blue);
    text-decoration: none;
    font-weight: 500;
    cursor: pointer;
  }

  .forgot-link:hover {
    text-decoration: underline;
  }

  .btn-login {
    width: 100%;
    height: 46px;
    background: var(--blue);
    color: var(--white);
    border: none;
    border-radius: var(--radius);
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: var(--shadow);
    transition: background 0.18s, transform 0.12s, box-shadow 0.18s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    letter-spacing: 0.01em;
    margin-bottom: 24px;
  }

  .btn-login:hover {
    background: var(--blue-hover);
  }

  .btn-login:active {
    transform: translateY(1px);
    box-shadow: 1px 1px 3px #555555;
  }

  .btn-login.loading {
    opacity: 0.8;
    pointer-events: none;
  }

  .divider {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
  }

  .divider-line {
    flex: 1;
    height: 1px;
    background: var(--border);
  }

  .divider-text {
    font-size: 12px;
    color: var(--text-muted);
    white-space: nowrap;
  }

  .btn-google {
    width: 100%;
    height: 44px;
    background: var(--white);
    color: var(--text-dark);
    border: 1.5px solid var(--border);
    border-radius: var(--radius);
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    transition: border-color 0.18s, box-shadow 0.18s;
    margin-bottom: 28px;
  }

  .btn-google:hover {
    border-color: var(--blue);
    box-shadow: var(--shadow);
  }

  .signup-row {
    text-align: center;
    font-size: 13px;
    color: var(--text-muted);
  }

  .signup-link {
    color: var(--blue);
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
  }

  .signup-link:hover { text-decoration: underline; }

  .success-banner {
    background: var(--blue-light);
    border: 1px solid rgba(24,91,255,0.25);
    border-radius: var(--radius);
    padding: 12px 16px;
    font-size: 13.5px;
    color: var(--blue);
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .spinner {
    width: 18px;
    height: 18px;
    border: 2.5px solid rgba(255,255,255,0.4);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  @media (max-width: 620px) {
    .login-panel-left { display: none; }
    .login-panel-right { padding: 36px 28px; }
    .login-card { max-width: 420px; }
  }
`;

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!email || !/\S+@\S+\.\S+/.test(email)) e.email = "Enter a valid email";
    if (!password || password.length < 6) e.password = "Min. 6 characters";
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setLoading(true);
    setTimeout(() => { setLoading(false); setSuccess(true); }, 1800);
  };

  return (
    <>
      <style>{styles}</style>
      <div className="login-root">
        <div className="login-card">

          {/* Left Panel */}
          <div className="login-panel-left">
            <div className="brand-logo">
              <svg viewBox="0 0 28 28" fill="none">
                <rect x="3" y="3" width="10" height="10" rx="2" fill="#185bff"/>
                <rect x="15" y="3" width="10" height="10" rx="2" fill="#185bff" opacity=".5"/>
                <rect x="3" y="15" width="10" height="10" rx="2" fill="#185bff" opacity=".5"/>
                <rect x="15" y="15" width="10" height="10" rx="2" fill="#185bff"/>
              </svg>
            </div>
            <h2 className="panel-headline">Welcome back to ERP</h2>
            <p className="panel-sub">Sign in to continue where you left off and manage your workspace.</p>
            <div className="panel-dots">
              <span className="active" />
              <span />
              <span />
            </div>
          </div>

          {/* Right Panel */}
          <div className="login-panel-right">
            <div className="form-eyebrow">Member Access</div>
            <h1 className="form-title">Sign in</h1>
            <p className="form-subtitle">Enter your credentials to access your account.</p>

            {success && (
              <div className="success-banner">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" stroke="#185bff" strokeWidth="1.5"/>
                  <path d="M5 8l2 2 4-4" stroke="#185bff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Login successful! Redirecting…
              </div>
            )}

            <div className="field-group">
              {/* Email */}
              <div>
                <label className="field-label">Email address</label>
                <div className="input-wrap">
                  <span className="input-icon">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.4"/>
                      <path d="M1 5.5l7 4.5 7-4.5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  <input
                    className="input-field"
                    type="text"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setErrors(x => ({...x, email: ""})); }}
                    style={errors.email ? { borderColor: "#e5534b" } : {}}
                  />
                </div>
                {errors.email && <div style={{ fontSize: 11.5, color: "#e5534b", marginTop: 4 }}>{errors.email}</div>}
              </div>

              {/* Password */}
              <div>
                <label className="field-label">Password</label>
                <div className="input-wrap">
                  <span className="input-icon">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
                      <path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                    </svg>
                  </span>
                  <input
                    className="input-field"
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setErrors(x => ({...x, password: ""})); }}
                    style={errors.password ? { borderColor: "#e5534b" } : {}}
                  />
                  <span
                    onClick={() => setShowPass(v => !v)}
                    style={{ position:"absolute", right:13, top:"50%", transform:"translateY(-50%)", cursor:"pointer", color:"var(--text-muted)", display:"flex" }}
                  >
                    {showPass
                      ? <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.4"/><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4"/><path d="M2 2l12 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                      : <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.4"/><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4"/></svg>
                    }
                  </span>
                </div>
                {errors.password && <div style={{ fontSize: 11.5, color: "#e5534b", marginTop: 4 }}>{errors.password}</div>}
              </div>
            </div>

            <div className="row-opts">
              <label className="remember-label" onClick={() => setRemember(v => !v)}>
                <div className={`custom-checkbox${remember ? " checked" : ""}`}>
                  {remember && (
                    <svg viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                Remember me
              </label>
              <a className="forgot-link">Forgot password?</a>
            </div>

            <button className={`btn-login${loading ? " loading" : ""}`} onClick={handleSubmit}>
              {loading ? <><div className="spinner" /> Signing in…</> : "Sign in →"}
            </button>
            <div className="divider">
          </div>
            <p style={{color:"black"}}>v0.0 - TEST</p>

        </div>
      </div>
      
      </div>
    </>
  );
}