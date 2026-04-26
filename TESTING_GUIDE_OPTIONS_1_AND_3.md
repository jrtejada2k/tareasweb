# Quick Testing Guide - Option 1 & 3 Implementation

## 🚀 Start Testing in 3 Steps

### Step 1: Verify Services are Running
```powershell
# Check backend (should show "State: Established")
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object State

# Check frontend (should show "State: Listen")
Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | Select-Object State

# Check database (should show "Status: Up")
docker ps --filter "name=tareasweb-database" --format "table {{.Names}}\t{{.Status}}"
```

### Step 2: Login
1. Open browser: http://localhost:5173
2. Login with master account:
   - Email: `admin@tareasweb.local`
   - Password: `Admin123!`

### Step 3: Test New Features

---

## ✅ Test Checklist

### Test 1: Project Detail Page (2 minutes)
- [ ] Navigate to Projects page (http://localhost:5173/projects)
- [ ] Click any project row
- [ ] **Verify page shows:**
  - Project name in header
  - Status chip (Active/Archived/Completed)
  - Description and dates
  - Tasks table at bottom
  - Assigned Users panel on right
- [ ] Click "Edit" button → Modify name → Save
- [ ] Click user dropdown → Select user → Click "Assign"
- [ ] **Verify** user appears in assigned users list
- [ ] Click "Remove" on assigned user
- [ ] **Verify** user removed from list
- [ ] Click a task in the tasks table
- [ ] **Verify** navigates to task detail
- [ ] Click back arrow
- [ ] **Verify** returns to projects list

**Expected Result:** ✅ All navigation and assignment features work

---

### Test 2: Task Detail Page (3 minutes)
- [ ] Navigate to Tasks page (http://localhost:5173/tasks)
- [ ] Click any task row
- [ ] **Verify page shows:**
  - Task title in header
  - Status and priority chips
  - Description
  - Time tracking section (Estimated/Actual/Progress)
  - Assigned Users panel on right
- [ ] Click "Change Status" → Select "In Progress" → Update
- [ ] **Verify** status chip updates
- [ ] Click "Edit" button → Modify description → Save
- [ ] Click user dropdown → Select user → Click "Assign"
- [ ] **Verify** user appears in assigned users list
- [ ] Click project name link (if shown)
- [ ] **Verify** navigates to project detail
- [ ] Click back arrow
- [ ] **Verify** returns to tasks list

**Expected Result:** ✅ Task detail page fully functional with status changes and assignments

---

### Test 3: Calendar Dashboard (3 minutes)
- [ ] Navigate to Dashboard (http://localhost:5173/dashboard)
- [ ] **Verify left side shows:**
  - Calendar for current month
  - Summary chips (Total/Completed/Pending)
  - Some dates have colored dots (red=pending, green=completed)
- [ ] **Verify right side shows:**
  - "Upcoming Tasks" panel
  - List of tasks sorted by deadline
  - "Overdue" chip on past deadlines (if any)
  - "Due Soon" chip on tasks within 3 days (if any)
- [ ] Click a date on calendar with tasks
- [ ] **Verify** "Tasks for [date]" panel shows tasks
- [ ] Click a task in the calendar panel
- [ ] **Verify** navigates to task detail
- [ ] Click back, return to dashboard
- [ ] Click a task in "Upcoming Tasks" panel
- [ ] **Verify** navigates to task detail
- [ ] Use calendar arrows to change month
- [ ] **Verify** calendar data refreshes

**Expected Result:** ✅ Calendar shows tasks visually, upcoming panel works

---

### Test 4: Navigation Flow (2 minutes)
Test the complete navigation loop:

1. Dashboard → Click upcoming task → Task Detail
2. Task Detail → Click project link → Project Detail
3. Project Detail → Click task in table → Task Detail
4. Task Detail → Click back arrow → Tasks List
5. Tasks List → Click row → Task Detail
6. Task Detail → Click back arrow → Tasks List
7. Tasks List → Navigate to Projects
8. Projects List → Click row → Project Detail
9. Project Detail → Click back arrow → Projects List

**Expected Result:** ✅ No broken links, smooth navigation throughout

---

### Test 5: Responsive Design (1 minute)
- [ ] Resize browser window to mobile width (< 600px)
- [ ] **Verify dashboard:**
  - Calendar stacks on top
  - Upcoming panel stacks below
  - Everything readable
- [ ] Open project detail page
- [ ] **Verify:**
  - Assigned users panel moves below content
  - Tasks table scrolls horizontally if needed
- [ ] Open task detail page
- [ ] **Verify** similar responsive behavior

**Expected Result:** ✅ Mobile-friendly layout on all pages

---

## 🐛 Common Issues & Solutions

### Issue 1: "Failed to load projects"
**Cause:** Backend not running
**Solution:**
```powershell
cd D:\codigofuente\AppTareas\TareasWeb\backend
npm run dev
```

### Issue 2: "Failed to load users" in assignment dropdown
**Cause:** User routes not mounted or backend error
**Solution:**
1. Check backend console for errors
2. Verify: http://localhost:3000/api/v1/users returns data
3. Check you're logged in as master

### Issue 3: Calendar shows no tasks
**Cause:** No tasks exist or date mismatch
**Solution:**
1. Create tasks with deadlines in current month
2. Refresh dashboard page
3. Check backend API: GET /api/v1/dashboard/user?month=11&year=2025

### Issue 4: Can't assign users (dropdown disabled)
**Cause:** Not logged in as master
**Solution:**
- Logout and login with: admin@tareasweb.local / Admin123!
- Regular users can't assign

### Issue 5: "Cannot read property 'id' of undefined"
**Cause:** Navigated to detail page with invalid ID
**Solution:**
- Use navigation from list pages (clicking rows)
- Don't manually type URLs

---

## 🎯 Quick Success Indicators

After 10 minutes of testing, you should see:

✅ **Projects:**
- Can view project details
- Can edit project
- Can assign users to project
- Can navigate to project tasks

✅ **Tasks:**
- Can view task details
- Can change task status
- Can assign users to task
- Can see time tracking
- Can navigate to project

✅ **Dashboard:**
- Calendar shows current month
- Dots appear on dates with tasks
- Upcoming panel lists next 10 tasks
- Overdue/Due Soon chips appear
- Clicking tasks navigates correctly

✅ **Navigation:**
- All back buttons work
- All links work
- No 404 errors
- No console errors

---

## 📊 Test Results Template

Copy this and fill in your results:

```
# Test Results - [Your Name] - [Date]

## Environment
- Backend: [ ] Running on port 3000
- Frontend: [ ] Running on port 5173
- Database: [ ] Container healthy
- Browser: [ ] Chrome/Firefox/Safari

## Test Results
1. Project Detail Page: [ ] PASS / [ ] FAIL
   - Issues: _________________

2. Task Detail Page: [ ] PASS / [ ] FAIL
   - Issues: _________________

3. Calendar Dashboard: [ ] PASS / [ ] FAIL
   - Issues: _________________

4. Navigation Flow: [ ] PASS / [ ] FAIL
   - Issues: _________________

5. Responsive Design: [ ] PASS / [ ] FAIL
   - Issues: _________________

## Overall Status
- [ ] ✅ All tests passed - Ready for production
- [ ] ⚠️ Minor issues found - Fixes needed
- [ ] ❌ Major issues found - Review required

## Notes
_______________________________________
_______________________________________
```

---

## 🚀 Next Steps After Testing

If all tests pass:
1. ✅ Mark Option 1 and Option 3 as complete
2. ✅ Proceed to implement notification backend routes
3. ✅ Test user assignment workflow end-to-end
4. ✅ Consider deploying to staging environment

If issues found:
1. Document the issue with screenshots
2. Check browser console for errors
3. Check backend terminal for errors
4. Report to developer with reproduction steps

---

## 💡 Pro Tips

1. **Use browser DevTools:** Press F12 to see console errors
2. **Check Network tab:** See which API calls are failing
3. **Use React DevTools:** Inspect component state
4. **Test as different roles:** Master vs regular user
5. **Test edge cases:** Empty lists, long text, many users

---

**Happy Testing! 🎉**

If you encounter any issues, check the main implementation document:
`DETAIL_PAGES_AND_CALENDAR_IMPLEMENTATION.md`
