
import React, { useState } from 'react';
import { auth } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  sendPasswordResetEmail,
  signInAnonymously
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

const AuthScreen: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      if (isForgotPassword) {
        if (!email.trim()) throw new Error("Por favor, introduce tu email.");
        await sendPasswordResetEmail(auth, email);
        setSuccessMessage("Se ha enviado un correo para restablecer tu contraseña. Revisa tu bandeja de entrada.");
      } else if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        if (!name.trim()) throw new Error("Por favor, introduce tu nombre.");
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
      }
    } catch (err: any) {
      console.error(err);
      let message = "Ocurrió un error inesperado.";
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        message = "Credenciales incorrectas.";
      } else if (err.code === 'auth/email-already-in-use') {
        message = "Este correo electrónico ya está registrado.";
      } else if (err.code === 'auth/weak-password') {
        message = "La contraseña debe tener al menos 6 caracteres.";
      } else if (err.code === 'auth/too-many-requests') {
        message = "Demasiados intentos. Inténtalo más tarde.";
      } else if (err.message) {
        message = err.message;
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      await signInAnonymously(auth);
    } catch (err: any) {
      console.error(err);
      setError("No se pudo iniciar sesión como invitado.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetViews = () => {
    setIsForgotPassword(false);
    setIsLogin(true);
    setError('');
    setSuccessMessage('');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[var(--bg-primary)] relative overflow-hidden">
      {/* Círculos decorativos de fondo */}
      <div className="absolute top-[-10%] left-[-10%] w-72 h-72 bg-indigo-600/20 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-600/20 rounded-full blur-[120px]"></div>

      <div className="glass w-full max-w-md p-8 rounded-[2.5rem] shadow-2xl relative z-10 animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center mb-8">
          <div className="aura-gradient w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-3xl text-white mb-4 shadow-lg transform rotate-3">
            A
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">Aura AI</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-2 text-center">
            {isForgotPassword 
              ? 'Recupera el acceso a tu cuenta avanzada' 
              : isLogin 
                ? 'Bienvenido de nuevo a la inteligencia avanzada' 
                : 'Crea tu cuenta para empezar a explorar'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && !isForgotPassword && (
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">Nombre</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre completo"
                className="w-full bg-black/5 dark:bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-600 text-[var(--text-primary)]"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">Email</label>
            <input
              type="email"
              required={!isForgotPassword || !isLogin}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre@ejemplo.com"
              className="w-full bg-black/5 dark:bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-600 text-[var(--text-primary)]"
            />
          </div>

          {!isForgotPassword && (
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-black/5 dark:bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 pr-12 focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-600 text-[var(--text-primary)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-indigo-500 transition-colors"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          )}

          {isLogin && !isForgotPassword && (
            <div className="flex justify-end pr-1">
              <button 
                type="button"
                onClick={() => setIsForgotPassword(true)}
                className="text-[10px] font-bold text-indigo-500 hover:text-indigo-400 transition-colors uppercase tracking-widest"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          )}

          {error && (
            <p className="text-red-500 text-xs font-medium text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20 animate-in fade-in duration-300">
              {error}
            </p>
          )}

          {successMessage && (
            <p className="text-green-500 text-xs font-medium text-center bg-green-500/10 py-2 rounded-lg border border-green-500/20 animate-in fade-in duration-300">
              {successMessage}
            </p>
          )}

          <div className="space-y-3 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="aura-gradient w-full py-4 rounded-2xl font-bold text-white shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : isForgotPassword ? (
                'Enviar Enlace de Recuperación'
              ) : isLogin ? (
                'Iniciar Sesión'
              ) : (
                'Crear Cuenta'
              )}
            </button>

            {isLogin && !isForgotPassword && (
              <button
                type="button"
                disabled={isLoading}
                onClick={handleGuestLogin}
                className="w-full py-3.5 rounded-2xl font-bold text-[var(--text-secondary)] bg-white/5 border border-white/5 hover:bg-white/10 hover:text-[var(--text-primary)] transition-all flex items-center justify-center disabled:opacity-50"
              >
                Continuar como invitado
              </button>
            )}
          </div>
        </form>

        <div className="mt-6 flex flex-col items-center space-y-4">
          <div className="text-center pt-2">
            {isForgotPassword ? (
              <button
                onClick={resetViews}
                className="text-sm text-indigo-500 font-bold hover:underline"
              >
                Volver al inicio de sesión
              </button>
            ) : (
              <p className="text-sm text-[var(--text-secondary)]">
                {isLogin ? '¿No tienes cuenta?' : '¿Ya eres usuario?'}
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="ml-2 text-indigo-500 font-bold hover:underline"
                >
                  {isLogin ? 'Regístrate' : 'Inicia Sesión'}
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
