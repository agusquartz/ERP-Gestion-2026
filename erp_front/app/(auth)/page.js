
"use client";

import { useState } from "react";
import { login } from "@/lib/http/client/auth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  const router = useRouter();

  const validate = () => {
    const nextErrors = {};

    if (!username || username.trim().length < 3) {
      nextErrors.username = "Min. 3 characters";
    }

    if (!password || password.length < 6) {
      nextErrors.password = "Min. 6 characters";
    }

    return nextErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nextErrors = validate();

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setLoading(true);
    setSuccess(false);

    try {
      await login(username, password);

      setSuccess(true);

      setTimeout(() => {
        router.push("/dashboard");
      }, 800);

    } catch (err) {
      console.error(err);

      setErrors({
        general: err.message || "Error al iniciar sesión",
      });

    } finally {
      setLoading(false);
    }
  };

  const inputBase =
    "h-11 w-full rounded-[5px] border border-border bg-background px-3 pl-10 text-sm text-foreground outline-none " +
    "placeholder:text-muted-foreground/50 transition-all duration-200 " +
    "focus:border-primary focus:bg-surface focus:ring-2 focus:ring-primary/20";

  const inputError =
    "border-destructive focus:border-destructive focus:ring-destructive/15";

  return (
    <main className="min-h-screen bg-background p-6 text-foreground">
      <div className="flex min-h-[calc(100vh-3rem)] items-center justify-center">
        <div className="flex min-h-[520px] w-full max-w-[860px] overflow-hidden rounded-[5px] bg-surface shadow-panel">
          <section className="relative hidden flex-1 flex-col items-center justify-center overflow-hidden bg-primary px-10 py-12 text-center md:flex">
            <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/10" />
            <div className="absolute -bottom-16 -left-10 h-52 w-52 rounded-full bg-white/10" />

            <div className="relative z-10 mb-7 flex h-[52px] w-[52px] items-center justify-center rounded-[5px] bg-white shadow-panel">
              <svg viewBox="0 0 28 28" fill="none" className="h-7 w-7">
                <rect x="3" y="3" width="10" height="10" rx="2" fill="#185BFF" />
                <rect x="15" y="3" width="10" height="10" rx="2" fill="#185BFF" opacity=".5" />
                <rect x="3" y="15" width="10" height="10" rx="2" fill="#185BFF" opacity=".5" />
                <rect x="15" y="15" width="10" height="10" rx="2" fill="#185BFF" />
              </svg>
            </div>

            <h2 className="relative z-10 mb-4 font-sans text-[28px] font-extrabold leading-tight text-primary-foreground">
              Bienvenido de vuelta a The ERP
            </h2>

            <p className="relative z-10 max-w-[220px] text-sm leading-6 text-primary-foreground/75">
              Inicia sesión para continuar con las actividades.
            </p>

            <div className="relative z-10 mt-9 flex gap-2">
              <span className="h-2 w-2 rounded-full bg-primary-foreground/35" />
              <span className="h-2 w-2 rounded-full bg-primary-foreground/35" />
              <span className="h-2 w-2 rounded-full bg-primary-foreground" />
            </div>
          </section>

          <section className="flex flex-1 flex-col justify-center px-7 py-10 md:flex-[1.1] md:px-12">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
              Acceso
            </div>

            <h1 className="mb-1 text-[26px] font-bold text-foreground">Sign in</h1>
            <p className="mb-8 text-[13.5px] text-muted-foreground">
              Ingresa tus credenciales para acceder a tu cuenta.
            </p>

            {success && (
              <div className="mb-5 flex items-center gap-2 rounded-[5px] border border-primary/20 bg-primary/10 px-4 py-3 text-[13.5px] text-primary">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                  <path
                    d="M5 8l2 2 4-4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Login exitoso. Redirigiendo…
              </div>
            )}


            {errors.general && (
              <div className="mb-4 text-sm text-destructive">
                {errors.general}
              </div>
            )}


            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[12.5px] font-medium text-foreground">
                  Nombre de usuario
                </label>

                <div className="relative group">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition group-focus-within:text-primary">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.4" />
                      <path d="M1 5.5l7 4.5 7-4.5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                    </svg>
                  </span>

                  <input
                    className={`${inputBase} ${errors.username ? inputError : ""}`}
                    type="text"
                    placeholder="nombre-modulo"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setErrors((prev) => ({ ...prev, username: "" }));
                    }}
                  />
                </div>

                {errors.username && (
                  <p className="mt-1 text-[11.5px] text-destructive">{errors.username}</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-[12.5px] font-medium text-foreground">
                  Contraseña
                </label>

                <div className="relative group">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition group-focus-within:text-primary">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
                      <path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    </svg>
                  </span>

                  <input
                    className={`${inputBase} pr-11 ${errors.password ? inputError : ""}`}
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrors((prev) => ({ ...prev, password: "" }));
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-primary"
                    aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPass ? (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.4" />
                        <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4" />
                        <path d="M2 2l12 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.4" />
                        <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4" />
                      </svg>
                    )}
                  </button>
                </div>

                {errors.password && (
                  <p className="mt-1 text-[11.5px] text-destructive">{errors.password}</p>
                )}
              </div>

              <button
                type="submit"
                className="mt-4 flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-[5px] bg-primary px-4 text-[15px] font-semibold text-primary-foreground shadow-panel transition-all duration-200 hover:bg-primary-hover active:translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-80"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="h-[18px] w-[18px] animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Iniciando sesión…
                  </>
                ) : (
                  "Iniciar sesión →"
                )}
              </button>
            </form>

            <div className="mb-5 mt-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <p className="text-center text-[13px] text-muted-foreground">
              No tienes una cuenta?{" "}
              <button type="button" className="font-semibold text-primary hover:underline">
                Contacta al administrador
              </button>
            </p>

            <p className="mt-6 text-sm text-foreground">v0.0 - TEST</p>
          </section>
        </div>
      </div>
    </main>
  );
}