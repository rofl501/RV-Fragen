'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ArrowUp, ThumbsUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { useRouter } from 'next/navigation';
import { Search, Filter, ArrowLeft, X, Sparkles, MessageSquare, List, LayoutGrid, Clock, Send, ChevronUp, Moon, Sun, Monitor, SlidersHorizontal, TrendingUp, Calendar, Shield, Check, Lock, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { useTheme } from 'next-themes';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Question {
  id: string;
  text: string;
  timestamp: string;
  upvotes: number;
  category: string;
  upvotedIPs?: string[];
}

interface QuestionWithLocal extends Question {
  hasUpvoted?: boolean;
  resolved?: boolean;
  resolvedAt?: string;
  hidden?: boolean;
  hiddenAt?: string;
}

export default function ProfessorQA() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [questions, setQuestions] = useState<QuestionWithLocal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('cards');
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionWithLocal | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hoveredItemId, setHoveredItemId] = useState<number | null>(null);
  const { theme, setTheme } = useTheme();
  const [randomTagline, setRandomTagline] = useState('');
  const [mounted, setMounted] = useState(false);
  
  // Filter & Sort states
  const [sortBy, setSortBy] = useState<'recent' | 'upvotes'>('upvotes');
  const [timeFilter, setTimeFilter] = useState<'all' | '24h' | '7d' | '30d'>('all');

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  // Admin states
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoginError, setAdminLoginError] = useState('');

  useEffect(() => {
    setMounted(true);
    checkAdminStatus();
}, []);
  
  // Check if user is already logged in as admin
  const checkAdminStatus = async () => {
    try {
      const response = await fetch('/api/admin/verify');
      const data = await response.json();
      setIsAdmin(data.isAdmin);
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };
  
  // Handle admin login
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoginError('');
    
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: adminUsername, password: adminPassword })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setIsAdmin(true);
        setShowAdminLogin(false);
        setAdminUsername('');
        setAdminPassword('');
        setToastMessage('Admin-Login erfolgreich');
                setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
            } else {
        setAdminLoginError(data.error || 'Login fehlgeschlagen');
      }
    } catch (error) {
      console.error('Error logging in:', error);
      setAdminLoginError('Netzwerkfehler');
    }
  };
  
  // Handle resolve/unresolve question
  const handleResolve = async (questionId: string, resolved: boolean) => {
    try {
      const response = await fetch('/api/admin/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, resolved })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update local state
        setQuestions(prev => prev.map(q => 
          q.id === questionId 
            ? { ...q, resolved: data.question.resolved, resolvedAt: data.question.resolvedAt }
            : q
        ));
        
        if (selectedQuestion && selectedQuestion.id === questionId) {
          setSelectedQuestion({
            ...selectedQuestion,
            resolved: data.question.resolved,
            resolvedAt: data.question.resolvedAt
          });
        }
        
        setToastMessage(resolved ? 'Frage als erledigt markiert' : 'Markierung entfernt');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (error) {
      console.error('Error resolving question:', error);
      setToastMessage('Fehler beim Markieren');
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
    }
  };
  
  // Handle hide/unhide question
  const handleHide = async (questionId: string, hidden: boolean) => {
    try {
      const response = await fetch('/api/admin/hide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, hidden })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Remove from local state if hidden
        if (hidden) {
          setQuestions(prev => prev.filter(q => q.id !== questionId));
          setDialogOpen(false);
        } else {
          // Update local state
          setQuestions(prev => prev.map(q => 
            q.id === questionId 
              ? { ...q, hidden: data.question.hidden, hiddenAt: data.question.hiddenAt }
              : q
          ));
        }
        
        setToastMessage(hidden ? 'Frage ausgeblendet' : 'Frage eingeblendet');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (error) {
      console.error('Error hiding question:', error);
      setToastMessage('Fehler beim Ausblenden');
        setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };
  
  // Load upvoted questions from localStorage
  const getUpvotedQuestions = (): Set<string> => {
    if (typeof window === 'undefined') return new Set();
    const stored = localStorage.getItem('upvotedQuestions');
    return stored ? new Set(JSON.parse(stored)) : new Set();
  };

  const saveUpvotedQuestion = (questionId: string) => {
    if (typeof window === 'undefined') return;
    const upvoted = getUpvotedQuestions();
    upvoted.add(questionId);
    localStorage.setItem('upvotedQuestions', JSON.stringify([...upvoted]));
  };

  // Fetch questions from API with filters
  const fetchQuestions = async () => {
    try {
      const params = new URLSearchParams({
        sortBy,
        timeFilter
      });
      const response = await fetch(`/api/questions?${params}`);
      const data = await response.json();
  if (data.success) {
        const upvoted = getUpvotedQuestions();
        const questionsWithLocal = data.questions.map((q: Question) => ({
          ...q,
          hasUpvoted: upvoted.has(q.id)
        }));
        setQuestions(questionsWithLocal);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      setToastMessage('Fehler beim Laden der Fragen');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setIsLoading(false);
  }
};

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const taglines = [
    '„Keine Frage ist zu klein.“ ~wahrscheinlich ein Mensch irgendwann mal',
    '"Ibuprofen"',
    '„67% der Studierende fragen nicht. Sei anders." ~Nicht ausgedachte Statistik',
    'Der, die, das Wer, wie, was Wieso weshalb warum? Wer nicht fragt bleibt dumm',
    'Ist das alles prüfungsrelevant?',
    'trivial',
    'Rofl501 - making tutorial sessions easy since 2025',
    'Turning coffee into wrong exam answers',
    'Fueled by Mate'
  ];

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * taglines.length);
    setRandomTagline(taglines[randomIndex]);
  }, []);
  
  const scrollRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: scrollRef,
    offset: ["start start", "end start"]
  });
  
  const bgOpacity = useTransform(scrollYProgress, [0, 0.5], [0.05, 0.2]);

  useEffect(() => {
    // Fetch questions from API on mount
    fetchQuestions();
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Refetch when filters change
  useEffect(() => {
    if (mounted) {
      setIsLoading(true);
      fetchQuestions();
    }
  }, [sortBy, timeFilter]);

  const handleQuestionClick = (question: QuestionWithLocal) => {
    setSelectedQuestion(question);
    setDialogOpen(true);
  };

  const handleUpvote = async (questionId: string) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    // Check if already upvoted
    if (question.hasUpvoted) {
      setToastMessage('Du hast diese Frage bereits upvoted!');
              setShowToast(true);
              setTimeout(() => setShowToast(false), 3000);
      return;
    }

    try {
      const response = await fetch('/api/upvote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId })
      });

      const data = await response.json();

      if (data.success) {
        // Save to localStorage
        saveUpvotedQuestion(questionId);
        
        // Update local state
        setQuestions(questions.map(q => {
          if (q.id === questionId) {
            return {
              ...q,
              upvotes: data.upvotes || q.upvotes + 1,
              hasUpvoted: true
            };
          }
          return q;
        }));

        // Update selected question if in dialog
        if (selectedQuestion && selectedQuestion.id === questionId) {
          setSelectedQuestion({
            ...selectedQuestion,
            upvotes: data.upvotes || selectedQuestion.upvotes + 1,
            hasUpvoted: true
          });
        }
      } else {
        setToastMessage(data.error || 'Fehler beim Upvoten');
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
      }
    } catch (error) {
      console.error('Error upvoting:', error);
      setToastMessage('Fehler beim Upvoten');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    }
  };

  const filteredQuestions = questions
    .filter(q => {
      const matchesSearch = q.text.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  
  const calculateStyles = (idx: number) => {
    if (hoveredItemId !== idx) return {};
    
    const card = document.getElementById(`card-${idx}`);
    if (!card) return {};
    
    const rect = card.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const distanceX = (mousePosition.x - centerX) / 25;
    const distanceY = (mousePosition.y - centerY) / 25;
    
    return {
      transform: `perspective(1000px) rotateX(${-distanceY}deg) rotateY(${distanceX}deg) scale3d(1.02, 1.02, 1.02)`,
      boxShadow: `0 10px 30px -5px rgba(0, 0, 0, 0.2), 0 5px 15px rgba(0, 0, 0, 0.1)`
    };
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
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80 overflow-hidden relative" ref={scrollRef}>
      {/* Animated background */}
      <motion.div 
        className="absolute inset-0 overflow-hidden z-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
      >
        <motion.div 
          className="absolute top-[10%] left-[5%] w-[30rem] h-[30rem] rounded-full bg-primary/5 blur-[8rem]"
          style={{ opacity: bgOpacity }}
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
          className="absolute bottom-[10%] right-[5%] w-[25rem] h-[25rem] rounded-full bg-blue-500/5 blur-[8rem]" 
          style={{ opacity: bgOpacity }}
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
        <motion.div
          className="absolute top-[40%] right-[25%] w-[20rem] h-[20rem] rounded-full bg-purple-500/5 blur-[7rem]"
          style={{ opacity: bgOpacity }}
          animate={{
            x: [0, 20, -15, 8, 0],
            y: [0, -5, 15, -10, 0]
          }}
          transition={{
            repeat: Infinity,
            duration: 25,
            ease: "easeInOut"
          }}
        />
      </motion.div>

      <main className="container mx-auto flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between"
        >
          <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => router.push('/')} 
              className="mr-2 hover:bg-primary/10 cursor-pointer"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Back</span>
              </Button>
            <div className="flex items-center gap-3">
              {mounted && (
                <Image 
                  src={theme === 'dark' ? "/RVlogo-darkmode.png" : "/RVlogo-lightmode.png"}
                  alt="Roter Vektor Logo" 
                  width={140}
                  height={45}
                  className="h-10 w-auto object-contain"
                  priority
                />
              )}
            <div>
              <motion.h1 
                  className="text-2xl font-bold tracking-tight flex items-center gap-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                  Tutor Fragen
              </motion.h1>
              <motion.p 
                  className="text-muted-foreground text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {randomTagline}
              </motion.p>
              </div>
            </div>
          </div>

          <motion.div 
            className="flex items-center mt-4 md:mt-0 gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {/* Admin Login Button - versteckt, nur bei Shift+Alt+A */}
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAdminLogin(true)}
                onKeyDown={(e) => {
                  if (e.shiftKey && e.altKey && e.key === 'A') {
                    setShowAdminLogin(true);
                  }
                }}
                className={`border-border/40 hover:border-border/60 ${isAdmin ? 'text-green-500' : 'opacity-20 hover:opacity-40'} transition-opacity cursor-pointer`}
              >
                <Shield className="h-5 w-5" />
                <span className="sr-only">Admin</span>
              </Button>
            )}
            
            {/* Theme Switcher */}
            {mounted && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className="border-border/40 hover:border-border/60 cursor-pointer">
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

            <Button 
              onClick={() => router.push('/')}
              className="gap-2 cursor-pointer"
            >
              <Send className="h-4 w-4" />
              Neue Frage
            </Button>
          </motion.div>
        </motion.div>


        <motion.div 
          className="flex items-center mt-4 md:mt-0 gap-3 flex-wrap"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="relative flex-1 md:w-64 group">
    <div className="absolute left-2.5 top-2.5 z-10">
      <Search className="h-4 w-4 text-primary" />
    </div>
    <Input
      type="search" 
              placeholder="Nach Fragen suchen..."
      className="pl-8 w-full bg-background/80 backdrop-blur-sm border-primary/20 focus:border-primary focus-visible:ring-primary/30 transition-all duration-200"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
    />
    {searchQuery && (
      <motion.button
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground z-10"
        onClick={() => setSearchQuery('')}
      >
        <X className="h-4 w-4" />
      </motion.button>
    )}
  </div>
            
          {/* Filter & Sort Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2 border-border/40 hover:border-border/60 bg-card/50 backdrop-blur-sm cursor-pointer">
                <SlidersHorizontal className="h-4 w-4" />
                Filter & Sortierung
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72 p-4 bg-card/95 backdrop-blur-md border-border/40">
              <div className="space-y-4">
                {/* Sort Section */}
                <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold">Sortierung</span>
                </div>
                  <Select value={sortBy} onValueChange={(value: 'recent' | 'upvotes') => setSortBy(value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
              </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upvotes">Nach Upvotes</SelectItem>
                      <SelectItem value="recent">Neueste zuerst</SelectItem>
              </SelectContent>
            </Select>
                </div>

                {/* Time Filter Section */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold">Zeitraum</span>
                  </div>
                  <Select value={timeFilter} onValueChange={(value: 'all' | '24h' | '7d' | '30d') => setTimeFilter(value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle</SelectItem>
                      <SelectItem value="24h">Letzte 24 Stunden</SelectItem>
                      <SelectItem value="7d">Letzte 7 Tage</SelectItem>
                      <SelectItem value="30d">Letzte 30 Tage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

              </div>
            </PopoverContent>
          </Popover>

          <div className="flex gap-2">
              <Button
                variant={viewMode === 'cards' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('cards')}
                className="gap-2 cursor-pointer"
              >
                <LayoutGrid className="h-4 w-4" />
                Cards
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="gap-2 cursor-pointer"
              >
                <List className="h-4 w-4" />
                Liste
              </Button>
          </div>
          </motion.div>
          
        <div className="mt-4">
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                className={viewMode === 'cards' 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  : "space-y-3"
                }
                >
                {[...Array(8)].map((_, i) => (
                    <motion.div 
                      key={i} 
                      className="bg-background/50 backdrop-blur-sm rounded-lg border border-primary/10 overflow-hidden"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <div className="p-4">
                        <div className="h-6 bg-primary/10 rounded-md w-3/4 mb-2 animate-pulse" />
                        <div className="h-4 bg-primary/5 rounded-md w-1/2 mb-2 animate-pulse" />
                        <div className="h-4 bg-primary/5 rounded-md w-5/6 animate-pulse" />
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
            ) : filteredQuestions.length > 0 ? (
              viewMode === 'cards' ? (
                // Card View
                <motion.div 
                  key="cards"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                >
                  {filteredQuestions.map((question, idx) => (
                    <motion.div
                      id={`card-${idx}`}
                      key={question.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      style={calculateStyles(idx)}
                      onMouseEnter={() => setHoveredItemId(idx)}
                      onMouseLeave={() => setHoveredItemId(null)}
                      whileTap={{ scale: 0.98 }}
                      className="will-change-transform perspective"
                    >
                      <Card 
                        className="group overflow-hidden border-border/40 bg-card/50 backdrop-blur-md hover:bg-card/70 transition-all duration-300 hover:border-border/60 cursor-pointer h-full flex flex-col p-3"
                        onClick={() => handleQuestionClick(question)}
                      >
                        <div className="flex-1 space-y-2">
                          <div className="flex justify-start items-start gap-2">
                            <div className="flex items-center gap-1.5">
                              {question.resolved && (
                                <Badge variant="outline" className="text-xs whitespace-nowrap bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30 px-2 py-0.5 flex items-center gap-1">
                                  <Check className="h-3 w-3" />
                                  Erledigt
                                </Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-sm font-medium line-clamp-3 group-hover:text-primary transition-colors duration-200 leading-snug">
                            {question.text}
                          </p>
                        </div>
                        <div className="flex items-center justify-between pt-2 mt-2 border-t border-border/50">
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`gap-1.5 cursor-pointer h-7 px-2 -ml-2 ${question.hasUpvoted ? 'text-primary' : 'text-muted-foreground'}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpvote(question.id);
                            }}
                          >
                            <ChevronUp className="h-4 w-4" />
                            <span className="font-semibold text-sm">{question.upvotes}</span>
                          </Button>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{formatTimeAgo(question.timestamp)}</span>
                          </div>
                        </div>
                      </Card>
                            </motion.div>
                  ))}
                </motion.div>
              ) : (
                // List View
                <motion.div
                  key="list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  {filteredQuestions.map((question, idx) => (
                    <motion.div
                      key={question.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Card 
                        className="border-border/40 bg-card/50 backdrop-blur-sm hover:border-border/60 transition-all cursor-pointer p-3"
                        onClick={() => handleQuestionClick(question)}
                      >
                        <div className="flex gap-2.5">
                          <div className="flex flex-col items-center gap-0.5 pt-0.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-7 w-7 p-0 cursor-pointer ${question.hasUpvoted ? 'text-primary' : 'text-muted-foreground'}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpvote(question.id);
                              }}
                            >
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                            <span className={`text-xs font-semibold ${question.hasUpvoted ? 'text-primary' : 'text-foreground'}`}>
                              {question.upvotes}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div className="flex items-center gap-2 mb-1.5">
                              {question.resolved && (
                                <Badge variant="outline" className="text-xs whitespace-nowrap bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30 px-2 py-0.5 flex items-center gap-1">
                                  <Check className="h-3 w-3" />
                                  Erledigt
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm leading-snug mb-2">{question.text}</p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{formatTimeAgo(question.timestamp)}</span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              )
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  <motion.div 
                    className="rounded-full bg-primary/10 p-4 mb-4"
                    animate={{ 
                      boxShadow: ['0 0 0 rgba(0, 0, 0, 0)', '0 0 20px rgba(147, 51, 234, 0.3)', '0 0 0 rgba(0, 0, 0, 0)'] 
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Search className="h-6 w-6 text-primary" />
                  </motion.div>
                <h2 className="text-xl font-semibold">Keine Fragen gefunden</h2>
                  <p className="text-muted-foreground mt-2">
                  Versuche einen anderen Suchbegriff oder stelle die erste Frage!
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
        </div>


        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-lg md:max-w-2xl bg-background/95 backdrop-blur-lg border-border/40 p-6">
            {selectedQuestion && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <DialogHeader className="space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedQuestion.resolved && (
                      <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30 px-2 py-0.5 flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        Erledigt
                    </Badge>
                    )}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatTimeAgo(selectedQuestion.timestamp)}
                    </div>
                  </div>
                  <DialogTitle className="text-xl font-bold leading-tight">{selectedQuestion.text}</DialogTitle>
                </DialogHeader>
                
                <div className="flex justify-between items-center mt-6 pt-4 border-t border-border/50">
  <div className="flex gap-2">
  <Button 
                      variant="outline"
                      size="sm"
                      className={`gap-2 cursor-pointer ${selectedQuestion.hasUpvoted ? 'text-primary border-primary' : ''}`}
                      onClick={() => handleUpvote(selectedQuestion.id)}
                    >
                      <ChevronUp className="h-4 w-4" />
                      {selectedQuestion.hasUpvoted ? 'Upvoted' : 'Upvote'}
                      <span className="font-semibold">({selectedQuestion.upvotes})</span>
    </Button>
                    
                    {/* Admin: Erledigt & Ausblenden Buttons */}
                    {isAdmin && (
                      <>
  <Button 
                          variant={selectedQuestion.resolved ? "default" : "outline"}
                          size="sm"
                          className={`gap-2 cursor-pointer ${selectedQuestion.resolved ? 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30 hover:bg-green-500/30' : ''}`}
                          onClick={() => handleResolve(selectedQuestion.id, !selectedQuestion.resolved)}
                        >
                          <Check className="h-4 w-4" />
                          {selectedQuestion.resolved ? 'Unerledigt' : 'Erledigt'}
    </Button>
                        
    <Button 
                          variant="outline"
                          size="sm"
                          className="gap-2 cursor-pointer bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30 hover:bg-orange-500/20"
                          onClick={() => handleHide(selectedQuestion.id, true)}
                        >
                          <EyeOff className="h-4 w-4" />
                          Erledigt & Ausblenden
    </Button>
                      </>
                    )}
  </div>
  
  <DialogClose asChild>
    <Button 
      variant="outline" 
                      size="sm"
                      className="hover:bg-primary/10 hover:text-primary transition-all duration-200 border-border/40 cursor-pointer" 
    >
      Schließen
    </Button>
  </DialogClose>
</div>
              </motion.div>
            )}
          </DialogContent>
        </Dialog>

        <AnimatePresence>
          {showToast && (
            <motion.div
              className="fixed bottom-6 right-6 bg-background/95 backdrop-blur-lg border border-primary/30 shadow-lg rounded-lg p-4 max-w-md z-50 flex items-center gap-3"
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              <div className="rounded-full bg-primary/20 p-2">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{toastMessage}</p>
                <div className="mt-1 h-1 bg-background rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary"
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: 3, ease: "linear" }}
                  />
                </div>
              </div>
              <Button 
                size="icon" 
                variant="ghost" 
                className="ml-auto h-6 w-6 text-muted-foreground hover:text-foreground cursor-pointer"
                onClick={() => setShowToast(false)}
              >
                <X className="h-3 w-3" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showScrollTop && (
            <motion.button
              className="fixed bottom-6 right-6 bg-background/95 backdrop-blur-lg border border-primary/30 shadow-lg rounded-full p-3 z-49 cursor-pointer hover:bg-background transition-colors"
              onClick={scrollToTop}
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="rounded-full p-1">
                <ArrowUp className="h-5 w-5 text-primary" />
              </div>
              <span className="sr-only">Nach oben</span>
            </motion.button>
          )}
        </AnimatePresence>
        
        {/* Admin Login Dialog */}
        <Dialog open={showAdminLogin} onOpenChange={setShowAdminLogin}>
          <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-lg border-border/40 p-6">
            <DialogHeader className="space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <DialogTitle className="text-xl font-bold">Admin-Login</DialogTitle>
              </div>
              <DialogDescription>
                Melde dich an, um Fragen zu verwalten.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleAdminLogin} className="space-y-4 mt-4">
              <div className="space-y-2">
                <label htmlFor="admin-username" className="text-sm font-medium">
                  Benutzername
                </label>
                <Input
                  id="admin-username"
                  type="text"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  placeholder="admin"
                  required
                  autoComplete="username"
                  className="bg-background/50"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="admin-password" className="text-sm font-medium">
                  Passwort
                </label>
                <Input
                  id="admin-password"
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="bg-background/50"
                />
              </div>
              
              {adminLoginError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-sm text-red-500 bg-red-500/10 border border-red-500/30 rounded-lg p-3"
                >
                  <X className="h-4 w-4" />
                  {adminLoginError}
                </motion.div>
              )}
              
              <div className="flex gap-2 pt-2">
                <Button
                  type="submit"
                  className="flex-1 gap-2 cursor-pointer"
                >
                  <Lock className="h-4 w-4" />
                  Anmelden
                </Button>
                <DialogClose asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="cursor-pointer"
                  >
                    Abbrechen
                  </Button>
                </DialogClose>
              </div>
            </form>
          </DialogContent>
        </Dialog>

      </main>
    </div>
  );
}
