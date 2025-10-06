# Dynamic Real-Time Notification System

## Overview
The notification system adapts in real-time based on doctor status (break, emergency, offline, available) with color-coded alerts and live countdown timers.

---

## Notification States & Colors

### 1. **When It's Your Turn (Position = Current)**

#### ✅ Doctor Available
```
🎉 It's Your Turn!
Please proceed to the consultation room
```
- **Color**: Green (from-green-500 to-emerald-600)
- **Icon**: CheckCircle
- **Action**: Patient should go to consultation room

#### 🟠 Doctor on Timed Break
```
☕ On Break - Resuming in
   [14:35] min
```
- **Color**: Orange/Amber (from-amber-500 to-orange-600)
- **Icon**: Coffee
- **Feature**: Live countdown timer (MM:SS format)
- **Updates**: Every second

#### 🟠 Doctor on Indefinite Break
```
⏸️ Doctor on Break
It's your turn, but please wait. You'll be called shortly.
```
- **Color**: Orange/Amber (from-amber-500 to-orange-600)
- **Icon**: Coffee
- **Message**: Reassuring wait message

#### 🔴 Medical Emergency
```
🚨 Medical Emergency
It's your turn, but doctor is handling emergency. Please wait.
```
- **Color**: Red (from-red-500 to-rose-600)
- **Icon**: Siren (animated pulse)
- **Message**: Emergency notification

#### ⚫ Doctor Offline
```
⏸️ Doctor Unavailable
It's your turn. Please wait for updates.
```
- **Color**: Slate Gray (from-slate-500 to-slate-600)
- **Icon**: WifiOff
- **Message**: Unavailable notification

---

### 2. **When You're Close (1-3 Tokens Ahead)**

#### 🟡 Doctor on Timed Break
```
☕ On Break - Resuming in
   [08:15] min
```
- **Color**: Orange/Amber (from-amber-500 to-orange-600)
- **Shows**: Countdown timer
- **Context**: Shows tokens ahead

#### 🟡 Doctor on Indefinite Break
```
⚠️ Possible Delay
Doctor is on break. 2 ahead of you.
```
- **Color**: Yellow (from-yellow-500 to-amber-500)
- **Icon**: Coffee
- **Shows**: Queue position

#### 🟠 Medical Emergency
```
⚠️ Medical Emergency
Expect delays. 1 ahead of you.
```
- **Color**: Orange-Red (from-orange-500 to-red-500)
- **Icon**: Siren (animated pulse)
- **Shows**: Queue position + delay warning

#### ⚫ Doctor Offline
```
⚠️ Doctor Unavailable
Possible delays. 3 ahead of you.
```
- **Color**: Light Slate (from-slate-400 to-slate-500)
- **Icon**: WifiOff
- **Shows**: Queue position + delay warning

---

### 3. **When You're Far (More than 3 tokens ahead)**

**No notification shown** - Clean UI, only token grid visible

---

## Real-Time Updates

### Auto-Refresh (Every 30 seconds)
1. Fetches latest doctor status
2. Updates notification dynamically
3. Countdown timer updates every second (for timed breaks)
4. No page reload needed

### Countdown Timer Logic
```javascript
// Updates every second
const mins = Math.floor(seconds / 60);
const secs = seconds % 60;
Display: "14:35" (14 min 35 sec)
```

### Status Changes
| From Status | To Status | Notification Change |
|------------|-----------|-------------------|
| Available | Break (timed) | Shows countdown timer |
| Available | Break (indefinite) | Shows "on break" message |
| Available | Emergency | Shows red emergency alert |
| Available | Offline | Shows gray unavailable |
| Break | Available | Shows green "your turn" |
| Emergency | Available | Shows green "your turn" |

---

## Color System

