'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MessageSquare, Sparkles, Moon, Sun, Monitor, ChevronUp } from "lucide-react";
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface RecentQuestion {
  id: string;
  text: string;
  timestamp: string;
  upvotes: number;
  category: string;
}

export default function Landing() {
  const [question, setQuestion] = useState('');
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [recentQuestions, setRecentQuestions] = useState<RecentQuestion[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  useEffect(() => {
    setMounted(true);
    fetchRecentQuestions();
  }, []);

  const fetchRecentQuestions = async () => {
    try {
      const response = await fetch('/api/questions');
      const data = await response.json();
      if (data.success) {
        // Get last 4 questions
        setRecentQuestions(data.questions.slice(0, 4));
      }
    } catch (error) {
      console.error('Error fetching recent questions:', error);
    } finally {
      setLoadingRecent(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim()) {
      try {
        const response = await fetch('/api/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: question, category: '' })
        });

        const data = await response.json();

        if (data.success) {
          // Reset form and show success
          setQuestion('');
          toast.success('Frage erfolgreich eingereicht!');
        } else {
          toast.error(data.error || 'Fehler beim Absenden der Frage');
        }
      } catch (error) {
        console.error('Error submitting question:', error);
        toast.error('Fehler beim Absenden der Frage');
      }
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'gerade eben';
    if (seconds < 3600) return `vor ${Math.floor(seconds / 60)} Min.`;
    if (seconds < 86400) return `vor ${Math.floor(seconds / 3600)} Std.`;
    return `vor ${Math.floor(seconds / 86400)} Tagen`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80 overflow-hidden relative flex flex-col">
      {/* Animated background blobs */}
      <motion.div 
        className="absolute inset-0 overflow-hidden z-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
      >
        <motion.div 
          className="absolute top-[10%] left-[5%] w-[40rem] h-[40rem] rounded-full bg-primary/5 blur-[8rem]"
          animate={{ 
            x: [0, 10, -5, 15, 0], 
            y: [0, 15, 8, -10, 0] 
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 20,
            ease: "easeInOut" 
          }}
        />
        <motion.div 
          className="absolute bottom-[10%] right-[5%] w-[35rem] h-[35rem] rounded-full bg-blue-500/5 blur-[8rem]" 
          animate={{ 
            x: [0, -15, 8, -10, 0], 
            y: [0, 10, -8, 5, 0] 
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 23,
            ease: "easeInOut"  
          }}
        />
      </motion.div>

      {/* Header with theme switcher */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 right-0 p-6 z-50"
      >
        {mounted && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="border-border/40 bg-card/50 backdrop-blur-md hover:bg-card/70 cursor-pointer">
                {theme === 'dark' ? (
                  <Moon className="h-5 w-5" />
                ) : theme === 'light' ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Monitor className="h-5 w-5" />
                )}
                <span className="sr-only">Toggle theme</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-40 p-2 bg-card/95 backdrop-blur-md border-border/40">
              <div className="flex flex-col gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTheme('light')}
                  className="justify-start gap-2 cursor-pointer"
                >
                  <Sun className="h-4 w-4" />
                  Light
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTheme('dark')}
                  className="justify-start gap-2 cursor-pointer"
                >
                  <Moon className="h-4 w-4" />
                  Dark
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTheme('system')}
                  className="justify-start gap-2 cursor-pointer"
                >
                  <Monitor className="h-4 w-4" />
                  System
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </motion.div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-3xl mx-auto space-y-8">
          {/* Logo and Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center space-y-4"
          >
            <motion.div
              className="flex flex-col items-center justify-center gap-8 mb-4"
              animate={{ 
                scale: [1, 1.01, 1],
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity,
                repeatDelay: 2
              }}
            >
              {mounted && (
                <Image 
                  src={theme === 'dark' ? "/RVlogo-darkmode.png" : "/RVlogo-lightmode.png"}
                  alt="Roter Vektor Logo" 
                  width={280}
                  height={90}
                  className="h-20 w-auto object-contain"
                  priority
                />
              )}
              <div className="text-center space-y-2">
                <h1 className="text-6xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                  Tutorium Q&A
                </h1>
                <p className="text-sm text-muted-foreground font-medium">
                  Stelle anonyme Fragen an deinen Tutor
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* Main Input Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative">
                <Textarea
                  placeholder="Was möchtest du heute fragen?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="min-h-[120px] text-base resize-none bg-card/50 backdrop-blur-md border-border/40 focus:border-border/60 rounded-xl p-4 pr-14 shadow-lg"
                  maxLength={500}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!question.trim()}
                  className="absolute bottom-3 right-3 rounded-full h-10 w-10 shadow-lg cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex justify-between items-center px-1">
                <span className="text-xs text-muted-foreground">
                  {question.length} / 500
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/landing')}
                  className="text-muted-foreground hover:text-foreground cursor-pointer text-sm h-8"
                >
                  Alle Fragen ansehen →
                </Button>
              </div>
            </form>
          </motion.div>

          {/* Recent Questions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-3"
          >
            <p className="text-sm text-muted-foreground text-center flex items-center justify-center gap-2 font-medium">
              <Sparkles className="h-4 w-4" />
              Was andere gerade fragen
            </p>
            {loadingRecent ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[...Array(4)].map((_, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-card/50 backdrop-blur-sm border border-border/40 animate-pulse"
                  >
                    <div className="h-4 bg-border/50 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-border/30 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : recentQuestions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {recentQuestions.map((q, idx) => (
                  <motion.div
                    key={q.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + idx * 0.1 }}
                    className="p-3 rounded-lg bg-card/50 backdrop-blur-sm border border-border/40 hover:border-border/60 hover:bg-card/70 transition-all cursor-pointer group"
                    onClick={() => router.push('/landing')}
                  >
                    <div className="flex items-end justify-end gap-2 mb-2">
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(q.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm line-clamp-2 group-hover:text-primary transition-colors">
                      {q.text}
                    </p>
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <ChevronUp className="h-3 w-3" />
                      <span>{q.upvotes}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground">
                <p>Noch keine Fragen vorhanden.</p>
                <p className="mt-1">Sei der Erste! 🚀</p>
              </div>
            )}
          </motion.div>

          {/* Info Text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center text-xs text-muted-foreground/80"
          >
            <p>🔒 Deine Frage wird anonym gepostet und ist für alle sichtbar</p>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="p-6 text-center text-sm text-muted-foreground relative z-10"
      >
        <p>Gekocht von <a href="https://github.com/rofl501" className="text-primary hover:underline">rofl501</a></p>
      </motion.div>
    </div>
  );
}

