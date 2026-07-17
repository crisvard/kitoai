# 🚀 Website Trial Feature - Deployment Instructions

## 📌 Overview

The 7-day free trial for Website Service is **code-complete** and ready for deployment. This guide walks you through the final steps.

---

## 🎯 Deployment Checklist

### Step 1: ✅ Code Review (COMPLETE)
- [x] TrialWebsitePage.tsx created and tested
- [x] App.tsx updated with routing
- [x] Dashboard.tsx already updated with trial UI
- [x] No TypeScript errors
- [x] No console warnings

**Status**: Ready to deploy

### Step 2: ⏳ SQL Migration (REQUIRED)

Before deploying the frontend code, execute the SQL migration:

#### In Supabase Dashboard:
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **SQL Editor**
4. Click **"New Query"**
5. Copy this SQL:

```sql
-- ============================================
-- ADD WEBSITE TRIAL FIELDS TO PROFILES
-- ============================================

-- Add website trial fields to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_website_active BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_website_end_date TIMESTAMP WITH TIME ZONE;

-- Create indexes for quick lookups
CREATE INDEX IF NOT EXISTS idx_profiles_trial_website_active ON profiles(trial_website_active);
CREATE INDEX IF NOT EXISTS idx_profiles_trial_website_end_date ON profiles(trial_website_end_date);
```

6. Click **"Run"** button
7. Wait for success message
8. ✅ Verify with:

```sql
-- Check if columns exist
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'profiles' 
AND (column_name = 'trial_website_active' OR column_name = 'trial_website_end_date')
ORDER BY column_name;

-- Should return 2 rows with the new columns
```

### Step 3: 🚀 Code Deployment

Once SQL is executed, deploy these files:

#### New Files to Deploy:
```
src/pages/TrialWebsitePage.tsx
```

#### Modified Files to Deploy:
```
src/App.tsx
```

**Note**: Dashboard.tsx was already updated in a previous session.

#### How to Deploy:
1. Push changes to your git repository
2. Trigger CI/CD pipeline (GitHub Actions, Vercel, etc.)
3. Wait for build to complete
4. Verify deployment in your environment

---

## ✨ Feature Overview

### What Users See

**On Dashboard Plan Card:**
```
┌─────────────────────────────────────┐
│ Desenvolvimento de Sites            │
│ (Website Development Service)       │
│                                     │
│ ✅ Feature 1                        │
│ ✅ Feature 2                        │
│                                     │
│ [Testar 7 dias Grátis]  ← Button   │
└─────────────────────────────────────┘
```

**Trial Flow:**
```
User clicks → Navigates to /trial-website
    ↓
Sees trial page with:
  • 7-day duration highlighted
  • Benefits list
  • Trial dates (Today → Today + 7 days)
    ↓
Clicks "Começar Teste de 7 Dias"
    ↓
Returns to Dashboard with:
  • Blue trial banner showing expiration
  • Website plan hidden (can't double-purchase)
  • Website service unlocked
```

---

## 🧪 Testing Instructions

### Pre-Deployment Testing (On Local)

1. **UI Tests**
   - Navigate to Dashboard
   - Verify "Testar 7 dias Grátis" button appears on Website plan
   - Click button - should navigate to `/trial-website`
   - Trial page should load without errors

2. **Logic Tests** (After SQL execution)
   - Click "Começar Teste de 7 Dias"
   - Should show loading spinner
   - Should redirect to dashboard
   - Should show success message

### Post-Deployment Testing (On Production)

1. **Smoke Test**
   ```
   1. Login to application
   2. Go to Dashboard
   3. Find Website plan
   4. Click "Testar 7 dias Grátis"
   5. Should redirect to /trial-website
   6. Verify page loads
   ```

2. **Trial Activation Test**
   ```
   1. On trial page, click "Começar Teste"
   2. Wait for redirect
   3. Verify blue banner appears
   4. Verify website plan is hidden
   5. Check database:
      SELECT trial_website_active, trial_website_end_date 
      FROM profiles WHERE id = '[your-user-id]'
   ```

3. **Date Calculation Test**
   ```
   - Trial start: Today
   - Trial end: Should be Today + 7 days
   - Time: Should be approximately same time as start
   - Timezone: Should match your Supabase timezone setting
   ```

---

## 📊 Database Verification

After SQL execution, verify the schema:

```sql
-- 1. Check columns exist
\d profiles
-- Look for: trial_website_active, trial_website_end_date

-- 2. Check default value
SELECT column_name, column_default
FROM information_schema.columns
WHERE table_name = 'profiles' 
AND column_name IN ('trial_website_active', 'trial_website_end_date');

-- 3. Check indexes
SELECT indexname FROM pg_indexes 
WHERE tablename = 'profiles' 
AND indexname LIKE '%trial_website%';

-- 4. Check RLS policies work
SELECT * FROM auth.users LIMIT 1; -- Should work if authenticated
```

