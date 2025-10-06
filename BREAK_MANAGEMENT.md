# Doctor Break Management System

## Overview
The break management system allows doctors to take **timed** or **indefinite** breaks. Patients see real-time countdown timers and status updates.

---

## Database Migration

Run this SQL to add break fields to your database:

```sql
ALTER TABLE doctors
ADD COLUMN break_type VARCHAR(20),
ADD COLUMN break_start_time TIMESTAMP,
ADD COLUMN break_end_time TIMESTAMP,
ADD COLUMN break_reason TEXT;
```

Or use Drizzle Kit:
```bash
npx drizzle-kit push:mysql
```

---

## API Endpoints

### 1. Start a Break

**POST** `/api/doctors/[doctorId]/break`

**Timed Break (15 minutes):**
```json
{
  "breakType": "timed",
  "durationMinutes": 15,
  "reason": "Lunch break"
}
```

**Indefinite Break:**
```json
{
  "breakType": "indefinite",
  "reason": "Emergency call"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Timed break started successfully",
  "breakDetails": {
    "breakType": "timed",
    "breakStartTime": "2025-10-06T10:30:00Z",
    "breakEndTime": "2025-10-06T10:45:00Z",
    "breakReason": "Lunch break",
    "durationMinutes": 15
  }
}
```

---

### 2. End a Break

**DELETE** `/api/doctors/[doctorId]/break`

**Response:**
```json
{
  "success": true,
  "message": "Break ended successfully"
}
```

---

### 3. Get Break Status

**GET** `/api/doctors/[doctorId]/break`

**Response:**
```json
{
  "success": true,
  "doctor": {
    "id": "abc123",
    "name": "Dr. John Doe",
    "status": "on_break",
    "isOnBreak": true,
    "breakDetails": {
      "breakType": "timed",
      "breakStartTime": "2025-10-06T10:30:00Z",
      "breakEndTime": "2025-10-06T10:45:00Z",
      "breakReason": "Lunch break",
      "timeRemainingSeconds": 450,
      "breakExpired": false
    }
  }
}
```

---

## Auto-End Timed Breaks (Optional Cron Job)

**GET** `/api/cron/auto-end-breaks`

Set up a cron job to call this every minute to automatically end expired timed breaks.

**Vercel Cron (vercel.json):**
```json
{
  "crons": [{
    "path": "/api/cron/auto-end-breaks",
    "schedule": "* * * * *"
  }]
}
```

**External Cron:**
Use cron-job.org or similar service to ping the endpoint every minute.

---

## Patient UI Features

### Mobile-First Design
- **Doctor name** is prominent (3xl font)
- **Patient name** is small (text-sm)
- **Hospital name** shown inline with specialty
- **No booking ID** displayed (removed clutter)

### Token Display (4-column grid)
1. **Your Token** - Blue gradient, highlighted
2. **Current Token** - White with blue border
3. **Next Token** - White with green border
4. **Wait Time** - White with purple border

### Break Status Boxes

**Timed Break (Orange):**
```
☕ On Break - Resuming in
   [15:00] min
```
- Live countdown timer updates every second
- Shows MM:SS format

**Indefinite Break (Orange):**
```
☕ On Break - Indefinite
   Will resume shortly
```

**Emergency (Red):**
```
🚨 Emergency - Please Wait
   Doctor will resume consultations soon
```

**Offline (Gray):**
```
🕐 Doctor Currently Unavailable
   Please wait for updates
```

---

## Example Usage

### 1. Doctor takes 15-minute lunch break
```bash
curl -X POST http://localhost:3000/api/doctors/abc123/break \
  -H "Content-Type: application/json" \
  -d '{
    "breakType": "timed",
    "durationMinutes": 15,
    "reason": "Lunch break"
  }'
```

**Patient sees:**
- Orange box: "On Break - Resuming in [14:59] min"
- Countdown updates every second
- After 15 minutes, doctor status auto-changes to "available"

### 2. Doctor handles emergency (indefinite)
```bash
curl -X POST http://localhost:3000/api/doctors/abc123/break \
  -H "Content-Type: application/json" \
  -d '{
    "breakType": "indefinite",
    "reason": "Medical emergency"
  }'
```

**Patient sees:**
- Orange box: "On Break - Indefinite - Will resume shortly"
- No countdown timer

### 3. Doctor ends break manually
```bash
curl -X DELETE http://localhost:3000/api/doctors/abc123/break
```

**Patient sees:**
- Break box disappears
- Doctor status returns to "available" or "consulting"

---

## Notifications

### When doctor is on break:
- **Your turn (0 ahead):** "⏸️ Please Wait - Doctor is on break. You'll be called when available."
- **Next in line (1 ahead):** "⚠️ Possible Delay - Doctor is on break. There may be a delay."
- **Close to turn (2-3 ahead):** "📋 Queue Update - Note: Doctor is on break, there may be delays."

### When doctor is available:
- Normal notifications: "Your Turn!", "You're Next!", etc.

---

## Testing

1. **Start timed break:**
   ```bash
   POST /api/doctors/[id]/break
   { "breakType": "timed", "durationMinutes": 2 }
   ```

2. **Open booking status page:**
   - See countdown: "Resuming in [1:59] min"
   - Timer decrements every second

3. **Wait 2 minutes:**
   - Doctor status auto-changes to "available"
   - Break box disappears

4. **Start indefinite break:**
   ```bash
   POST /api/doctors/[id]/break
   { "breakType": "indefinite" }
   ```
   - See: "On Break - Indefinite"

5. **End manually:**
   ```bash
   DELETE /api/doctors/[id]/break
   ```
   - Break ends immediately

---

## Mobile Optimization

✅ All key info visible without scrolling:
- Doctor name (large)
- Hospital name
- Patient name (small)
- Token grid (4 columns)
- Break/emergency status (if applicable)
- Queue position alert

✅ Compact design:
- Reduced padding (p-4 instead of p-8)
- Smaller text (text-xs, text-sm)
- 4-column token grid
- Integrated status boxes

✅ No unnecessary info:
- ❌ Booking ID removed
- ❌ Verbose labels shortened
- ✅ Essential data only
