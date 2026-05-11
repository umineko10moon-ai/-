/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Heart, Zap, Play, RotateCcw, Trophy, Languages, BookOpen, Target, Menu } from 'lucide-react';
import { VERBS, SUBJECTS, PLAYER_RADIUS, ENEMY_SPAWN_INTERVAL, MAX_HEALTH } from './constants';
import { Enemy, Particle, Subject, GameState, GameMode } from './types';
import { VirtualKeyboard } from './components/VirtualKeyboard';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    health: MAX_HEALTH,
    enemies: [],
    particles: [],
    gameOver: false,
    gameStarted: false,
    level: 1,
    mode: 'shooter',
  });

  const stateRef = useRef<GameState>(gameState);
  stateRef.current = gameState;

  const lastSpawnTime = useRef<number>(0);
  const typingBuffer = useRef<string>('');
  const lastEnterTime = useRef<number>(0);
  const [currentBuffer, setCurrentBuffer] = useState('');

  const ENCOURAGEMENTS = [
    "Fantastisch!",
    "Super gemacht!",
    "Ausgezeichnet!",
    "Du bist ein Profi!",
    "Sehr gut!",
    "Weiter so!",
    "Beeindruckend!",
  ];

  const spawnEnemy = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const verb = VERBS[Math.floor(Math.random() * VERBS.length)];
    const subject = SUBJECTS[Math.floor(Math.random() * SUBJECTS.length)] as Subject;
    const answer = verb.conjugations[subject];

    // Avoid spawning from the bottom area (where typing UI is)
    // Exclude range roughly 45 to 135 degrees (around PI/2)
    let angle;
    do {
      angle = Math.random() * Math.PI * 2;
    } while (angle > Math.PI * 0.2 && angle < Math.PI * 0.8);

    const diagonal = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height);
    const distance = (diagonal / 2) + 100; // Just outside the corners
    const x = canvas.width / 2 + Math.cos(angle) * distance;
    const y = canvas.height / 2 + Math.sin(angle) * distance;

    const newEnemy: Enemy = {
      id: Math.random().toString(36).substr(2, 9),
      x,
      y,
      targetX: canvas.width / 2,
      targetY: canvas.height / 2,
      speed: 0.8 + (stateRef.current.level * 0.15), // Reduced speed as requested
      infinitive: verb.infinitive,
      subject,
      correctAnswer: answer,
      currentInput: '',
      distance,
      active: true,
    };

    setGameState(prev => ({
      ...prev,
      enemies: [...prev.enemies, newEnemy]
    }));
  }, []);

  const nextPracticeQuestion = useCallback(() => {
    const verb = VERBS[Math.floor(Math.random() * VERBS.length)];
    const subject = SUBJECTS[Math.floor(Math.random() * SUBJECTS.length)] as Subject;
    
    setGameState(prev => ({
      ...prev,
      currentPracticeVerb: verb,
      currentPracticeSubject: subject,
      isSkipping: false,
    }));
    typingBuffer.current = '';
    setCurrentBuffer('');
  }, []);

  const createExplosion = (x: number, y: number, color: string) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 15; i++) {
      newParticles.push({
        id: Math.random().toString(36).substr(2, 9),
        x,
        y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        life: 1.0,
        color
      });
    }
    setGameState(prev => ({
      ...prev,
      particles: [...prev.particles, ...newParticles]
    }));
  };

  const processInput = useCallback((action: 'key' | 'backspace' | 'enter', key?: string) => {
    if (!stateRef.current.gameStarted || stateRef.current.gameOver) return;

    if (stateRef.current.showingTutorial) {
      if (action === 'enter' || (action === 'key' && key === ' ')) {
        startAfterTutorial();
      }
      return;
    }

    const now = performance.now();

    if (action === 'backspace') {
      typingBuffer.current = typingBuffer.current.slice(0, -1);
    } else if (action === 'enter') {
      const buffer = typingBuffer.current.toLowerCase();

      if (stateRef.current.mode === 'shooter') {
        let found = false;
        const newEnemies = stateRef.current.enemies.map(enemy => {
          if (enemy.active && enemy.correctAnswer.toLowerCase() === buffer) {
            found = true;
            createExplosion(enemy.x, enemy.y, '#4ade80');
            return { ...enemy, active: false };
          }
          return enemy;
        });

        if (found) {
          setGameState(prev => ({
            ...prev,
            score: prev.score + (buffer.length * 10),
            enemies: newEnemies,
            level: Math.floor(prev.score / 500) + 1
          }));
          typingBuffer.current = '';
        }
      } else if (stateRef.current.mode === 'practice') {
        const correct = stateRef.current.currentPracticeVerb?.conjugations[stateRef.current.currentPracticeSubject!]?.toLowerCase();
        
        if (now - lastEnterTime.current < 400 && !stateRef.current.isSkipping) {
          setGameState(prev => ({ ...prev, isSkipping: true, streak: 0 }));
          typingBuffer.current = '';
          setCurrentBuffer('');
          return;
        }
        lastEnterTime.current = now;

        if (buffer === correct) {
          const newStreak = stateRef.current.streak + 1;
          const showMessage = newStreak % 5 === 0 && newStreak > 0;
          setGameState(prev => ({ 
            ...prev, 
            score: prev.score + 10, 
            streak: newStreak,
            message: showMessage ? ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)] : prev.message
          }));
          
          if (showMessage) {
            setTimeout(() => {
              setGameState(prev => ({ ...prev, message: undefined }));
            }, 2000);
          }

          nextPracticeQuestion();
        } else {
          typingBuffer.current = '';
        }
      }
    } else if (action === 'key' && key) {
      if (/[a-zA-ZäöüßÄÖÜ]/.test(key)) {
        typingBuffer.current += key.toLowerCase();
        
        if (stateRef.current.mode === 'practice') {
          const correct = stateRef.current.currentPracticeVerb?.conjugations[stateRef.current.currentPracticeSubject!]?.toLowerCase();
          if (typingBuffer.current === correct) {
            const newStreak = stateRef.current.streak + 1;
            const showMessage = newStreak % 5 === 0 && newStreak > 0;
            setGameState(prev => ({ 
              ...prev, 
              score: prev.score + 10, 
              streak: newStreak,
              message: showMessage ? ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)] : prev.message
            }));

            if (showMessage) {
              setTimeout(() => {
                setGameState(prev => ({ ...prev, message: undefined }));
              }, 2000);
            }

            nextPracticeQuestion();
          }
        }
      }
    }
    setCurrentBuffer(typingBuffer.current);
  }, [nextPracticeQuestion, ENCOURAGEMENTS]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Backspace') {
      processInput('backspace');
    } else if (e.key === 'Enter') {
      processInput('enter');
    } else if (e.key.length === 1) {
      processInput('key', e.key);
    }
  }, [processInput]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const frameRef = useRef<number>(0);

  const update = useCallback((time: number) => {
    if (!stateRef.current.gameStarted || stateRef.current.gameOver) return;

    if (stateRef.current.showingTutorial) {
      frameRef.current = requestAnimationFrame(update);
      return;
    }

    if (stateRef.current.mode !== 'shooter') {
      frameRef.current = requestAnimationFrame(update);
      return;
    }

    if (lastSpawnTime.current === 0) {
      lastSpawnTime.current = time;
    }

    if (time - lastSpawnTime.current > ENEMY_SPAWN_INTERVAL / (1 + stateRef.current.level * 0.1)) {
      spawnEnemy();
      lastSpawnTime.current = time;
    }

    setGameState(prev => {
      const movedEnemies = prev.enemies
        .map(enemy => {
          if (!enemy.active) return enemy;

          const dx = enemy.targetX - enemy.x;
          const dy = enemy.targetY - enemy.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < PLAYER_RADIUS + 10) {
            // Hit player
            createExplosion(enemy.x, enemy.y, '#f87171');
            return { ...enemy, active: false, hitPlayer: true };
          }

          const vx = (dx / dist) * enemy.speed;
          const vy = (dy / dist) * enemy.speed;

          return {
            ...enemy,
            x: enemy.x + vx,
            y: enemy.y + vy,
            distance: dist
          };
        });

      // Count enemies that hit the player in THIS frame
      const healthReduction = movedEnemies.filter(e => (e as any).hitPlayer).length;
      const newHealth = Math.max(0, prev.health - healthReduction);
      const isGameOver = newHealth <= 0;

      const updatedEnemies = movedEnemies.filter(enemy => {
        if ((enemy as any).hitPlayer) return false;
        return true;
      });

      const updatedParticles = prev.particles
        .map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          life: p.life - 0.02
        }))
        .filter(p => p.life > 0);

      return {
        ...prev,
        health: newHealth,
        gameOver: isGameOver,
        enemies: updatedEnemies.filter(e => e.active || e.distance > 0),
        particles: updatedParticles
      };
    });

    frameRef.current = requestAnimationFrame(update);
  }, [spawnEnemy]);

  useEffect(() => {
    if (gameState.gameStarted && !gameState.gameOver) {
      frameRef.current = requestAnimationFrame(update);
      return () => {
        if (frameRef.current) cancelAnimationFrame(frameRef.current);
      }
    }
  }, [gameState.gameStarted, gameState.gameOver, update]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw Grid (Background)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      const gridSize = 50;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw Center Player
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Glow effect
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#60a5fa';
      ctx.fillStyle = '#1e3a8a';
      ctx.beginPath();
      ctx.arc(centerX, centerY, PLAYER_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw Particles
      stateRef.current.particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;

      // Draw Enemies
      stateRef.current.enemies.forEach(enemy => {
        if (!enemy.active) return;

        // Label background for legibility
        const labelWidth = 100;
        const labelHeight = 50;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.beginPath();
        ctx.roundRect(enemy.x - labelWidth/2, enemy.y - labelHeight/2, labelWidth, labelHeight, 10);
        ctx.fill();
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Infinitive and Subject
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Subject (Main focus)
        ctx.font = 'bold 20px Inter';
        ctx.fillStyle = '#fff';
        ctx.fillText(enemy.subject, enemy.x, enemy.y - 8);
        
        // Infinitive (Secondary focus)
        ctx.font = '11px Inter';
        ctx.fillStyle = '#93c5fd'; // blue-300
        ctx.fillText(enemy.infinitive, enemy.x, enemy.y + 12);
      });
    };

    render();
  }, [gameState.enemies, gameState.particles]);

  const startGame = (mode: GameMode = 'shooter') => {
    setGameState({
      score: 0,
      health: MAX_HEALTH,
      enemies: [],
      particles: [],
      gameOver: false,
      gameStarted: true,
      level: 1,
      mode,
      streak: 0,
      isSkipping: false,
      showingTutorial: true,
    });
    typingBuffer.current = '';
    setCurrentBuffer('');
    lastSpawnTime.current = 0;
  };

  const startAfterTutorial = () => {
    const mode = stateRef.current.mode;
    setGameState(prev => ({ ...prev, showingTutorial: false }));
    if (mode === 'practice') {
      nextPracticeQuestion();
    }
  };

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
      setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isMobile && gameState.gameStarted && !gameState.gameOver && !gameState.showingTutorial) {
      setShowKeyboard(true);
    } else {
      setShowKeyboard(false);
    }
  }, [isMobile, gameState.gameStarted, gameState.gameOver, gameState.showingTutorial]);

  return (
    <div className="relative w-full h-screen bg-[#050505] overflow-hidden font-sans text-white">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0"
      />

      {/* HUD */}
      {gameState.gameStarted && !gameState.gameOver && !gameState.showingTutorial && (
        <div className="absolute top-0 left-0 w-full p-4 md:p-6 flex justify-between items-start z-10 pointer-events-none">
          <div className="flex flex-col gap-2 scale-90 md:scale-100 origin-top-left">
            <div className="flex items-center gap-2 px-4 py-2 bg-black/50 border border-white/10 rounded-lg backdrop-blur-md">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span className="text-xl md:text-2xl font-bold tracking-tight">{gameState.score}</span>
            </div>
            {gameState.mode === 'shooter' && (
              <div className="flex items-center gap-2 px-4 py-2 bg-black/50 border border-white/10 rounded-lg backdrop-blur-md">
                <Zap className="w-5 h-5 text-blue-400" />
                <span className="text-xs md:text-sm font-medium uppercase tracking-widest text-blue-400">Level {gameState.level}</span>
              </div>
            )}
            <div className="flex items-center gap-2 px-4 py-2 bg-black/50 border border-white/10 rounded-lg backdrop-blur-md">
              <div className={`px-2 py-0.5 rounded text-[8px] md:text-[10px] font-bold uppercase tracking-wider ${gameState.mode === 'practice' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                {gameState.mode} Mode
              </div>
            </div>
            <button
              onClick={() => setGameState(prev => ({ ...prev, gameStarted: false }))}
              className="mt-1 flex items-center gap-2 px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-[8px] md:text-[10px] uppercase tracking-widest pointer-events-auto transition-colors"
            >
              <Menu className="w-3 h-3" />
              Abandon
            </button>
          </div>

          <div className="flex flex-col items-end gap-2 scale-90 md:scale-100 origin-top-right">
            {gameState.mode === 'shooter' && (
              <div className="flex items-center gap-3 px-3 py-2 bg-black/50 border border-white/10 rounded-lg backdrop-blur-md">
                <Heart className={`w-5 h-5 ${gameState.health <= 1 ? 'text-red-500 animate-pulse' : 'text-red-400'}`} />
                <div className="flex gap-1">
                  {[...Array(MAX_HEALTH)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-2 md:w-3 h-4 md:h-6 rounded-sm skew-x-[-20deg] transition-all duration-500 ${
                        i < gameState.health ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-white/10'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Practice Content UI */}
      {gameState.gameStarted && gameState.mode === 'practice' && !gameState.gameOver && !gameState.showingTutorial && (
        <div className={`absolute left-1/2 -translate-x-1/2 z-10 text-center pointer-events-none transition-all duration-500 ${showKeyboard ? 'top-1/4' : 'top-1/2 -translate-y-[60%]'}`}>
          <motion.div
            key={gameState.currentPracticeVerb?.infinitive + (gameState.currentPracticeSubject || '')}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 px-4"
          >
            <div className="text-xs md:text-sm text-white/40 uppercase tracking-[0.4em] font-medium">{gameState.currentPracticeVerb?.meaning}</div>
            <div className="text-4xl md:text-7xl font-black tracking-tighter uppercase italic line-clamp-1">{gameState.currentPracticeVerb?.infinitive}</div>
            <div className="text-lg md:text-2xl text-blue-400 font-medium tracking-widest uppercase bg-blue-500/10 px-4 md:px-6 py-1 md:py-2 rounded-full inline-block mt-2">
              {gameState.currentPracticeSubject}
            </div>
          </motion.div>
        </div>
      )}

      {/* Message Overlay */}
      <AnimatePresence>
        {gameState.message && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: -50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.5 }}
            className="absolute top-1/4 left-1/2 -translate-x-1/2 z-[30] pointer-events-none"
          >
            <div className="px-8 py-4 bg-yellow-500 text-black font-black text-3xl uppercase tracking-tighter rounded-2xl shadow-2xl">
              {gameState.message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Typing Indicator */}
      {gameState.gameStarted && !gameState.gameOver && !gameState.showingTutorial && (
        <div className={`absolute left-1/2 -translate-x-1/2 z-20 pointer-events-none transition-all duration-500 ${showKeyboard ? 'bottom-[45%]' : 'bottom-12'}`}>
          <div className="flex flex-col items-center">
            {!showKeyboard && <div className="text-[8px] md:text-xs uppercase tracking-[0.3em] text-white/40 mb-2">Engage Conjugation</div>}
            <div className={`flex items-center gap-2 px-4 md:px-8 py-2 md:py-4 bg-white/5 border-2 rounded-xl md:rounded-2xl backdrop-blur-xl min-w-[200px] md:min-w-[300px] justify-center transition-colors duration-300 ${gameState.isSkipping ? 'border-red-500 bg-red-500/10' : 'border-white/20'}`}>
              <span className={`text-2xl md:text-4xl font-bold tracking-wider ${gameState.isSkipping ? 'text-red-500' : 'text-white'}`}>
                {gameState.isSkipping 
                  ? gameState.currentPracticeVerb?.conjugations[gameState.currentPracticeSubject!] 
                  : currentBuffer}
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="inline-block w-1 h-6 md:h-10 bg-blue-400 ml-1 align-middle"
                />
              </span>
            </div>
            {!showKeyboard && (
              <div className="text-[8px] md:text-[10px] uppercase tracking-widest text-white/20 mt-4">
                {gameState.mode === 'practice' ? 'Double Enter to Skip' : 'Press ENTER to Fire'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Virtual Keyboard */}
      <AnimatePresence>
        {showKeyboard && (
          <motion.div
            initial={{ y: 200, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 200, opacity: 0 }}
            className="absolute bottom-0 left-0 w-full z-30 pointer-events-auto"
          >
            <VirtualKeyboard 
              onKey={(key) => processInput('key', key)}
              onBackspace={() => processInput('backspace')}
              onEnter={() => processInput('enter')}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {gameState.showingTutorial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 bg-black/90 backdrop-blur-md flex items-center justify-center p-6"
          >
            <div className="max-w-2xl w-full space-y-8 text-center">
              <div className="space-y-2">
                <div className={`text-xs uppercase tracking-[0.4em] font-black ${gameState.mode === 'shooter' ? 'text-red-500' : 'text-blue-500'}`}>
                  Tutorial: {gameState.mode} Mode
                </div>
                <h2 className="text-4xl font-black italic uppercase tracking-tighter italic">Mission Briefing</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 items-center pt-20 md:pt-0">
                <div className="aspect-video bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center relative overflow-hidden group">
                  {/* Mock Visual Tutorial representation instead of broken image generation */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10" />
                  <div className="relative z-10 space-y-4 scale-75 md:scale-100">
                    {gameState.mode === 'shooter' ? (
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-blue-500/20 rounded-full border border-blue-500/40 flex items-center justify-center">
                           <Target className="w-8 h-8 text-blue-400" />
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs font-bold text-white/60">TARGET SPOTTED</div>
                          <div className="bg-red-500/20 border border-red-500/30 px-3 py-1 rounded text-red-400 font-bold text-xs uppercase">ich + lernen</div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-green-500/20 rounded-full border border-green-500/40 flex items-center justify-center">
                           <BookOpen className="w-8 h-8 text-green-400" />
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs font-bold text-white/60">PRACTICE FOCUS</div>
                          <div className="bg-blue-500/20 border border-blue-500/30 px-3 py-1 rounded text-blue-400 font-bold text-xs uppercase">sein + du</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-left space-y-4 md:space-y-6">
                  <ul className="space-y-3 md:space-y-4">
                    {gameState.mode === 'shooter' ? (
                      <>
                        <li className="flex gap-3">
                          <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center flex-shrink-0 text-[8px] md:text-[10px] font-bold">1</div>
                          <p className="text-xs md:text-sm text-white/70">船に書かれた<span className="text-white font-bold">動詞</span>と<span className="text-white font-bold">主語</span>を確認せよ。</p>
                        </li>
                        <li className="flex gap-3">
                          <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center flex-shrink-0 text-[8px] md:text-[10px] font-bold">2</div>
                          <p className="text-xs md:text-sm text-white/70">正しい活用形をタイプして砲撃準備。</p>
                        </li>
                        <li className="flex gap-3">
                          <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center flex-shrink-0 text-[8px] md:text-[10px] font-bold">3</div>
                          <p className="text-xs md:text-sm text-white/70">ボタンをタップして発射。<span className="text-white font-bold">動詞が中心に到達する前</span>に撃墜せよ。</p>
                        </li>
                      </>
                    ) : (
                      <>
                        <li className="flex gap-3">
                          <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center flex-shrink-0 text-[8px] md:text-[10px] font-bold">1</div>
                          <p className="text-xs md:text-sm text-white/70">中心に表示される<span className="text-white font-bold">意味</span>と<span className="text-white font-bold">主語</span>を確認せよ。</p>
                        </li>
                        <li className="flex gap-3">
                          <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center flex-shrink-0 text-[8px] md:text-[10px] font-bold">2</div>
                          <p className="text-xs md:text-sm text-white/70">正しい活用形をタイピングすると自動で次の問題へ。</p>
                        </li>
                        <li className="flex gap-3">
                          <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center flex-shrink-0 text-[8px] md:text-[10px] font-bold">3</div>
                          <p className="text-xs md:text-sm text-white/70">ギブアップはボタンを２回連続タップ。赤文字の正解をタイプせよ。</p>
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={startAfterTutorial}
                  className="w-full flex items-center justify-center gap-3 bg-white text-black py-4 rounded-xl font-black text-xl transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                >
                  <Play className="w-6 h-6 fill-current" />
                  INITIATE MISSION
                </button>
                <div className="mt-4 text-[10px] uppercase tracking-widest text-white/20">Press SPACE or ENTER to start</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Menu / Game Over */}
      <AnimatePresence>
        {(!gameState.gameStarted || gameState.gameOver) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <div className="max-w-md w-full text-center">
              {!gameState.gameStarted ? (
                <motion.div
                  initial={{ y: 20 }}
                  animate={{ y: 0 }}
                  className="space-y-8"
                >
                  <div className="space-y-2">
                    <div className="flex justify-center mb-4">
                      <div className="p-4 bg-blue-500/20 rounded-3xl border border-blue-500/30">
                        <Languages className="w-16 h-16 text-blue-400" />
                      </div>
                    </div>
                    <h1 className="text-5xl font-black uppercase tracking-tighter italic text-center">
                      Konjugation<br />
                      <div className="flex flex-col items-center">
                        <span className="text-blue-500">Shooter</span>
                        <span className="block text-[10px] text-white/30 tracking-[0.5em] mt-1 not-italic font-medium">(EARLY VERSION)</span>
                      </div>
                    </h1>
                    <p className="text-white/60 text-sm tracking-wide">
                      Defend your station by typing the correct German verb conjugations.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <button
                      onClick={() => startGame('shooter')}
                      className="group relative flex items-center justify-center gap-3 bg-white text-black py-4 rounded-xl font-bold text-lg overflow-hidden transition-all hover:scale-105 active:scale-95"
                    >
                      <Target className="w-5 h-5" />
                      SHOOTER MODE
                    </button>

                    <button
                      onClick={() => startGame('practice')}
                      className="group relative flex items-center justify-center gap-3 bg-blue-600 text-white py-4 rounded-xl font-bold text-lg overflow-hidden transition-all hover:scale-105 active:scale-95"
                    >
                      <BookOpen className="w-5 h-5" />
                      PRACTICE MODE
                    </button>
                    
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-left space-y-3 max-h-48 overflow-y-auto">
                      <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Database: Included Verbs</div>
                      <div className="grid grid-cols-2 gap-2">
                        {VERBS.map(v => (
                          <div key={v.infinitive} className="flex flex-col">
                            <span className="text-xs font-bold text-blue-400">{v.infinitive}</span>
                            <span className="text-[10px] text-white/40">{v.meaning}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-left space-y-2">
                      <div className="text-[10px] uppercase tracking-widest text-white/40">Instructions</div>
                      <p className="text-xs text-white/60 leading-relaxed">
                        1. Identify the <span className="text-blue-400 font-bold">Subject</span> and <span className="text-white font-bold">Verb</span> on incoming ships.<br />
                        2. Type the correct conjugation (e.g., ich + machen = <span className="text-green-400 font-mono">mache</span>).<br />
                        3. Press <span className="bg-white/10 px-1 rounded">ENTER</span> to destroy the target.
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="space-y-8"
                >
                  <div className="space-y-2">
                    <h2 className="text-6xl font-black text-red-500 tracking-tighter uppercase italic">Mission Failed</h2>
                    <p className="text-white/40 uppercase tracking-widest text-sm">Base Integrity Compromised</p>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-4">
                    <div className="flex justify-between items-center px-4">
                      <span className="text-white/40 text-sm uppercase tracking-widest">Final Score</span>
                      <span className="text-4xl font-bold text-yellow-500">{gameState.score}</span>
                    </div>
                    <div className="flex justify-between items-center px-4">
                      <span className="text-white/40 text-sm uppercase tracking-widest">Peak Level</span>
                      <span className="text-2xl font-bold text-blue-400">{gameState.level}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => startGame(gameState.mode)}
                    className="w-full flex items-center justify-center gap-3 bg-white text-black py-4 rounded-xl font-bold text-lg transition-all hover:scale-105 active:scale-95"
                  >
                    <RotateCcw className="w-5 h-5" />
                    REDEPLOY UNIT
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