---

## 🔒 Security Checklist

- [x] RLS policies automatically secure new fields (inherited from profiles table)
- [x] Only authenticated users can access trial page (PrivateRoute wrapper)
- [x] Trial dates stored in UTC (TIMESTAMP WITH TIME ZONE)
- [x] No sensitive data exposed in frontend
- [x] API calls use Supabase client (secure)
- [x] Error messages don't leak data

---

## 📈 Monitoring After Deploy

### Set Up Alerts For:
1. SQL execution errors
2. Trial page 404 errors
3. High error rate on `/trial-website`
4. Database query failures for profile updates
5. Unusual trial activation patterns

### Key Metrics to Track:
- Number of trial activations per day
- Trial-to-paid conversion rate
- Avg. time from trial start to purchase
- Trial abandonment rate
- Error rate on trial page

---

## 🔄 Rollback Procedure

If something goes wrong:

### Option 1: Revert Code
```bash
git revert <commit-hash>
git push
# Redeploy previous version
```

### Option 2: Disable Feature (Keep DB)
In Dashboard.tsx, comment out the trial button:
```tsx
// {/* <button onClick={() => handleTrialClick()}>... */}
```

### Option 3: Database Rollback
```sql
-- WARNING: Only if absolutely necessary
-- This removes the columns (data loss)
ALTER TABLE profiles 
DROP COLUMN IF EXISTS trial_website_active CASCADE;

ALTER TABLE profiles 
DROP COLUMN IF EXISTS trial_website_end_date CASCADE;
```

---

## 📝 Post-Deployment Checklist

After deploying to production:

- [ ] SQL migration executed successfully
- [ ] No database errors in logs
- [ ] Website plan shows "Testar 7 dias Grátis" button
- [ ] Clicking button navigates to `/trial-website`
- [ ] Trial page loads without errors
- [ ] Can activate trial successfully
- [ ] Dashboard shows blue trial banner
- [ ] Website plan hidden during trial
- [ ] Database updated correctly
- [ ] Dates calculated correctly (7 days)
- [ ] No console errors in browser
- [ ] No errors in server logs
- [ ] RLS policies working (only own data visible)
- [ ] Responsive design works on mobile

---

## 🆘 Troubleshooting

### Trial button not appearing?
- Check Dashboard.tsx has the updated code
- Verify plan.id === '4' is correct
- Clear browser cache

### Can't navigate to /trial-website?
- Verify TrialWebsitePage.tsx exists
- Check App.tsx has the route
- Clear browser history/cache
- Check console for 404 errors

### Trial not activating?
- Verify SQL was executed
- Check browser console for API errors
- Verify user is authenticated
- Check database for UPDATE errors

### Trial banner not showing?
- Verify `trial_website_active` is true in database
- Check Dashboard.tsx filtering logic
- Refresh page to fetch latest profile
- Clear cache with Ctrl+Shift+Del

### Dates wrong?
- Check Supabase timezone setting
- Verify client-side date calculation
- Check browser timezone
- Look for timezone conversion issues

---

## 📚 File Reference

### New Files
- `src/pages/TrialWebsitePage.tsx` - Trial landing page (284 lines)

### Modified Files
- `src/App.tsx` - Added import, route, wrapper

### Database Files
- `add_website_trial_fields.sql` - SQL migration

### Documentation
- `WEBSITE_SERVICE_TRIAL_IMPLEMENTATION.md` - Complete docs
- `WEBSITE_TRIAL_IMPLEMENTATION_SUMMARY.md` - Summary
- `WEBSITE_TRIAL_IMPLEMENTATION_CHECKLIST.md` - Checklist

---

## 📞 Support Contacts

For issues with:
- **Frontend code**: Check TrialWebsitePage.tsx
- **Routing**: Check App.tsx  
- **Dashboard UI**: Check Dashboard.tsx
- **Database**: Run SQL verification queries
- **RLS Policies**: Check profiles table in Supabase

---

## ✅ Final Checklist

Before marking as "Done":

- [ ] SQL migration executed
- [ ] Code deployed to production
- [ ] All tests passing
- [ ] No errors in logs
- [ ] Monitoring set up
- [ ] Team notified
- [ ] Documentation updated
- [ ] Ready for users

---

## 🎉 Success!

Once this checklist is complete, the **7-day Website Service trial** is live and users can start testing!

**Estimated time to complete all steps**: 30-45 minutes

---

**Last Updated**: 2024
**Status**: Ready for deployment
**Blocked By**: SQL execution (only remaining task)
