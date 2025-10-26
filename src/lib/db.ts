import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'questions.json');
const RATE_LIMIT_PATH = path.join(process.cwd(), 'data', 'rate-limits.json');

export interface Question {
  id: string;
  text: string;
  timestamp: string;
  upvotes: number;
  category: string;
  upvotedIPs: string[];
  resolved?: boolean;
  resolvedAt?: string;
  hidden?: boolean;
  hiddenAt?: string;
}

export interface RateLimit {
  ip: string;
  count: number;
  resetDate: string;
}

// Ensure data directory exists
const ensureDataDir = () => {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

// Initialize DB files if they don't exist
const initializeDB = () => {
  ensureDataDir();
  
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify([], null, 2));
  }
  
  if (!fs.existsSync(RATE_LIMIT_PATH)) {
    fs.writeFileSync(RATE_LIMIT_PATH, JSON.stringify([], null, 2));
  }
};

// Cache for questions to improve performance
let questionsCache: Question[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5000; // 5 seconds cache

// Read questions from file with caching
export const getQuestions = (): Question[] => {
  initializeDB();
  
  // Return cached data if still valid
  const now = Date.now();
  if (questionsCache && (now - cacheTimestamp) < CACHE_TTL) {
    return questionsCache;
  }
  
  try {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    const questions: Question[] = JSON.parse(data);
    questionsCache = questions;
    cacheTimestamp = now;
    return questions;
  } catch (error) {
    console.error('Error reading questions:', error);
    return [];
  }
};

// Write questions to file and invalidate cache
export const saveQuestions = (questions: Question[]): void => {
  initializeDB();
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(questions, null, 2));
    // Invalidate cache
    questionsCache = questions;
    cacheTimestamp = Date.now();
  } catch (error) {
    console.error('Error saving questions:', error);
  }
};

// Add a new question
export const addQuestion = (text: string, category: string = 'Allgemein'): Question => {
  const questions = getQuestions();
  const newQuestion: Question = {
    id: Date.now().toString(),
    text,
    timestamp: new Date().toISOString(),
    upvotes: 0,
    category,
    upvotedIPs: []
  };
  questions.unshift(newQuestion);
  saveQuestions(questions);
  return newQuestion;
};

// Upvote a question
export const upvoteQuestion = (questionId: string, ip: string): { success: boolean; question?: Question; error?: string } => {
  const questions = getQuestions();
  const questionIndex = questions.findIndex(q => q.id === questionId);
  
  if (questionIndex === -1) {
    return { success: false, error: 'Question not found' };
  }
  
  const question = questions[questionIndex];
  
  // Check if IP already upvoted
  if (question.upvotedIPs.includes(ip)) {
    return { success: false, error: 'Already upvoted' };
  }
  
  // Add upvote
  question.upvotes += 1;
  question.upvotedIPs.push(ip);
  
  saveQuestions(questions);
  return { success: true, question };
};

// Rate limiting functions
export const getRateLimits = (): RateLimit[] => {
  initializeDB();
  try {
    const data = fs.readFileSync(RATE_LIMIT_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading rate limits:', error);
    return [];
  }
};

export const saveRateLimits = (limits: RateLimit[]): void => {
  initializeDB();
  try {
    fs.writeFileSync(RATE_LIMIT_PATH, JSON.stringify(limits, null, 2));
  } catch (error) {
    console.error('Error saving rate limits:', error);
  }
};

export const checkRateLimit = (ip: string, maxRequests: number = 100): boolean => {
  const limits = getRateLimits();
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  
  // Clean up old entries
  const validLimits = limits.filter(limit => {
    const resetDate = new Date(limit.resetDate);
    return resetDate >= now;
  });
  
  // Find or create limit entry for this IP
  let limitEntry = validLimits.find(limit => limit.ip === ip);
  
  if (!limitEntry) {
    limitEntry = {
      ip,
      count: 0,
      resetDate: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
    };
    validLimits.push(limitEntry);
  }
  
  // Check if limit exceeded
  if (limitEntry.count >= maxRequests) {
    return false;
  }
  
  // Increment count
  limitEntry.count += 1;
  saveRateLimits(validLimits);
  
  return true;
};

