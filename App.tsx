
import React, { useState, useEffect } from 'react';
import { AppTab } from './types';
import { ICONS } from './constants';
import ChatInterface from './components/ChatInterface';
import VoiceAssistant from './components/VoiceAssistant';
import ImageGenerator from './components/ImageGenerator';
import AuthScreen from './components/AuthScreen';
import AccountSettings from './components/AccountSettings';
import { auth } from './firebase';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.CHAT);
  const [isDark, setIsDark] = useState(true);
  const [user, setUser] = useState<{ email: string; name: string; photoURL?: string; providerId?: string; isAnonymous?: boolean } | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // Escuchar cambios en el estado de autenticación de Firebase
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          email: firebaseUser.email || (firebaseUser.isAnonymous ? 'Invitado' : ''),
          name: firebaseUser.displayName || (firebaseUser.isAnonymous ? 'Invitado' : (firebaseUser.email?.split('@')[0] || 'Usuario')),
          photoURL: firebaseUser.photoURL || undefined,
          providerId: firebaseUser.providerData[0]?.providerId,
          isAnonymous: firebaseUser.isAnonymous
        });
      } else {
        setUser(null);
      }
      setIsCheckingAuth(false);
    });

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    
    const savedTheme = localStorage.getItem('aura_theme');
    if (savedTheme === 'light') {
      setIsDark(false);
      document.body.classList.add('light-mode');
    }

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setActiveTab(AppTab.CHAT);
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (isDark) {
      document.body.classList.add('light-mode');
      localStorage.setItem('aura_theme', 'light');
    } else {
      document.body.classList.remove('light-mode');
      localStorage.setItem('aura_theme', 'dark');
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="h-screen w-full bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-gray-500 animate-pulse">Iniciando Aura AI...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case AppTab.CHAT: return <ChatInterface />;
      case AppTab.VOICE: return <VoiceAssistant />;
      case AppTab.IMAGE: return <ImageGenerator />;
      case AppTab.ACCOUNT: return <AccountSettings user={user} onLogout={handleLogout} />;
      default: return <ChatInterface />;
    }
  };

  return (
    <div className={`flex h-screen overflow-hidden animate-in fade-in duration-700`}>
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-20 lg:w-72 sidebar-surface z-20">
        <div className="p-8">
          <div 
            onClick={() => setActiveTab(AppTab.ACCOUNT)}
            className="flex items-center space-x-4 mb-12 cursor-pointer group"
          >
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.name} className="w-12 h-12 rounded-2xl object-cover shadow-lg border border-white/10" />
            ) : (
              <div className="aura-gradient w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center font-bold text-2xl text-white transform rotate-3 group-hover:rotate-0 transition-transform">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="hidden lg:block overflow-hidden">
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{user.isAnonymous ? 'Modo Invitado' : 'Aura Premium'}</p>
              <p className="text-sm font-bold truncate group-hover:text-indigo-400 transition-colors">{user.name}</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-2">Explorar Aura</p>
            <nav className="space-y-2">
              <TabButton active={activeTab === AppTab.CHAT} onClick={() => setActiveTab(AppTab.CHAT)} icon={<ICONS.Chat />} label="Chat Inteligente" />
              <TabButton active={activeTab === AppTab.VOICE} onClick={() => setActiveTab(AppTab.VOICE)} icon={<ICONS.Voice />} label="Asistente de Voz" />
              <TabButton active={activeTab === AppTab.IMAGE} onClick={() => setActiveTab(AppTab.IMAGE)} icon={<ICONS.Image />} label="Estudio de Imagen" />
              <TabButton active={activeTab === AppTab.ACCOUNT} onClick={() => setActiveTab(AppTab.ACCOUNT)} icon={<ICONS.User />} label="Ajustes de Perfil" />
            </nav>
          </div>
        </div>
        
        <div className="mt-auto p-6 space-y-2 border-t border-white/5 bg-black/5 dark:bg-white/5">
          <button 
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl menu-item text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all group"
          >
            <div className="flex items-center space-x-3">
              {isDark ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-yellow-500"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M3 12h2.25m.386-6.364 1.591-1.591M12 7.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Z" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-indigo-500"><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" /></svg>
              )}
              <span className="hidden lg:block font-medium text-sm">{isDark ? 'Modo Claro' : 'Modo Oscuro'}</span>
            </div>
          </button>

          <button 
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl menu-item text-red-500/70 hover:text-red-500 hover:bg-red-500/10 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" /></svg>
            <span className="hidden lg:block font-medium text-sm">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 relative overflow-hidden flex flex-col">
        <header className="h-16 flex items-center px-8 border-b border-white/5 glass z-10">
          <h1 className="text-xl font-bold tracking-tight">
            {activeTab === AppTab.CHAT && 'Aura Asistente'}
            {activeTab === AppTab.VOICE && 'Canal de Voz'}
            {activeTab === AppTab.IMAGE && 'Creador Visual'}
            {activeTab === AppTab.ACCOUNT && 'Perfil de Usuario'}
          </h1>
          <div className="ml-auto flex items-center space-x-6">
             <div 
               onClick={() => setActiveTab(AppTab.ACCOUNT)}
               className="cursor-pointer hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-green-500/10 rounded-full border border-green-500/20 hover:bg-green-500/20 transition-all"
             >
               <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
               <span className="text-[10px] font-bold text-green-500 uppercase tracking-tighter">Sesión de {user.name.split(' ')[0]}</span>
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto scroll-smooth bg-transparent">
          {renderContent()}
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden sticky bottom-0 flex justify-around p-3 sidebar-surface z-30 shadow-[0_-10px_30px_rgba(0,0,0,0.1)]">
          <MobileNavButton active={activeTab === AppTab.CHAT} onClick={() => setActiveTab(AppTab.CHAT)} icon={<ICONS.Chat />} />
          <MobileNavButton active={activeTab === AppTab.VOICE} onClick={() => setActiveTab(AppTab.VOICE)} icon={<ICONS.Voice />} />
          <MobileNavButton active={activeTab === AppTab.IMAGE} onClick={() => setActiveTab(AppTab.IMAGE)} icon={<ICONS.Image />} />
          <MobileNavButton active={activeTab === AppTab.ACCOUNT} onClick={() => setActiveTab(AppTab.ACCOUNT)} icon={<ICONS.User />} />
          <div className="w-px h-8 bg-white/10 mx-1 self-center"></div>
          <button onClick={handleLogout} className="p-3 rounded-2xl text-red-400 hover:bg-red-500/5 active:scale-90 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" /></svg>
          </button>
        </nav>
      </main>
    </div>
  );
};

interface TabButtonProps { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; }
const TabButton: React.FC<TabButtonProps> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick} 
    className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-300 ${active ? 'aura-gradient text-white scale-[1.02]' : 'menu-item text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent hover:border-white/5'}`}
  >
    <div className={`flex-shrink-0 ${active ? 'text-white' : 'opacity-70 group-hover:opacity-100'}`}>{icon}</div>
    <span className="hidden lg:block font-semibold text-sm tracking-tight">{label}</span>
  </button>
);
const MobileNavButton: React.FC<Omit<TabButtonProps, 'label'>> = ({ active, onClick, icon }) => (
  <button 
    onClick={onClick} 
    className={`p-3 rounded-2xl transition-all ${active ? 'aura-gradient text-white scale-110' : 'text-[var(--text-secondary)] hover:bg-white/5'}`}
  >
    {icon}
  </button>
);

export default App;
