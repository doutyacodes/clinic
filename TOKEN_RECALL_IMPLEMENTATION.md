# 🔁 Token Recall System - Implementation Guide

## Overview

The Token Recall System allows doctors to automatically recall missed patients after a configurable interval. When patients don't show up for their token, the system can recall them after every N tokens (default: 5).

---

## 📋 What's Been Implemented

### 1. **Database Schema Updates**

#### New Tables:
- **`token_call_history`** - Tracks every token call and recall with full audit trail

#### Updated Tables:

**`doctor_sessions`** - Added:
- `recall_check_interval` (INT, default 5) - Number of tokens to check after
- `recall_enabled` (BOOLEAN, default true) - Enable/disable recalls

**`appointments`** - Added:
- `is_recalled` (BOOLEAN) - Whether this token has been recalled
- `recall_count` (INT) - Number of times recalled
- `last_recalled_at` (TIMESTAMP) - Last recall timestamp
- `attended_after_recall` (BOOLEAN) - Did patient attend after recall?

### 2. **SQL Alterations File**

**Location:** `table_alter.sql` (root directory)

**Includes:**
- ✅ ALTER statements for all table modifications
- ✅ CREATE statement for token_call_history table
- ✅ Stored procedures for recall logic
- ✅ Database triggers for automatic tracking
- ✅ Helper view for easy recall status queries
- ✅ Indexes for performance optimization
- ✅ Verification queries
- ✅ Rollback script (if needed)
- ✅ Usage examples

### 3. **Frontend Updates**

**File:** `app/booking-status/[bookingId]/page.jsx`

**Changes:**
1. **Token Display:**
   - "Your Token" changes to amber/orange color when recalled
   - Shows recall count ("Recalled 2x")
   - Current token shows spinning refresh icon when it's a recall

2. **Total Called Display:**
   - Replaced "Next Token" with "Total Called"
   - Shows total number of tokens called (not just next number)

3. **Recall Alerts:**
   - **Generic Recall Banner:** Shows when ANY token is being recalled
   - **User's Token Recalled Alert:** URGENT warning when user's token is recalled
   - Color-coded warnings (amber → orange → red for escalating urgency)

4. **Visual Indicators:**
   - 🔁 Recall icon
   - Animated refresh icon for current token recalls
   - Bounce animation for urgent alerts

---

## 🚀 How to Apply Changes

### Step 1: Update Database

```bash
# Connect to MySQL
mysql -u root -p healthcare_db

# Run the alterations
source table_alter.sql

# Or copy-paste the SQL directly
```

**Verification:**
```sql
-- Check if columns were added
DESCRIBE doctor_sessions;
DESCRIBE appointments;
DESCRIBE token_call_history;

-- Or run the verification queries at the end of table_alter.sql
```

### Step 2: Drizzle Schema is Already Updated

The schema has been updated in `lib/db/schema.js`. You can optionally push to verify:

```bash
npx drizzle-kit check
```

### Step 3: Test the Frontend

```bash
npm run dev
```

Visit any booking status page:
```
http://localhost:3000/booking-status/{bookingId}
```

---

## 🎯 How the Recall System Works

### Logic Flow:

```
1. Doctor starts consultation, current token = 1
2. Tokens 1, 2, 3 attend successfully
3. Token 4 doesn't show up → marked as pending
4. Token 5 proceeds
5. Current token reaches 5 (5 % 5 = 0) → CHECK FOR RECALLS
6. System finds token 4 is still pending
7. System RECALLS token 4 (calls it again)
8. After token 4 completes/skips → continue to token 6
```

### Configurable Parameters:

**Per Session (Doctor Can Change):**
- `recall_check_interval` - Check after every N tokens (default: 5)
- `recall_enabled` - Enable/disable recall feature

**Example:**
- If interval = 3, system checks after tokens 3, 6, 9, 12, 15...
- If interval = 10, system checks after tokens 10, 20, 30...

