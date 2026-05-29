# Pisinapp — κατάσταση project & συνέχεια εργασίας

> **Διάβασε αυτό πρώτα** σε κάθε νέο chat. Ενημέρωσέ το όταν ολοκληρώνεται μεγάλο βήμα.

## Τι είναι

Web εφαρμογή για εταιρείες συντήρησης πισίνας: καταχώρηση πισίνων, δελτία επίσκεψης (αντί χαρτιού), φωτογραφίες, ρόλοι χρηστών. Σχεδιασμένη ως **multi-tenant SaaS** (`companyId` σε κάθε πίνακα), deploy μόνο για 1ο πελάτη προς το παρόν.

## Πού είναι ο κώδικας

| | |
|---|---|
| **Φάκελος (άνοιγε ΠΑΝΤΑ αυτόν)** | `C:\Projects\pisinapp\pisinapp` |
| **GitHub** | repo `pisinapp` (PanosAndrik) |
| **Live (Railway)** | `https://pisinapp-production.up.railway.app` |
| **Βάση** | PostgreSQL στο Railway (ίδιο project) |

Μην δουλεύεις σε `C:\Users\P\source\repos\...` ή σε parent `C:\Projects\pisinapp` χωρίς το εσωτερικό `pisinapp` — εκεί είναι το `.git`.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind
- Prisma + PostgreSQL
- Deploy: GitHub → Railway (auto deploy on push)
- Build: `prisma generate && next build`

## Ρόλοι

| Ρόλος | Διαδρομές |
|--------|-----------|
| **SUPER_ADMIN** | `/app/super-admin` — εταιρείες, bosses, technicians, διαγραφή |
| **ADMIN** (boss) | `/app/admin`, pools, visits, team |
| **TECHNICIAN** | `/app/technician`, `/app/technician/visits` |

Σύνδεση: `/signin`

## Τι έχει ολοκληρωθεί (Μάιος 2026)

- [x] GitHub + Railway + Postgres + migrations
- [x] Prisma schema: Company, User, Pool, Visit, VisitPhoto, MaintenanceRule
- [x] Auth + role-based areas
- [x] Super admin: δημιουργία εταιρείας/boss, technicians, credentials
- [x] Admin: πισίνες, ομάδα, λίστα επισκέψεων
- [x] **Πλήρης φόρμα τεχνικού** (`/app/technician/visits`): Ελεγχοι, Καθαρισμοι/Ελεγχοι, Ηλεκτρικές, Χημικά, παρατηρήσεις, `?` βοήθειες, ημερομηνία+ώρα, mobile-first
- [x] Φωτογραφίες: upload αρχείων (προαιρετικά) — προσωρινά αποθήκευση ως data URL στη βάση
- [x] Ελληνικό UI (κύριες οθόνες)
- [x] Admin: κλικ σε επίσκεψη → `/app/admin/visits/[visitId]` αναλυτικά
- [x] Αναλυτικό report: **μόνο συμπληρωμένα πεδία** (όχι κενά / όχι «Όχι»)
- [x] Καταχώρηση νέας επίσκεψης από boss → link στην πλήρη φόρμα τεχνικού
- [x] **Reports module** — overview, alerts, pools, technicians, trends, CSV, print/PDF
- [x] **Mobile responsive UI** — `PageShell` / `PageHeader` με «← Πίσω» ανά οθόνη (όχι global back), hamburger menu, touch-friendly πεδία (16px inputs), φόρμα τεχνικού optimized για κινητό

Τελευταίο γνωστό commit: (μετά mobile + reports)

## Reports module (ολοκληρωμένο)

Διαδρομή: `/app/admin/reports` (Super Admin: `?companyId=`)

- **Επισκοπηση:** σύνοψη, alerts, τεχνικοί, πρόσφατες επισκέψεις
- **Alerts:** pH, χλώριο, πίεση, διαύγεια, πισίνες χωρίς επίσκεψη
- **Ανα πισίνα:** πίνακας + `/app/admin/reports/pools/[poolId]` (trends pH/Cl/πίεση)
- **Ανα τεχνικό:** `/app/admin/reports/technicians/[id]`
- **Εξαγωγή CSV:** `/app/admin/reports/export`
- **Εκτύπωση/PDF:** `/app/admin/reports/print?poolId=...` (browser print)

## Επόμενο βήμα

### 1. Άλλα (μετά reports + mobile)

- **MaintenanceRule** — υπάρχει στο schema, **χωρίς UI** (ειδοποιήσεις «πρόσθεσε χλώριο σε X μέρες»)
- **Φωτογραφίες** — μετάβαση από base64 σε object storage (S3 / R2 / Backblaze)
- **PWA + offline** — αν χρειάζεται για τεχνικούς χωρίς σήμα
- **Live dashboard** για boss (polling / realtime)

## Σημαντικά αρχεία

| Αρχείο | Ρόλος |
|--------|--------|
| `prisma/schema.prisma` | Μοντέλο δεδομένων |
| `src/lib/auth.ts` | Session / ρόλοι |
| `src/app/app/technician/visits/page.tsx` | Φόρμα τεχνικού |
| `src/app/app/admin/visits/[visitId]/page.tsx` | Αναλυτική επίσκεψη |
| `src/app/app/admin/visits/page.tsx` | Λίστα + link στη φόρμα |
| `src/components/ui/page-header.tsx` | Τίτλος + back link ανά σελίδα |
| `src/components/app/app-header.tsx` | Sticky header + mobile menu |

## Local setup

```bash
cd C:\Projects\pisinapp\pisinapp
npm install
# .env με DATABASE_URL (Railway public URL για dev)
npx prisma migrate deploy
npm run dev
```

Μην κάνεις commit το `.env` (μόνο `.env.example`).

## Ροή deploy

1. Αλλαγές στο Cursor  
2. `npm run build` τοπικά (προαιρετικά)  
3. **Εσύ** κάνεις `git commit` + `git push`  
4. Railway auto-deploy  

## Για νέο chat στο Cursor

Γράψε:

```
Διάβασε docs/PROJECT.md και docs/CONVERSATION-HISTORY.md και συνέχισε από το επόμενο βήμα (Reports).
```

Άνοιξε πάντα φάκελο: `C:\Projects\pisinapp\pisinapp`

## Ιστορικό συζήτησης

Σύνοψη παλιού Agent chat: `docs/CONVERSATION-HISTORY.md`  
(πλήρες transcript μένει στο Cursor, project `1779877138520`, id `286cfb80-fff2-4cd9-a7f8-f9e191e65600`)
