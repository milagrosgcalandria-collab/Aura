
import React from 'react';

interface AccountSettingsProps {
  user: { email: string; name: string; photoURL?: string; providerId?: string; isAnonymous?: boolean };
  onLogout: () => void;
}

const AccountSettings: React.FC<AccountSettingsProps> = ({ user, onLogout }) => {
  const name = user.name;
  const email = user.email;
  const isGoogle = user.providerId === 'google.com';
  const isGuest = user.isAnonymous;

  return (
    <div className="h-full flex flex-col max-w-2xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="glass rounded-[2.5rem] overflow-hidden shadow-2xl border-white/10">
        <div className="aura-gradient h-32 relative">
          <div className="absolute -bottom-12 left-8">
            {user.photoURL ? (
              <img src={user.photoURL} alt={name} className="w-24 h-24 rounded-3xl object-cover border-4 border-[var(--bg-secondary)] shadow-2xl" />
            ) : (
              <div className="w-24 h-24 rounded-3xl bg-[var(--bg-secondary)] p-1 shadow-2xl border border-white/10">
                <div className="aura-gradient w-full h-full rounded-2xl flex items-center justify-center text-3xl font-bold text-white">
                  {name.charAt(0).toUpperCase()}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="pt-16 p-8 space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">Ajustes de Cuenta</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1">Información de tu perfil y seguridad de Aura AI</p>
            
            {isGoogle && (
              <div className="mt-4 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400 text-xs font-medium flex items-center">
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                </svg>
                Tu cuenta está protegida por Google Auth. No se requiere contraseña adicional.
              </div>
            )}

            {isGuest && (
              <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500 text-xs font-medium flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
                Estás navegando como invitado. Tus conversaciones podrían no persistir si cierras sesión o borras datos.
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">Nombre</label>
                <div className="w-full bg-black/5 dark:bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-[var(--text-primary)] opacity-70">
                  {name}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">Email</label>
                <div className="w-full bg-black/5 dark:bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-[var(--text-primary)] opacity-70">
                  {isGuest ? 'N/A (Sesión anónima)' : email}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                disabled
                className="aura-gradient flex-1 py-4 rounded-2xl font-bold text-white shadow-xl opacity-50 cursor-not-allowed"
              >
                Editar Perfil (Próximamente)
              </button>
              <button
                onClick={onLogout}
                className="flex-1 py-4 rounded-2xl font-bold text-red-500 bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 hover:border-red-500/20 transition-all"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