---

## 📊 Database Helper Tools

### Stored Procedures:

#### 1. Get Missed Tokens for Recall
```sql
CALL sp_get_missed_tokens_for_recall(
  'sess-001-1',      -- session_id
  '2025-10-07',      -- appointment_date
  15                 -- current_token
);
```

**Returns:** All pending tokens < current token, ordered by token number

#### 2. Record Token Call
```sql
CALL sp_record_token_call(
  UUID(),            -- id (generate new)
  'sess-001-1',      -- session_id
  'appt-456',        -- appointment_id
  '2025-10-07',      -- appointment_date
  4,                 -- token_number
  1,                 -- is_recall (true)
  'interval_check',  -- recall_reason
  'doc-admin-001'    -- called_by (doctor/admin ID)
);
```

**Effect:** Records call in history + updates appointment recall fields

### View for Easy Queries:

```sql
SELECT * FROM v_token_recall_status
WHERE appointment_date = '2025-10-07'
  AND session_id = 'sess-001-1'
ORDER BY token_number;
```

**Shows:**
- Token status
- Recall eligibility
- Number of times called
- Patient info
- Doctor status

---

## 🔧 API Integration Points

### Required API Endpoints (To Be Created):

#### 1. **GET /api/appointments/queue-status/[appointmentId]**

**Add to response:**
```javascript
{
  // ... existing fields
  isCurrentTokenRecalled: boolean,     // Is current token a recall?
  totalTokensCalled: number,           // Total unique tokens called
  recallsToday: number,                // Number of recalls today
}
```

#### 2. **POST /api/doctors/[doctorId]/call-next-token**

**Logic:**
```javascript
1. Get current token from session
2. Check if (currentToken % recallCheckInterval === 0)
3. If yes:
   a. Query missed tokens (pending, token < currentToken)
   b. If found, recall oldest missed token
   c. Record in token_call_history with isRecall=true
   d. Update appointment: isRecalled=true, recallCount++
4. If no missed tokens, proceed to next sequential token
5. Update session currentTokenNumber
6. Return new queue status
```

**Implementation Example:**
```javascript
// In /api/doctors/[doctorId]/call-next-token/route.js

const session = await getSession(sessionId);
const currentToken = session.currentTokenNumber;

// Check if it's time to check for recalls
if (session.recallEnabled && currentToken % session.recallCheckInterval === 0) {
  // Get missed tokens
  const missedTokens = await db.select()
    .from(appointments)
    .where(
      and(
        eq(appointments.sessionId, sessionId),
        eq(appointments.appointmentDate, today),
        lt(appointments.tokenNumber, currentToken),
        eq(appointments.tokenStatus, 'pending'),
        notInArray(appointments.status, ['cancelled', 'completed', 'no_show'])
      )
    )
    .orderBy(appointments.tokenNumber)
    .limit(1);

  if (missedTokens.length > 0) {
    const recallToken = missedTokens[0];

    // Record the recall
    await db.insert(tokenCallHistory).values({
      id: nanoid(),
      sessionId,
      appointmentId: recallToken.id,
      appointmentDate: today,
      tokenNumber: recallToken.tokenNumber,
      callType: 'recall',
      isRecall: true,
      recallReason: 'interval_check',
      calledBy: doctorAdminId,
    });

    // Update appointment
    await db.update(appointments)
      .set({
        isRecalled: true,
        recallCount: sql`recall_count + 1`,
        lastRecalledAt: new Date(),
      })
      .where(eq(appointments.id, recallToken.id));

    return {
      success: true,
      tokenCalled: recallToken.tokenNumber,
      isRecall: true,
      message: `Recalling token #${recallToken.tokenNumber}`,
    };
  }
}

