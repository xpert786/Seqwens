# AOS Troubleshooting Guide

## 🔍 Common Issues & Solutions

### Issue 1: AOS Not Initializing
**Symptoms**: No animations appear, console shows no AOS messages

**Solutions**:
1. Check browser console for errors
2. Verify AOS is imported in App.jsx: `import AOS from 'aos';`
3. Ensure AOS CSS is imported: `import 'aos/dist/aos.css';`
4. Confirm useEffect runs by checking console logs

### Issue 2: Animations Not Triggering
**Symptoms**: Elements appear but don't animate when scrolling

**Solutions**:
1. Check that elements have correct `data-aos` attributes
2. Verify sufficient content exists to enable scrolling
3. Try reducing `offset` value in AOS.init()
4. Check if `once: true` is preventing re-animation

### Issue 3: CSS Conflicts
**Symptoms**: Partial animations or strange behavior

**Solutions**:
1. Check for conflicting CSS transforms/animations
2. Ensure AOS CSS loads before your custom styles
3. Look for `overflow: hidden` on parent containers

## 🛠️ Debugging Steps

### 1. Check Console Logs
Look for these messages in browser developer tools:
```
 Initializing AOS...
 AOS initialized successfully
✅ AOS is available globally
```

### 2. Verify Installation
```bash
# Check if AOS is installed
npm list aos

# Reinstall if needed
npm install aos
```

### 3. Test Basic Animation
Add this simple test to any component:
```jsx
<div data-aos="fade-up" data-aos-duration="1000">
  This should fade up when scrolled into view
</div>
```

### 4. Force Refresh
Sometimes AOS needs a manual refresh:
```javascript
// Add this to useEffect or event handler
if (window.AOS) {
  AOS.refresh();
}
```

## 📋 Quick Verification Checklist

- [ ] AOS imported in App.jsx ✓
- [ ] AOS CSS imported in App.jsx ✓  
- [ ] AOS initialized in main App component ✓
- [ ] Elements have proper data-aos attributes ✓
- [ ] Sufficient scrollable content ✓
- [ ] No JavaScript errors in console ✓
- [ ] AOS.refresh() called after dynamic content ✓

## 🚀 Working Example

If everything is set up correctly, you should see:
- Smooth fade-in animations on scroll
- Elements animating in sequence with delays
- Console logs confirming AOS initialization
- Green "AOS Working!" badge in top-left corner (hidden by default)

Try refreshing the page and checking the browser console for initialization messages!