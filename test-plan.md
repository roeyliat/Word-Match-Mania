# Test Plan — Word Match Mania (Firebase Hosting + Supabase)

**Target:** https://word-match-mania.web.app (live Firebase Hosting deploy, PR #1)
**Goal:** Prove the deployed app loads and the Supabase backend works end-to-end via realtime multiplayer. The app is RTL Hebrew.

Two browser windows: **Window A = Therapist (creator)**, **Window B = Student (joiner)**.

## Test 1: It should serve the app from Firebase Hosting
- Open https://word-match-mania.web.app in Window A.
- **PASS:** Home screen renders with title "מילים, צבעים וקטגוריות" and three buttons: "צור חדר", "הצטרף לחדר", "משחק מקומי (מכשיר אחד)".
- **FAIL:** Blank page, 404, or Firebase default placeholder page.

## Test 2: It should create a room and persist it to Supabase
- Window A: click "צור חדר" → type a name (e.g. "Therapist") in the name field → click "צור חדר".
- **PASS:** A waiting screen appears titled "ממתין לשחקן..." showing a **4-digit numeric PIN** and a spinner. (PIN proves the row was inserted into Supabase `game_rooms`.)
- **FAIL:** No PIN shown, error in console, button stuck on spinner.
- Record the displayed PIN for Test 3.

## Test 3: It should let a student join and realtime-advance BOTH players to the game board
- Window B: open the URL → click "הצטרף לחדר" → type a name (e.g. "Student") → type the 4-digit PIN from Test 2 → click "הצטרף".
- **PASS (student):** Window B navigates to the game board (score header with two names, a face-down category card, "הפוך קלף" button).
- **PASS (therapist realtime):** Window A **automatically** leaves the "ממתין לשחקן..." waiting screen and lands on the game board **without any manual action**. This is the key assertion — it only happens if Supabase realtime postgres_changes is delivering the student's UPDATE (CreateRoom.tsx:73-85).
- **FAIL:** Window A stays stuck on the waiting screen → realtime/DB broken. Or Window B shows "לא נמצא חדר עם הקוד הזה" (room not found) → read/DB broken.

## Test 4: It should sync a card flip and score in realtime across both tabs
- Window A (therapist): click "הפוך קלף" (flip card).
- **PASS:** The flipped card's letters grid appears in **both** Window A and Window B. (current_flipped_card synced via realtime, GameBoard.tsx:42-52.)
- Window A: click the award button "לי" (award to me/therapist).
- **PASS:** Therapist score increments from 0 → 1, and the same updated score is visible in **both** windows; "נותרו ... קלפים" (cards left) count decreases.
- **FAIL:** Flip/score appears only in Window A but not Window B → realtime sync broken.

## Out of scope
- Local single-device mode ("משחק מקומי") — does not exercise the deployed Supabase backend, so not the focus of this hosting+DB verification.
