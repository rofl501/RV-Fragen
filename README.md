# RV-Fragen 🎓

Eine anonyme Q&A-Plattform für Tutoriumsfragen. Studierende können anonym Fragen stellen, upvoten und Tutoren können Fragen als erledigt markieren oder ausblenden.

> ⚠️ **WICHTIG FÜR PRODUCTION**: Diese Anwendung MUSS hinter einem Reverse Proxy mit HTTPS betrieben werden! HTTP-only Cookies funktionieren nur sicher über HTTPS.

## ✨ Features

- 📝 **Anonyme Fragen** - Studierende können ohne Registrierung Fragen stellen
- ⬆️ **Upvote-System** - Die wichtigsten Fragen steigen nach oben
- 🔐 **Admin-Panel** - Tutoren können Fragen verwalten
  - Als erledigt markieren
  - Ausblenden (beantwortet & archiviert)
- 🛡️ **Sicherheit**
  - Rate Limiting (10 Fragen pro Tag pro IP)
  - XSS-Schutz durch Input-Sanitization
  - IP-basierte Upvote-Sperre
- 📊 **Filter & Sortierung**
  - Nach Upvotes oder Zeitpunkt sortieren
  - Zeitfilter (24h, 7 Tage, 30 Tage)
- 💾 **Persistente Daten** - Lokale JSON-Datenbank mit Caching

## 🚀 Setup

### 1. Voraussetzungen

- Node.js 18+ 
- npm oder yarn

### 2. Installation

```bash
# Repository klonen
git clone https://github.com/rofl501/RV-Fragen
cd yamiseum-standalone

# Dependencies installieren
npm install
```

### 3. Umgebungsvariablen einrichten

Kopiere die `.env.example` Datei zu `.env.local` und fülle sie aus:

```bash
cp .env.example .env.local
```

Dann bearbeite `.env.local` mit deinen Werten:

```env
# Admin-Zugangsdaten
ADMIN_USERNAME=dein-username
ADMIN_PASSWORD_HASH_BASE64=<generierter-hash>

# JWT Secret (mindestens 32 Zeichen)
JWT_SECRET=dein-zufaelliges-secret-min-32-zeichen-lang
```

**⚠️ WICHTIG**: Alle drei Umgebungsvariablen sind PFLICHT! Die Anwendung startet nicht ohne sie.

#### Admin-Passwort generieren

Führe folgendes aus, um einen Passwort-Hash zu erstellen:

```bash
node -e "const bcrypt = require('bcryptjs'); const password = 'dein-passwort'; const hash = bcrypt.hashSync(password, 10); const base64 = Buffer.from(hash).toString('base64'); console.log('ADMIN_PASSWORD_HASH_BASE64=' + base64);"
```

Kopiere die Ausgabe in deine `.env.local`.

#### JWT Secret generieren (optional)

```bash
openssl rand -base64 32
```

### 4. Logos hinzufügen

Lege deine Logos im `public/` Ordner ab:
- `RVlogo-lightmode.png` - Logo für Light Mode
- `RVlogo-darkmode.png` - Logo für Dark Mode

### 5. Entwicklungsserver starten

```bash
npm run dev
```

Die App läuft jetzt auf [http://localhost:3000](http://localhost:3000)

## 🔐 Admin-Zugang

1. Klicke auf das **Shield-Icon** (🛡️) oben rechts
2. Logge dich mit deinen Credentials aus `.env.local` ein
3. Das Shield-Icon wird grün wenn du eingeloggt bist ✅

### Admin-Funktionen

- **Fragen als erledigt markieren** - Grünes Badge wird angezeigt
- **Fragen ausblenden** - Entfernt die Frage aus der öffentlichen Ansicht (bleibt in DB)

## 🏗️ Technologie-Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: Shadcn UI + Tailwind CSS
- **Animationen**: Framer Motion
- **Auth**: JWT + bcrypt
- **Datenbank**: Lokale JSON-Files (`data/`)
- **TypeScript**: Typsicherheit

## 📁 Projekt-Struktur

```
├── src/
│   ├── app/
│   │   ├── page.tsx              # Haupt-Q&A-Seite
│   │   ├── landing/page.tsx      # Frage-stellen Seite
│   │   ├── api/
│   │   │   ├── questions/        # Fragen CRUD
│   │   │   ├── upvote/           # Upvote-Logik
│   │   │   └── admin/            # Admin-Endpoints
│   │   ├── layout.tsx            # Root Layout + Theme Provider
│   │   └── globals.css           # Globale Styles
│   ├── components/ui/            # Shadcn UI Komponenten
│   ├── lib/
│   │   ├── db.ts                 # Datenbank-Logik
│   │   ├── auth.ts               # Admin-Authentifizierung
│   │   ├── sanitize.ts           # Input-Sanitization
│   │   └── utils.ts              # Utilities
│   └── hooks/                    # Custom Hooks
├── public/                       # Statische Assets (Logos)
├── data/                         # JSON-Datenbank (im .gitignore)
├── .env.local                    # Umgebungsvariablen (im .gitignore)
└── README.md
```

## 🔒 Sicherheit

- **Passwörter**: Werden mit bcrypt gehashed
- **JWT Tokens**: HTTP-only Cookies mit 7-Tage Gültigkeit
- **Rate Limiting**: 10 Fragen pro Tag pro IP
- **XSS-Schutz**: Alle Inputs werden mit DOMPurify sanitized
- **IP-Tracking**: Verhindert mehrfaches Upvoten derselben Frage

## 🚢 Production Deployment

### ⚠️ KRITISCHE SICHERHEITSHINWEISE

**HTTPS IST PFLICHT!** Die Anwendung verwendet HTTP-only Cookies für Admin-Sessions. Diese sind nur über HTTPS sicher!

### Empfohlene Plattformen

- **Vercel** (empfohlen für Next.js)
- **Railway**
- **Render**
- Eigener Server mit Node.js + Nginx/Apache als Reverse Proxy

### Wichtige Hinweise

1. `.env.local` durch Production-Variablen ersetzen
2. `NODE_ENV=production` setzen
3. **HTTPS zwingend erforderlich** (für secure Cookies)
4. Reverse Proxy richtig konfigurieren (siehe unten)
5. Regelmäßige Backups der `data/` Ordner

### Reverse Proxy Konfiguration (z.B. Nginx)

**Wichtig für korrektes IP-Tracking und Rate Limiting!**

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL Zertifikate
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # WICHTIG für IP-Tracking:
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Vercel Deployment

```bash
# Vercel CLI installieren
npm i -g vercel

# Deployment
vercel

# Environment Variables in Vercel Dashboard setzen:
# - ADMIN_USERNAME
# - ADMIN_PASSWORD_HASH_BASE64
# - JWT_SECRET
```

## 📝 Lizenz

MIT License - Siehe [LICENSE](LICENSE) Datei für Details.
