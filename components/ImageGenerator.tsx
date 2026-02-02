
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { GeneratedImage } from '../types';

const ImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [images, setImages] = useState<GeneratedImage[]>([]);

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: prompt }]
        }
      });

      let imageUrl = '';
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }

      if (imageUrl) {
        const newImage: GeneratedImage = {
          id: Date.now().toString(),
          url: imageUrl,
          prompt: prompt,
          timestamp: Date.now()
        };
        setImages(prev => [newImage, ...prev]);
        setPrompt('');
      }
    } catch (error) {
      console.error(error);
      alert('Error al generar la imagen. Intenta con un prompt diferente.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-full flex flex-col max-w-6xl mx-auto p-4 space-y-8">
      <div className="glass p-8 rounded-3xl space-y-6 shadow-2xl border-white/10">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold">Generador de Imágenes</h2>
          <p className="text-gray-400">Describe la imagen que deseas crear y Aura la hará realidad.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            placeholder="Ej: Un astronauta montando un unicornio en Marte, estilo cyberpunk..."
            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-600"
          />
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="aura-gradient px-8 py-4 rounded-2xl font-bold hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center min-w-[160px]"
          >
            {isGenerating ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Generar'
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
        {images.map((img) => (
          <div key={img.id} className="group relative glass rounded-3xl overflow-hidden shadow-xl hover:shadow-indigo-500/20 transition-all duration-500 hover:-translate-y-1">
            <img src={img.url} alt={img.prompt} className="w-full aspect-square object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-6 flex flex-col justify-end">
              <p className="text-sm line-clamp-2 mb-4">{img.prompt}</p>
              <a 
                href={img.url} 
                download={`aura-ai-${img.id}.png`}
                className="bg-white text-black px-4 py-2 rounded-xl text-xs font-bold w-fit hover:bg-indigo-50 transition-colors"
              >
                Descargar
              </a>
            </div>
          </div>
        ))}
        {images.length === 0 && !isGenerating && (
          <div className="col-span-full h-64 flex flex-col items-center justify-center text-gray-500 space-y-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16 opacity-20">
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6.75a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6.75v10.5a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
            <p>Tus creaciones aparecerán aquí</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageGenerator;
