# Workflow Feature - Quick Testing Reference

## 🚀 Quick Start Testing

### 1. Setup (One-time)
```
1. Login as Firm Admin → Start workflow for a client
2. Login as Tax Preparer → Create document request
3. Login as Taxpayer → Upload documents
4. Login as Tax Preparer → Verify documents
```

### 2. Test URLs

**Taxpayer:**
- Workflow Dashboard: `/dashboard/workflow`

**Tax Preparer:**
- Workflows List: `/taxdashboard/workflows`

**Firm Admin:**
- Workflow Management: `/firmadmin/workflow`

---

## ✅ Quick Test Checklist

### Tax Preparer Flow
- [ ] Login → `/taxdashboard/workflows`
- [ ] See workflow list
- [ ] Click "Create Request"
- [ ] Fill form (title, categories, date)
- [ ] Date auto-formats: `12312024` → `12/31/2024`
- [ ] Submit → Success toast

### Taxpayer Flow
- [ ] Login → `/dashboard/workflow`
- [ ] See workflow dashboard
- [ ] See document request card
- [ ] Click "Upload Documents"
- [ ] Drag/drop or select PDF file
- [ ] See upload progress
- [ ] Success → Status changes to "Submitted"

### Verification Flow
- [ ] Tax Preparer → See "Submitted" request
- [ ] Click "Verify Documents"
- [ ] View/download documents
- [ ] Check documents
- [ ] Add notes (optional)
- [ ] Click "Verify & Continue"
- [ ] Status changes to "Verified"

---

## 🐛 Quick Debug

### Check Console (F12)
```javascript
// Look for:
- API errors
- Network failures
- Validation errors
```

### Check Network Tab
```
- API calls have Authorization header
- Responses are 200/201
- Error responses show user-friendly messages
```

### Common Issues
| Issue | Solution |
|-------|----------|
| No workflows | Start workflow as firm admin |
| Upload fails | Check file is PDF & < 10MB |
| Date not formatting | Use DateInput component |
| Permission denied | Check user role/permissions |

---

## 📋 Test Data

**Sample Request:**
- Title: "2024 Tax Documents"
- Categories: W-2 Forms, 1099 Forms
- Due Date: `12/31/2024`

**Test Files:**
- Valid: Small PDF (< 1MB)
- Invalid: .txt or .jpg file
- Too Large: PDF > 10MB

---

## 🎯 Key Features to Test

1. **Date Formatting** - Auto-slash insertion
2. **File Upload** - Progress tracking
3. **Storage Warnings** - At 80% and 100%
4. **Status Updates** - Real-time (30s polling)
5. **Responsive Design** - Mobile/Tablet/Desktop

---

**Full Guide:** See `WORKFLOW_TESTING_GUIDE.md` for detailed steps

