# StickyVote 📝🗳️

A real-time, peer-to-peer collaborative sticky note voting game with a **Host Dashboard** and **Participant View**, built with React, Vite, and PeerJS (WebRTC) with STUN/TURN NAT traversal.

Designed to be hosted directly on **GitHub Pages** with **zero backend server maintenance**!

---

## 🌟 Game Flow & Rules

### 1. Create Room (Host) & Join (Participants)
- **Host**: Creates a room and opens the **Host Dashboard**. The host controls the round transitions and can monitor real-time submissions and running vote counts.
- **Participants**: Join by scanning the on-screen QR code or entering the 6-character room code, and enter their **name**.
- **1 Participant = Exactly 1 Sticky Note**.

### 2. Round 1 — Idea Creation
- Participants craft their single sticky note with a **Title** and **Points / Details**, choosing from 6 realistic pastel color themes.
- Participants can edit their note freely during Round 1.
- Participants cannot edit anyone else's note or create extra notes.
- The **Host Dashboard** shows all participant sticky notes and author names in real-time as they draft them.

### 3. End Round 1
- The Host ends Round 1 and advances to Round 2.
- Editing is locked.
- Sticky notes are **strictly anonymous** to all participants (author names and IDs are stripped from participant payloads).
- The Host retains full author visibility.

### 4. Round 2 — Anonymous Voting
- Participants vote on their peers' sticky notes:
  - **Upvote** (+1)
  - **Downvote** (-1)
  - Tap active vote again to remove it.
  - Can freely switch between upvote and downvote while Round 2 is active.
- **Participants cannot vote on their own note** (their note is marked "Your Note" with voting disabled).
- Participants see their own vote selections, but **cumulative vote counts and running scores are hidden** from participants.
- The **Host Dashboard** displays live Upvotes (+N), Downvotes (-N), and Cumulative Score (`Upvotes − Downvotes`).

### 5. Results & Winners Podium
- The Host ends Round 2.
- Cumulative scores (`Total Upvotes − Total Downvotes`) are finalized.
- Top notes are displayed on the podium with confetti celebration.
- The Host has an interactive toggle to **"Reveal Author Names"** or maintain anonymity.
- "Start New Game" button allows seamless replay.

---

## 🚀 Running Locally

1. Clone or navigate to the directory:
   ```bash
   cd "Sticky note play"
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the dev server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:5173/](http://localhost:5173/) in your browser.
   - Tip: You can test the entire flow in one tab by creating a room and clicking **"Add Demo Players"** on the Host Dashboard to instantly simulate 3 participants with notes and votes, or open an Incognito window to join as a participant!

---

## 🌐 Deploying to GitHub Pages

1. Push this repository to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of StickyVote game"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```

2. In your GitHub repository:
   - Go to **Settings** > **Pages**.
   - Under **Build and deployment**, set **Source** to **GitHub Actions**.
   - The included workflow `.github/workflows/deploy.yml` will automatically build and deploy the app!

Because `vite.config.js` is preconfigured with `base: './'`, asset paths work seamlessly across any repository name.