| Status | Background Gradient | Purpose |
|--------|-------------------|---------|
| **Available** | Green (500→600) | Ready to see patient |
| **Break (Your Turn)** | Orange (500→600) | Wait, timed/indefinite |
| **Break (Close)** | Yellow (500→500) | Warning about delay |
| **Emergency (Your Turn)** | Red (500→600) | Critical situation |
| **Emergency (Close)** | Orange-Red (500→500) | Delay warning |
| **Offline** | Slate Gray (500→600) | Not available |

---

## Mobile Optimization

### Compact Design
- **Notification**: p-3 padding (instead of p-4)
- **Text Size**: text-sm for title, text-xs for details
- **Icons**: 18-20px size
- **Layout**: Horizontal flex with icon + text

### Single Notification Box
- Only ONE notification shows at a time
- Replaces based on:
  1. Queue position (current vs close)
  2. Doctor status (available, break, emergency, offline)

### No Scroll Needed
All information visible at first glance:
- Doctor name (large)
- Hospital name
- Patient name (small)
- Token grid (4 columns)
- Single status notification

---

## API Response Format

```json
{
  "doctor": {
    "status": "on_break",
    "breakType": "timed",
    "breakEndTime": "2025-10-06T10:45:00Z",
    "breakStartTime": "2025-10-06T10:30:00Z",
    "breakReason": "Lunch break"
  },
  "queueStatus": {
    "queuePosition": "current",
    "tokensAhead": 0,
    "currentToken": 5
  }
}
```

---

## Implementation Example

### Doctor starts 15-min break
```bash
POST /api/doctors/abc123/break
{
  "breakType": "timed",
  "durationMinutes": 15
}
```

**Patient sees (if it's their turn):**
```
☕ On Break - Resuming in
   [14:58] min
```

**After 10 minutes:**
```
☕ On Break - Resuming in
   [04:58] min
```

**After 15 minutes:**
- Break auto-ends
- Notification changes to:
```
🎉 It's Your Turn!
Please proceed to the consultation room
```

### Doctor handles emergency
```bash
POST /api/doctors/abc123/break
{
  "breakType": "indefinite",
  "reason": "Medical emergency"
}

# Then manually update status
UPDATE doctors SET status = 'emergency' WHERE id = 'abc123'
```

**Patient sees (if close):**
```
⚠️ Medical Emergency
Expect delays. 2 ahead of you.
```

---

## Browser Notifications

When queue position improves, browser notifications adapt:

**Doctor Available:**
```
🎉 Patient Name - Your Turn!
Dr. Smith is Available. Please proceed to consultation room.
```

**Doctor on Break:**
```
⏸️ Patient Name - Please Wait
Dr. Smith is On Break. Please wait, you'll be called when available.
```

**Doctor Emergency:**
```
🚨 Patient Name - Medical Emergency
Dr. Smith is handling Emergency. Please wait.
```

---

## Testing Scenarios

### Scenario 1: Timed Break During Your Turn
1. Patient at position 0 (their turn)
2. Doctor starts 5-min break
3. **Shows**: Orange box with countdown "4:58"
4. Timer decrements every second
5. At 0:00, break ends automatically
6. **Shows**: Green "Your Turn!" box

### Scenario 2: Emergency While Waiting
1. Patient at position 2 (2 ahead)
2. Doctor handles emergency
3. **Shows**: Orange-red box "⚠️ Medical Emergency - Expect delays. 2 ahead of you"
4. Doctor ends emergency
5. **Shows**: Notification disappears (patient still waiting)

### Scenario 3: Indefinite Break
1. Patient at position 0 (their turn)
2. Doctor takes indefinite break
3. **Shows**: Orange box "⏸️ Doctor on Break - It's your turn, but please wait"
4. Doctor manually ends break
5. **Shows**: Green "Your Turn!" box

---

## Summary

✅ **Single notification box** - No clutter
✅ **Real-time updates** - Every 30 seconds
✅ **Live countdown** - For timed breaks
✅ **Color-coded** - Easy to understand
✅ **Context-aware** - Different messages for position
✅ **Mobile-first** - Compact design
✅ **No scrolling** - All info visible
