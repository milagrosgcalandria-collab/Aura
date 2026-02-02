
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { ChatMessage, ChatConversation } from '../types';
import { ICONS } from '../constants';

const ChatInterface: React.FC = () => {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [currentConvId, setCurrentConvId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{data: string, mimeType: string} | null>(null);
  const [showHistory, setShowHistory] = useState(true);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('aura_chat_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setConversations(parsed);
        if (parsed.length > 0) setCurrentConvId(parsed[0].id);
      } catch (e) {
        console.error("Error cargando historial", e);
      }
    }
  }, []);

  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem('aura_chat_history', JSON.stringify(conversations));
    }
  }, [conversations]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversations, currentConvId, isTyping]);

  const currentConversation = conversations.find(c => c.id === currentConvId) || null;
  const messages = currentConversation?.messages || [];

  const startNewChat = () => {
    setCurrentConvId(null);
    setInput('');
    setSelectedImage(null);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = (reader.result as string).split(',')[1];
      setSelectedImage({ data: base64Data, mimeType: file.type });
    };
    reader.readAsDataURL(file);
  };

  const openCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error al acceder a la cámara:", err);
      alert("No se pudo acceder a la cámara.");
      setIsCameraOpen(false);
    }
  };

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsCameraOpen(false);
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        const base64Data = dataUrl.split(',')[1];
        setSelectedImage({ data: base64Data, mimeType: 'image/jpeg' });
        closeCamera();
      }
    }
  };

  const deleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = conversations.filter(c => c.id !== id);
    setConversations(updated);
    localStorage.setItem('aura_chat_history', JSON.stringify(updated));
    if (currentConvId === id) {
      setCurrentConvId(updated.length > 0 ? updated[0].id : null);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || isTyping) return;

    const userMessage: ChatMessage = {
      role: 'user',
      text: input,
      timestamp: Date.now(),
      imageUrl: selectedImage ? `data:${selectedImage.mimeType};base64,${selectedImage.data}` : undefined
    };

    let updatedConvId = currentConvId;
    let newConversations = [...conversations];

    if (!currentConvId) {
      const newId = Date.now().toString();
      const newConv: ChatConversation = {
        id: newId,
        title: input.slice(0, 30) || (selectedImage ? "Imagen analizada" : "Nueva conversación"),
        messages: [userMessage],
        lastTimestamp: Date.now()
      };
      newConversations = [newConv, ...newConversations];
      setConversations(newConversations);
      setCurrentConvId(newId);
      updatedConvId = newId;
    } else {
      newConversations = conversations.map(c => 
        c.id === currentConvId 
          ? { ...c, messages: [...c.messages, userMessage], lastTimestamp: Date.now() }
          : c
      );
      setConversations(newConversations);
    }

    const currentInput = input;
    const currentImage = selectedImage;
    setInput('');
    setSelectedImage(null);
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      let contents;
      if (currentImage) {
        contents = {
          parts: [
            { inlineData: { data: currentImage.data, mimeType: currentImage.mimeType } },
            { text: currentInput || "¿Qué hay en esta imagen?" }
          ]
        };
      } else {
        contents = currentInput;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: contents,
        config: { tools: currentImage ? [] : [{ googleSearch: {} }] }
      });

      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const sources = groundingChunks?.map((chunk: any) => ({
        title: chunk.web?.title || 'Fuente',
        uri: chunk.web?.uri || '#'
      })).filter((s: any) => s.uri !== '#');

      const modelMessage: ChatMessage = {
        role: 'model',
        text: response.text || 'No pude procesar esa solicitud.',
        timestamp: Date.now(),
        sources: sources
      };

      setConversations(prev => prev.map(c => 
        c.id === updatedConvId 
          ? { ...c, messages: [...c.messages, modelMessage], lastTimestamp: Date.now() }
          : c
      ));

    } catch (error) {
      console.error(error);
      const errorMessage: ChatMessage = {
        role: 'model',
        text: 'Error al conectar con Aura. Por favor verifica tu conexión.',
        timestamp: Date.now()
      };
      setConversations(prev => prev.map(c => 
        c.id === updatedConvId ? { ...c, messages: [...c.messages, errorMessage] } : c
      ));
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Sidebar Historial */}
      <div className={`glass h-full border-r border-white/5 transition-all duration-300 overflow-hidden flex flex-col ${showHistory ? 'w-72' : 'w-0'}`}>
        <div className="p-4 border-b border-white/5 flex justify-between items-center">
          <h3 className="font-bold text-sm uppercase tracking-widest text-gray-400">Historial</h3>
          <button onClick={startNewChat} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg text-indigo-400" title="Nueva charla">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.map(conv => (
            <div 
              key={conv.id}
              onClick={() => setCurrentConvId(conv.id)}
              className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${currentConvId === conv.id ? 'bg-indigo-600/20 border border-indigo-500/30' : 'hover:bg-black/5 dark:hover:bg-white/5 border border-transparent'}`}
            >
              <div className="flex items-center space-x-3 overflow-hidden">
                <div className="text-gray-500"><ICONS.Chat /></div>
                <span className="text-sm truncate font-medium text-gray-500 dark:text-gray-300">{conv.title}</span>
              </div>
              <button 
                onClick={(e) => deleteConversation(conv.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.34 6m-4.74 0-.34-6m4.74 6h-4.74M4.5 6.136c0-1.02.759-1.879 1.765-1.944a48.108 48.108 0 0 1 11.603 0c1.006.065 1.765.918 1.765 1.944l-.721 13.045a2.25 2.25 0 0 1-2.247 2.118H7.71a2.25 2.25 0 0 1-2.247-2.118L4.5 6.136ZM9.75 4.5V3a1.5 1.5 0 0 1 1.5-1.5h1.5a1.5 1.5 0 0 1 1.5 1.5v1.5" />
                </svg>
              </button>
            </div>
          ))}
          {conversations.length === 0 && (
            <div className="text-center py-10 px-4">
              <p className="text-xs text-gray-600 italic">No hay charlas previas</p>
            </div>
          )}
        </div>
      </div>

      {/* Area de Chat Principal */}
      <div className="flex-1 flex flex-col relative">
        <button 
          onClick={() => setShowHistory(!showHistory)}
          className="absolute left-4 top-4 z-20 p-2 glass rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-gray-400"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
          </svg>
        </button>

        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-6 pb-24 pt-16 px-4 max-w-4xl mx-auto w-full">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 animate-in fade-in duration-700">
              <div className="aura-gradient p-4 rounded-3xl shadow-indigo-500/20 shadow-2xl text-white">
                <ICONS.Chat />
              </div>
              <h2 className="text-3xl font-bold">Aura AI</h2>
              <p className="text-gray-400 max-w-sm">¿En qué puedo ayudarte hoy? Puedes preguntarme cualquier cosa o enviarme una imagen para analizar.</p>
            </div>
          )}
          
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
              <div className={`max-w-[85%] p-4 rounded-2xl shadow-xl border ${
                m.role === 'user' 
                  ? 'aura-gradient text-white border-transparent' 
                  : 'glass text-[var(--text-primary)]'
              }`}>
                {m.imageUrl && (
                  <img src={m.imageUrl} alt="Adjunto" className="rounded-lg mb-3 max-h-64 w-auto object-cover border border-white/20 shadow-md" />
                )}
                <p className="whitespace-pre-wrap leading-relaxed text-sm sm:text-base">{m.text}</p>
                {m.sources && m.sources.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-white/10">
                    <div className="flex flex-wrap gap-2">
                      {m.sources.map((source, si) => (
                        <a key={si} href={source.uri} target="_blank" rel="noopener noreferrer" className="text-[10px] bg-black/20 hover:bg-black/40 px-2 py-1 rounded transition-all text-indigo-400 border border-white/5">
                          {source.title}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="glass p-4 rounded-2xl flex space-x-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:-.3s]"></div>
                <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce [animation-delay:-.5s]"></div>
              </div>
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="absolute bottom-4 left-0 right-0 px-4 max-w-4xl mx-auto w-full z-10">
          <div className="flex flex-col items-center">
            {selectedImage && (
              <div className="mb-4 relative animate-in slide-in-from-bottom-4 duration-300">
                <div className="glass p-2 rounded-2xl border-indigo-500/50 border shadow-2xl">
                  <img src={`data:${selectedImage.mimeType};base64,${selectedImage.data}`} className="h-24 rounded-xl object-cover" alt="Vista previa" />
                  <button onClick={() => setSelectedImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
            )}

            <div className="glass w-full p-2 rounded-2xl flex items-center shadow-2xl">
              <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleImageSelect} />
              
              <div className="flex">
                <button onClick={() => fileInputRef.current?.click()} className="p-3 text-gray-400 hover:text-indigo-500 transition-colors hover:bg-black/5 dark:hover:bg-white/5 rounded-xl" title="Subir imagen">
                  <ICONS.Image />
                </button>
                <button onClick={openCamera} className="p-3 text-gray-400 hover:text-indigo-500 transition-colors hover:bg-black/5 dark:hover:bg-white/5 rounded-xl" title="Abrir cámara">
                  <ICONS.Camera />
                </button>
              </div>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Pregúntale algo a Aura..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-[var(--text-primary)] px-4 py-3 placeholder:text-gray-500 outline-none"
              />
              <button
                onClick={handleSend}
                disabled={(!input.trim() && !selectedImage) || isTyping}
                className="aura-gradient p-3 rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-30 flex items-center justify-center shadow-lg text-white"
              >
                <ICONS.Send />
              </button>
            </div>
          </div>
        </div>
      </div>

      {isCameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-300">
          <div className="relative glass p-4 rounded-3xl max-w-2xl w-full flex flex-col items-center">
            <button 
              onClick={closeCamera}
              className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all z-10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover"
              />
            </div>

            <div className="mt-8 flex items-center space-x-12">
              <button
                onClick={takePhoto}
                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center transition-all active:scale-90"
              >
                <div className="w-16 h-16 rounded-full aura-gradient"></div>
              </button>
            </div>
            
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;