# 🔐 Admin Setup Anleitung

## Schritt 1: Passwort-Hash generieren

Führe das Setup-Script aus, um einen Passwort-Hash zu generieren:

```bash
node scripts/setup-admin.js deinSicheresPasswort
```

Das Script gibt dir einen Hash aus, den du im nächsten Schritt benötigst.

## Schritt 2: .env.local Datei erstellen

Erstelle eine Datei namens `.env.local` im Projekt-Root mit folgendem Inhalt:

```env
# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=<der-generierte-hash-aus-schritt-1>

# JWT Secret (mindestens 32 Zeichen lang)
JWT_SECRET=dein-zufaelliges-secret-minimum-32-zeichen-lang
```

### JWT Secret generieren (optional, aber empfohlen):

```bash
openssl rand -base64 32
```

## Schritt 3: Server neu starten

Starte den Development-Server neu:

```bash
npm run dev
```

## Admin-Login verwenden

### Zugang zum Admin-Panel:

1. **Dezenter Zugang**: Klicke auf das **Shield-Icon** (🛡️) in der oberen rechten Ecke der Hauptseite
2. **Keyboard-Shortcut**: Drücke `Shift + Alt + A` (funktioniert noch nicht, nur der Button)

### Nach dem Login:

- Das Shield-Icon wird **grün** (✅ angemeldet)
- In den **Fragen-Details** siehst du einen Button "**Als erledigt markieren**"
- Beantwortete Fragen werden mit einem schönen grünen **"Erledigt"**-Badge markiert ✓

## Sicherheitshinweise

- ⚠️ **Teile niemals** deine `.env.local` Datei!
- ⚠️ Die Datei ist bereits in `.gitignore` und wird **nicht** committet
- 🔒 Verwende ein **starkes Passwort** (mindestens 8 Zeichen)
- 🔒 Ändere das JWT_SECRET auf einen **zufälligen Wert**
- 🔐 Admin-Credentials werden **verschlüsselt** (bcrypt) und Tokens sind **signiert** (JWT)

## Troubleshooting

### "Admin password hash not configured!"

→ Du hast vergessen, `ADMIN_PASSWORD_HASH` in der `.env.local` zu setzen.

### Login schlägt fehl

→ Stelle sicher, dass der Hash korrekt kopiert wurde (keine Leerzeichen/Zeilenumbrüche).

### Server startet nicht

→ Überprüfe, ob alle Umgebungsvariablen korrekt gesetzt sind.

