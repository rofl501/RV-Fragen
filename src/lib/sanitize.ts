/**
 * Sanitize user input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // Remove script tags and their content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handlers
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=\s*[^\s>]*/gi, '');
  
  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Trim and limit length
  sanitized = sanitized.trim().slice(0, 500);
  
  return sanitized;
}

/**
 * Validate question text
 */
export function validateQuestion(text: string): { valid: boolean; error?: string } {
  const sanitized = sanitizeInput(text);
  
  if (!sanitized || sanitized.length === 0) {
    return { valid: false, error: 'Frage darf nicht leer sein' };
  }
  
  if (sanitized.length < 10) {
    return { valid: false, error: 'Frage muss mindestens 10 Zeichen lang sein' };
  }
  
  if (sanitized.length > 500) {
    return { valid: false, error: 'Frage darf maximal 500 Zeichen lang sein' };
  }
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /onerror=/i,
    /onclick=/i,
    /onload=/i,
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(text)) {
      return { valid: false, error: 'Ungültige Zeichen in der Frage' };
    }
  }
  
  return { valid: true };
}

