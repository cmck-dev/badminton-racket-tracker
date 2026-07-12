# ShuttleTrack — User Guide

🔗 **App URL: https://project-90dmh.vercel.app**

ShuttleTrack helps you manage your badminton rackets, track play sessions, monitor stringing history, track shuttlecocks, manage club and coaching costs, and analyse your equipment performance and spending — all per player if you track multiple people.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard](#dashboard)
3. [Rackets](#rackets)
4. [Sessions](#sessions)
5. [Stringing](#stringing)
6. [Shuttles](#shuttles)
7. [Recurring Costs](#recurring-costs)
8. [Analytics](#analytics)
9. [Players](#players)
10. [Profile](#profile)
11. [Currency](#currency)
12. [Tips & Best Practices](#tips--best-practices)

---

## Getting Started

### Signing In

1. Visit the app URL in your browser
2. Click **Continue with Google**
3. Sign in with your Google account
4. You will be taken to your personal Dashboard

> Each user has their own private data. Your rackets, sessions, and stringing records are never visible to other users.

### Signing Out

Click the **sign-out icon** (→) at the bottom of the left sidebar, next to your name.

---

## Dashboard

The Dashboard gives you a quick overview of your equipment and activity. Every card is clickable and takes you directly to the relevant page.

### Stats Cards

| Card | What it shows | Links to |
|------|--------------|----------|
| **Active Rackets** | Number of rackets in your active roster, and which one is your primary | Rackets page |
| **Total Sessions** | All play sessions logged, with total hours played | Sessions page |
| **Stringing Cost** | Cumulative money spent on stringing | Stringing page |
| **Shuttles** | Number of shuttle entries and total amount spent | Shuttles page |

### Total Investment

A summary card showing your **grand total spend** across all categories:
- Rackets (purchase prices)
- Stringing (service charges)
- Court (rent per session)
- Shuttles
- Subscriptions (club/coaching costs, amortized to today)

Click it to jump to the full Analytics breakdown.

### Restring Alerts

The app automatically flags rackets that may need restringing — triggered when 15 or more sessions have been played since the last stringing. Clicking an alert takes you directly to the Log Stringing form.

### Recent Sessions

Shows your 5 most recent play sessions at a glance, including session type, racket used, and duration.

### Quick Actions

Four shortcut buttons let you jump directly to common tasks:
- **Log Session** — record a new play session
- **Add Racket** — register a new racket
- **Log Stringing** — record a new stringing
- **Add Shuttle** — add a shuttlecock entry

---

## Rackets

Manage your full racket collection here.

### Adding a Racket

1. Click **Add Racket** (top right or from Dashboard)
2. Fill in the details:
   - **Brand & Model** — e.g. Yonex Astrox 99
   - **Weight Class** — e.g. 3U, 4U
   - **Balance Point** — Head Heavy, Even Balance, Head Light
   - **Stiffness** — Flexible, Medium, Stiff, Extra Stiff
   - **Grip Size** — G4, G5, etc.
   - **Purchase Date** — optional
   - **Purchase Price** — optional; used in the total investment calculation
   - **Notes** — any personal notes about the racket
   - **For which player?** — assign to a sub-profile or leave as Me (see [Players](#players))
3. Click **Save**

### Setting a Primary Racket

Your primary racket is your main/go-to racket. To set one:
- Open the racket → click the role picker → select **Primary**

Only one racket can hold each role at a time. The primary racket is highlighted on the Dashboard.

### Archiving a Racket

When a racket is retired or no longer in use:
- Open the racket → click **Archive**

Archived rackets are hidden from the main list but their history (sessions, stringings) is preserved. You can view them by enabling **Show Archived** in the Rackets list.

### Editing & Deleting

- **Edit** — update any racket details, including reassigning it to a different player
- **Delete** — permanently removes the racket (blocked if it has session or stringing history — archive instead)

---

## Sessions

Log every time you play to build an accurate picture of your racket usage.

### Logging a Session

1. Go to **Sessions** → click **Log Session**
2. Select the racket(s) you used
3. Fill in:
   - **Date & Time** — defaults to now
   - **Session Type** — Practice, Match, Training, or Coaching
   - **Duration** — in minutes
   - **Performance Ratings** (optional, 1–5 stars): Control, Power, Comfort
   - **Notes** — any observations about the session or racket feel
   - **Court Cost** — optional; the court rental fee for the session
   - **For which player?** — assign to a sub-profile or leave as Me
4. Click **Save**

### Recurring Sessions

To bulk-create sessions for a regular schedule:
1. Enable **Recurring** in the Log Session dialog
2. Select which days of the week and a time period (month, year, or custom range)
3. One session will be created per matching day (max 365)

### Court Cost

Recording court costs lets the app track your total court spend over time. Included in the **Total Investment** breakdown on Dashboard and Analytics.

### Editing & Deleting Sessions

- Click the **pencil icon** on any session to edit details or reassign to a different player
- Click the **trash icon** to remove a session permanently

---

## Stringing

Keep a complete history of every time your rackets are strung.

### Recording a Stringing

1. Go to **Stringing** → click **Log Stringing**
2. Fill in:
   - **Date** — when it was strung
   - **Racket** — which racket
   - **String Brand & Model** — e.g. Yonex BG80
   - **Tension (Mains / Cross)** — in lbs
   - **Stringer** — who strung it (optional)
   - **Cost** — service charge paid (optional)
   - **For which player?** — assign to a sub-profile or leave as Me
3. Click **Save**

### Active String

The most recent stringing for each racket is marked **Active** — determined by date, not entry order. If you retroactively log an older stringing, the badge correctly stays on the most recent one.

### Tracking String Breakage

When a string breaks, edit the stringing record and fill in **Broke After** — the number of sessions it lasted. This powers the String Performance chart in Analytics.

---

## Shuttles

Track your shuttlecock inventory and spending in one place.

### Adding a Shuttle Entry

1. Go to **Shuttles** → click **Add Shuttle**
2. Fill in brand, model, type (Feather/Nylon/Hybrid), speed, quantity, price, purchase date, notes
3. Optionally assign to a player
4. Click **Save**

### Cost Tracking

If you enter both **Quantity** and **Price**, the card shows the total for that purchase. Feeds into the **Total Investment** card on the Dashboard.

---

## Recurring Costs

Track club memberships and coaching subscriptions — anything you pay on a monthly or annual basis.

### Adding a Recurring Cost

1. Go to **Costs** → click **Add Cost**
2. Fill in:
   - **Type** — Club, Coaching, or Other
   - **Billing Cycle** — Monthly or Annual
   - **Name** — e.g. "Badminton Club ABC" or "Coaching with Ravi"
   - **Amount** — how much per cycle
   - **Start Date** — when you started paying
   - **End Date** — optional; leave blank if still active
   - **For which player?** — assign to a sub-profile or leave as Me
3. Click **Save**

### How Costs Appear in Analytics

The Analytics and Dashboard investment cards include a **Subscriptions** line showing the total actually paid to date (full periods elapsed × amount per period). An annual membership paid 3 months ago counts as one full year.

---

## Analytics

The Analytics page visualises your data to help you understand your playing patterns and equipment performance.

### Summary KPIs

Total sessions, total hours, total stringing cost, total stringings — scoped to the active player.

### Total Investment Breakdown

| Category | What's included |
|----------|----------------|
| **Rackets** | Sum of all racket purchase prices |
| **Stringing** | Sum of all stringing service charges |
| **Court** | Sum of all court rental costs from sessions |
| **Shuttles** | Sum of all shuttle purchases (qty × price) |
| **Subscriptions** | Amortized club/coaching costs to today |

### Charts Available

| Chart | What it shows |
|-------|--------------|
| **Weekly Activity** | Bar chart of sessions per week (last 12 weeks) |
| **Monthly Overview** | Sessions and hours per month |
| **Racket Usage** | Sessions per racket |
| **Session Types** | Pie chart — Practice / Match / Training / Coaching |
| **Monthly Stringing Cost** | Stringing spend per month |
| **String Performance** | Average lifespan per string type (sessions) |
| **Racket Summary** | Table of sessions and hours per racket |

---

## Players

Track equipment and sessions separately for multiple players (e.g. yourself and a child) — all under one Google account.

### Adding a Sub-Profile

1. Go to **Players** → click **Add Player**
2. Enter a name and pick an avatar colour
3. Click **Add Player**

### Switching Active Player

Use the **"Viewing as"** switcher at the top of the sidebar. Select any player (or **Me**) — all pages (rackets, sessions, stringing, shuttles, costs, analytics) will then show only that player's data.

The active player is remembered in your browser across page refreshes.

### Assigning Records to a Player

Every create and edit dialog includes a **"For which player?"** dropdown:
- Defaults to the currently active player when creating
- Shows the record's existing assignment when editing

### Batch Reassignment

To move many records at once:
1. Go to **Players** → click **Reassign Records**
2. Select **From** and **To** (either Me or a named player)
3. Check the record types to move (rackets, sessions, stringing, shuttles, recurring costs)
4. Optionally set a **date range** to filter sessions and stringing records
5. Click **Reassign Records** — a summary shows how many records were moved

This is the recommended way to migrate historical data when you first set up a sub-profile.

### Deleting a Player

A player can only be deleted when they have no records assigned. Use **Reassign Records** or edit individual records first.

---

## Profile

Set your player preferences so the app can give context to your data.

### Editable Fields

| Field | Description |
|-------|-------------|
| **Name** | Your display name |
| **Skill Level** | Beginner / Intermediate / Advanced / Competitive |
| **Play Style** | All-round / Attacking / Defensive |
| **Preferred Strings** | Your go-to string brands/models |
| **Tension Range** | Your preferred stringing tension (min–max lbs) |
| **Training Frequency** | How many sessions per week you typically play |
| **Injury Notes** | Any relevant physical notes |
| **Currency** | Your preferred display currency (USD / INR / EUR) |

---

## Currency

ShuttleTrack supports three currencies: **USD ($)**, **Indian Rupee (₹)**, and **Euro (€)**.

### Setting Your Default Currency

Go to **Profile** → select currency → click **Save Profile**.

### Runtime Currency Switching

Use the three buttons at the bottom of the **sidebar** (`$ USD`, `₹ INR`, `€ EUR`) to switch instantly across the whole app without changing your profile default.

### How Conversion Works

All amounts are **stored in USD**. When a non-USD currency is active, amounts are converted using fixed approximate rates:

| From | To | Rate |
|------|----|------|
| USD | INR | × 83.5 |
| USD | EUR | × 0.92 |

> These are fixed approximate rates, not live exchange rates.

---

## Tips & Best Practices

- **Log sessions right after playing** — it takes 30 seconds and keeps your data accurate
- **Set a primary racket** — makes the Dashboard more meaningful
- **Record court costs** — even a rough figure gives a more complete Total Investment picture
- **Record stringing costs** — the cumulative cost chart is surprisingly motivating
- **Add shuttle entries when you buy a new tube** — easy way to track shuttlecock spend
- **Add recurring costs for your club/coaching** — they appear in your total investment automatically
- **Use sub-profiles for family members** — each player gets their own separate data; use Batch Reassign to migrate historical records
- **Use the Notes field on sessions** — useful for tracking how a racket feels when it needs restringing
- **Archive, don't delete** — archiving retired rackets preserves all historical data for analytics
- **Log breakage** — filling in "Broke After" on stringings helps identify which strings last longest for your play style

---

*ShuttleTrack stores all your data privately. Each user's data is completely separate.*