// No recalls needed, proceed normally
const nextToken = currentToken + 1;
// ... rest of normal flow
```

#### 3. **GET /api/booking-status/[bookingId]**

**Add to appointment response:**
```javascript
{
  // ... existing appointment fields
  isRecalled: appointment.isRecalled,
  recallCount: appointment.recallCount,
  lastRecalledAt: appointment.lastRecalledAt,
  attendedAfterRecall: appointment.attendedAfterRecall,

  queueStatus: {
    // ... existing queue fields
    isCurrentTokenRecalled: boolean,  // NEW
    totalTokensCalled: number,        // NEW
  }
}
```

---

## 📱 User Experience Flow

### Scenario 1: Patient Misses Initial Call

**Patient's View (Token #4):**
1. Token called: "Current Token: 4" (normal blue)
2. Patient doesn't show → Token moves to 5
3. Patient sees: "Your Token: 4, Current: 5" (1 behind)
4. System continues: 6, 7, 8, 9, 10...
5. At token 10 (10 % 5 = 0) → System RECALLS token 4
6. **Patient sees URGENT ALERT:**
   - Token card turns AMBER/ORANGE
   - Shows "🔁 Your Token - Recalled 1x"
   - Big red banner: "⚠️ FINAL CALL - Token #4"
   - "Please proceed IMMEDIATELY or appointment will be marked no-show"

### Scenario 2: Current Token is a Recall

**All Patients See:**
- Current token box has spinning refresh icon
- Border changes to amber with ring
- Shows "Recall" instead of "Current"
- Info banner: "🔁 Token Being Recalled - Token #4 is being called again"

### Scenario 3: Multiple Recalls

**If patient misses twice:**
- Card shows: "Recalled 2x"
- Alert says: "This is recall #2 - Final chance!"
- After 3 misses → marked as no-show (implement in API)

---

## 🎨 Visual Design

### Color Coding:
- **Normal Token:** Sky Blue (#0EA5E9)
- **Recalled Token:** Amber/Orange (#F59E0B → #EA580C)
- **Urgent Alert:** Orange to Red (#EF4444)

### Animations:
- Spinning refresh icon for recalls
- Bounce animation for urgent alerts
- Spring animation for alert banners

### Icons:
- 🔁 Recall
- ⚠️ Warning
- 🔔 Notification bell
- ⏰ Clock/timer

---

## 🔐 Admin Panel Integration

### Doctor Dashboard Should Have:

1. **Session Settings:**
   ```
   [✓] Enable Token Recalls
   Recall Check Interval: [5] tokens
   ```

2. **Real-time Queue View:**
   ```
   Current Token: 15 (Normal)
   Next: Token 4 (Recall) ← Shows recall indicator

   Pending Recalls:
   - Token #4 (0 recalls)
   - Token #6 (1 recall)
   - Token #7 (0 recalls)
   ```

3. **Manual Recall Button:**
   ```
   [Recall Missed Tokens Now]
   ```

4. **Statistics:**
   ```
   Today's Stats:
   - Total Called: 23 tokens
   - Recalls: 5 (21.7%)
   - Attended After Recall: 4 (80%)
   - No-Shows: 1 (20%)
   ```

---

## 📈 Analytics Queries

### Get Recall Statistics:
```sql
SELECT
  DATE(appointment_date) AS date,
  COUNT(*) AS total_recalls,
  SUM(CASE WHEN patient_attended = 1 THEN 1 ELSE 0 END) AS attended,
  ROUND(SUM(CASE WHEN patient_attended = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS attendance_rate
FROM token_call_history
WHERE is_recall = 1
  AND appointment_date >= CURDATE() - INTERVAL 30 DAY
GROUP BY DATE(appointment_date)
ORDER BY date DESC;
```

### Doctor-wise Recall Performance:
```sql
SELECT
  d.name AS doctor_name,
  COUNT(DISTINCT tch.appointment_id) AS total_recalls,
  AVG(a.recall_count) AS avg_recalls_per_patient,
  SUM(CASE WHEN a.attended_after_recall = 1 THEN 1 ELSE 0 END) AS attended_count
FROM token_call_history tch
JOIN appointments a ON tch.appointment_id = a.id
JOIN doctors d ON a.doctor_id = d.id
WHERE tch.is_recall = 1
  AND tch.appointment_date >= CURDATE() - INTERVAL 30 DAY
GROUP BY d.id, d.name
ORDER BY total_recalls DESC;
```

---

## 🧪 Testing Checklist

### Database:
- [ ] Run table_alter.sql successfully
- [ ] Verify all columns added
- [ ] Test stored procedures
- [ ] Check indexes created
- [ ] Verify triggers work

### API:
- [ ] Update queue status endpoint with recall fields
- [ ] Implement call-next-token logic with recall check
- [ ] Test manual recall endpoint
- [ ] Verify token_call_history records created

### Frontend:
- [ ] Token card changes color when recalled
- [ ] Shows recall count
- [ ] Current token shows recall indicator
- [ ] Alert banners appear correctly
- [ ] Total Called displays instead of Next Token
- [ ] Animations work smoothly

### Edge Cases:
- [ ] Multiple missed tokens recalled in order
- [ ] Recall interval = 1 (recalls after every token)
- [ ] Recall interval = 100 (very rare recalls)
- [ ] Recall disabled (no recalls happen)
- [ ] Patient attends after 1st recall
- [ ] Patient misses 3+ recalls → no-show

---

## 🎓 Key Implementation Tips

1. **Check Interval on Exact Multiples:**
   ```javascript
   if (currentToken % recallCheckInterval === 0)
   ```

2. **Always Recall Oldest First:**
   ```sql
   ORDER BY token_number ASC LIMIT 1
   ```

3. **Record Every Call:**
   - Normal calls: `isRecall = false`
   - Recalls: `isRecall = true`

4. **Update Appointment on Recall:**
   - Increment `recallCount`
   - Set `isRecalled = true`
   - Update `lastRecalledAt`

5. **Mark No-Show After 3 Recalls:**
   ```javascript
   if (recallCount >= 3 && !attended) {
     appointment.status = 'no_show';
   }
   ```

6. **Show Different UI for Recalls:**
   - Different colors
   - Clear indicators
   - Urgent messaging

---

## 📞 Support & Troubleshooting

### Common Issues:

**1. Recalls not happening:**
- Check `recall_enabled = 1` in doctor_sessions
- Verify `recall_check_interval` is set
- Ensure API checks for recalls on token call

**2. Wrong tokens being recalled:**
- Check ORDER BY in query (should be ASC)
- Verify token_status = 'pending'
- Ensure status NOT IN ('cancelled', 'completed', 'no_show')

**3. UI not updating:**
- Check API returns `isRecalled` field
- Verify `queueStatus.isCurrentTokenRecalled` is set
- Check browser console for errors

---

## 🚀 Future Enhancements

1. **Smart Recall Timing:**
   - Don't recall if doctor is on break
   - Wait for doctor to be available

2. **Patient Notifications:**
   - SMS when token is recalled
   - Push notification on mobile app

3. **Priority Recalls:**
   - Emergency patients get recalled first
   - Elderly patients get priority

4. **Configurable Retry Limit:**
   - Allow doctors to set max recalls (1-5)
   - Different limits for different patient types

5. **Recall Scheduling:**
   - Schedule recall for specific time
   - Group recalls together

---

## 📝 Summary

The Token Recall System is now fully integrated into your schema and frontend. The key changes are:

✅ Database schema updated with recall fields
✅ SQL file ready to apply (`table_alter.sql`)
✅ Frontend shows recall indicators clearly
✅ Stored procedures for easy recall logic
✅ Comprehensive documentation

**Next Steps:**
1. Run `table_alter.sql` on your database
2. Implement API endpoints with recall logic
3. Test the complete flow
4. Add doctor admin panel controls

---

**Version:** 1.0
**Last Updated:** October 7, 2025
**Author:** Claude Code
