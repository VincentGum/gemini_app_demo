
import React, { useState, useEffect, useCallback } from 'react';
import { AdventureTheme, GameState, ImageSize } from './types';
import { generateNextStep, generateSceneImage } from './services/geminiService';
import Sidebar from './components/Sidebar';
import ChatAssistant from './components/ChatAssistant';

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [history, setHistory] = useState<{ choice: string; story: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<AdventureTheme>(AdventureTheme.FANTASY);
  const [imageSize, setImageSize] = useState<ImageSize>('1K');
  const [showKeyPrompt, setShowKeyPrompt] = useState(false);

  // Check if API Key is selected for High-Quality Images (Gemini 3 Pro Image)
  const checkApiKey = async () => {
    try {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        setShowKeyPrompt(true);
        return false;
      }
      return true;
    } catch (e) {
      // If feature not available in env, we might proceed but warning user
      console.warn("AI Studio key management not available.");
      return true; 
    }
  };

  const handleSelectKey = async () => {
    await window.aistudio.openSelectKey();
    setShowKeyPrompt(false);
    // Proceed as if successful per instructions
  };

  const startAdventure = async () => {
    const keyOk = await checkApiKey();
    if (!keyOk) return;

    setLoading(true);
    setError(null);
    try {
      const visualStyle = `High-quality cinemantic concept art, ${selectedTheme} theme, consistent illustrative style, detailed environments`;
      
      const newState = await generateNextStep(
        selectedTheme,
        [],
        [],
        "Embark on a new journey.",
        visualStyle
      );

      const imageUrl = await generateSceneImage(newState.imageDescription, newState.visualStyle, imageSize);
      setGameState({ ...newState, imageUrl });
      setHistory([{ choice: "Beginning", story: newState.storyText }]);
    } catch (err: any) {
      if (err.message?.includes("Requested entity was not found")) {
        setShowKeyPrompt(true);
      }
      setError("The chronometer failed to align. Try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const makeChoice = async (choice: string) => {
    if (!gameState || loading) return;

    setLoading(true);
    setError(null);
    try {
      const newHistory = [...history, { choice, story: gameState.storyText }];
      const newState = await generateNextStep(
        selectedTheme,
        newHistory,
        gameState.inventory,
        gameState.currentQuest,
        gameState.visualStyle
      );

      const imageUrl = await generateSceneImage(newState.imageDescription, newState.visualStyle, imageSize);
      
      setGameState({ ...newState, imageUrl });
      setHistory(newHistory);
    } catch (err: any) {
      if (err.message?.includes("Requested entity was not found")) {
        setShowKeyPrompt(true);
      }
      setError("Your path was blocked by a temporal rift. Attempt the choice again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (showKeyPrompt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-6">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center shadow-2xl">
          <i className="fa-solid fa-key text-4xl text-yellow-500 mb-6"></i>
          <h2 className="text-2xl font-bold mb-4">Adventure Requires Access</h2>
          <p className="text-zinc-400 mb-8 leading-relaxed">
            To generate high-quality 2K/4K visual memories using Gemini 3 Pro, you must select a valid API key from a paid GCP project.
          </p>
          <div className="flex flex-col gap-4">
            <button 
              onClick={handleSelectKey}
              className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg active:scale-95"
            >
              Select API Key
            </button>
            <a 
              href="https://ai.google.dev/gemini-api/docs/billing" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-zinc-500 hover:text-zinc-300 text-sm underline"
            >
              Learn about API Billing
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-6 overflow-hidden">
        <div className="relative z-10 max-w-2xl w-full text-center space-y-8">
          <div className="space-y-2">
            <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter italic">CHRONICLE</h1>
            <p className="text-zinc-500 text-xl tracking-widest uppercase">Infinite Adventures</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.values(AdventureTheme).map((theme) => (
              <button
                key={theme}
                onClick={() => setSelectedTheme(theme)}
                className={`p-4 rounded-xl border transition-all ${
                  selectedTheme === theme 
                    ? 'bg-zinc-100 text-zinc-950 border-white shadow-[0_0_20px_rgba(255,255,255,0.3)]' 
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="text-xs uppercase font-bold tracking-tighter truncate">{theme.split(' ')[1] || theme}</div>
              </button>
            ))}
          </div>

          <div className="flex flex-col items-center gap-4">
             <label className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Image Fidelity</label>
             <div className="flex gap-2">
               {(['1K', '2K', '4K'] as ImageSize[]).map((size) => (
                 <button
                   key={size}
                   onClick={() => setImageSize(size)}
                   className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${
                     imageSize === size 
                       ? 'bg-zinc-200 text-zinc-900 border-zinc-200' 
                       : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-700'
                   }`}
                 >
                   {size}
                 </button>
               ))}
             </div>
          </div>

          <button 
            onClick={startAdventure}
            disabled={loading}
            className="group relative inline-flex items-center justify-center px-10 py-4 font-bold text-white transition-all duration-200 bg-zinc-100 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
          >
             <span className="relative z-10 text-zinc-950 uppercase tracking-widest">
               {loading ? 'Consulting the Fates...' : 'Begin Journey'}
             </span>
             {loading && (
               <div className="ml-3 animate-spin h-5 w-5 text-zinc-950">
                 <i className="fa-solid fa-circle-notch"></i>
               </div>
             )}
          </button>
        </div>
        
        {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-20">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/5 rounded-full blur-[120px]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-black">
      {/* Main Gameplay Area */}
      <main className="flex-1 overflow-y-auto relative flex flex-col items-center">
        {/* Responsive Image Header */}
        <div className="w-full h-[40vh] md:h-[50vh] relative flex-shrink-0 group">
          {gameState.imageUrl ? (
            <img 
              src={gameState.imageUrl} 
              alt="Current Scene" 
              className="w-full h-full object-cover transition-opacity duration-700"
            />
          ) : (
            <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
              <div className="animate-pulse flex flex-col items-center text-zinc-700">
                <i className="fa-solid fa-image text-5xl mb-2"></i>
                <p className="text-sm font-bold tracking-tighter">Painting the vision...</p>
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
          
          {/* HUD Badge */}
          <div className="absolute top-6 left-6 px-4 py-1.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-white/80">{selectedTheme}</span>
          </div>
        </div>

        {/* Story Content */}
        <div className="max-w-3xl w-full px-6 py-12 flex flex-col gap-10">
          <article className="prose prose-invert max-w-none">
            <p className="text-xl md:text-2xl font-serif leading-relaxed text-zinc-200 first-letter:text-5xl first-letter:font-bold first-letter:mr-3 first-letter:float-left first-letter:text-white">
              {gameState.storyText}
            </p>
          </article>

          {error && (
            <div className="p-4 bg-red-900/20 border border-red-900/50 rounded-xl text-red-200 text-sm flex items-center gap-3">
              <i className="fa-solid fa-circle-exclamation"></i>
              {error}
            </div>
          )}

          {/* Choices */}
          <section className="space-y-4 pb-24">
            {!gameState.isGameOver ? (
              <div className="grid grid-cols-1 gap-3">
                {gameState.choices.map((choice, idx) => (
                  <button
                    key={idx}
                    disabled={loading}
                    onClick={() => makeChoice(choice)}
                    className="w-full text-left p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 hover:border-zinc-600 transition-all duration-200 group flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-bold text-zinc-600 group-hover:text-zinc-400 font-mono transition-colors">0{idx + 1}</span>
                      <span className="text-zinc-300 group-hover:text-white font-medium transition-colors">{choice}</span>
                    </div>
                    <i className="fa-solid fa-chevron-right text-zinc-700 group-hover:text-zinc-300 group-hover:translate-x-1 transition-all"></i>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 space-y-6">
                <h2 className="text-3xl font-bold text-white tracking-widest uppercase">The End</h2>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-zinc-200 transition-colors"
                >
                  Return to Origin
                </button>
              </div>
            )}
          </section>
        </div>

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 z-40 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
            <div className="bg-zinc-900/90 border border-zinc-700 p-8 rounded-2xl flex flex-col items-center gap-4 shadow-2xl">
              <div className="w-12 h-12 border-4 border-zinc-700 border-t-zinc-200 rounded-full animate-spin"></div>
              <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs">The Loom is weaving...</p>
            </div>
          </div>
        )}
      </main>

      {/* Persistence Sidebar */}
      <Sidebar 
        inventory={gameState.inventory} 
        quest={gameState.currentQuest} 
      />

      {/* Floating Chat Assistant */}
      <ChatAssistant gameState={gameState} />
    </div>
  );
};

export default App;
