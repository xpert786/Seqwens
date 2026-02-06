# AOS (Animate On Scroll) Animation Guide

## 🎉 Setup Complete!

AOS is now fully configured and ready to use in your Seqwens project. Here's everything you need to know to leverage smooth scroll animations.

## 🔧 Current Configuration

AOS is already initialized in `src/App.jsx` with these settings:

```javascript
AOS.init({
  // Global settings
  disable: false,
  startEvent: 'DOMContentLoaded',
  initClassName: 'aos-init',
  animatedClassName: 'aos-animate',
  useClassNames: false,
  disableMutationObserver: false,
  debounceDelay: 50,
  throttleDelay: 99,
  
  // Animation settings
  offset: 120,              // Trigger point offset (px)
  delay: 0,                 // Delay before animation (0-3000ms)
  duration: 800,            // Animation duration (0-3000ms)
  easing: 'ease',           // Animation easing
  once: false,              // Animate only once
  mirror: false,            // Animate out when scrolling past
  anchorPlacement: 'top-bottom'
});
```

## 🚀 How to Add Animations

Simply add `data-aos` attributes to any HTML element:

```jsx
<div data-aos="fade-up" data-aos-duration="1000" data-aos-delay="200">
  This element will fade up when scrolled into view
</div>
```

## 🎨 Available Animations

### Fade Animations
- `fade` - Basic fade in
- `fade-up` - Fade in from bottom
- `fade-down` - Fade in from top
- `fade-left` - Fade in from left
- `fade-right` - Fade in from right
- `fade-up-right` - Fade in from bottom-left
- `fade-up-left` - Fade in from bottom-right
- `fade-down-right` - Fade in from top-left
- `fade-down-left` - Fade in from top-right

### Flip Animations
- `flip-up` - Flip from bottom
- `flip-down` - Flip from top
- `flip-left` - Flip from right
- `flip-right` - Flip from left

### Slide Animations
- `slide-up` - Slide from bottom
- `slide-down` - Slide from top
- `slide-left` - Slide from right
- `slide-right` - Slide from left

### Zoom Animations
- `zoom-in` - Scale up
- `zoom-in-up` - Scale up from bottom
- `zoom-in-down` - Scale up from top
- `zoom-in-left` - Scale up from left
- `zoom-in-right` - Scale up from right
- `zoom-out` - Scale down
- `zoom-out-up` - Scale down to bottom
- `zoom-out-down` - Scale down to top
- `zoom-out-left` - Scale down to left
- `zoom-out-right` - Scale down to right

## ⚙️ Animation Properties

### Duration Options
```jsx
data-aos-duration="500"   // Fast (500ms)
data-aos-duration="1000"  // Medium (1000ms) - Default
data-aos-duration="1500"  // Slow (1500ms)
data-aos-duration="2000"  // Very slow (2000ms)
```

### Delay Options
```jsx
data-aos-delay="0"      // No delay (default)
data-aos-delay="100"    // Small delay
data-aos-delay="300"    // Medium delay
data-aos-delay="500"    // Large delay
```

### Easing Options
```jsx
data-aos-easing="linear"
data-aos-easing="ease"
data-aos-easing="ease-in"
data-aos-easing="ease-out"
data-aos-easing="ease-in-out"
data-aos-easing="ease-in-back"
data-aos-easing="ease-out-back"
data-aos-easing="ease-in-out-back"
data-aos-easing="ease-in-sine"
data-aos-easing="ease-out-sine"
data-aos-easing="ease-in-out-sine"
data-aos-easing="ease-in-quad"
data-aos-easing="ease-out-quad"
data-aos-easing="ease-in-out-quad"
data-aos-easing="ease-in-cubic"
data-aos-easing="ease-out-cubic"
data-aos-easing="ease-in-out-cubic"
data-aos-easing="ease-in-quart"
data-aos-easing="ease-out-quart"
```

## 📱 Responsive Behavior

Control animations on different screen sizes:

```jsx
<div 
  data-aos="fade-up"
  data-aos-duration="1000"
  data-aos-once="true"           // Animate only once
  data-aos-mirror="false"        // Don't animate out when scrolling past
  data-aos-anchor-placement="top-bottom"  // Trigger position
>
  Content here
</div>
```

## 🎯 Practical Examples

### Hero Section Elements
```jsx
// Main headline
<h1 data-aos="fade-up" data-aos-duration="1000" data-aos-delay="200">
  Main Heading
</h1>

// Subtitle
<p data-aos="fade-up" data-aos-duration="1000" data-aos-delay="400">
  Supporting text
</p>

// Call-to-action button
<button data-aos="zoom-in" data-aos-duration="600" data-aos-delay="600">
  Get Started
</button>

// Statistic cards (staggered delays)
<div className="grid grid-cols-3 gap-8">
  <div data-aos="flip-left" data-aos-duration="800" data-aos-delay="800">Stat 1</div>
  <div data-aos="flip-left" data-aos-duration="800" data-aos-delay="1000">Stat 2</div>
  <div data-aos="flip-left" data-aos-duration="800" data-aos-delay="1200">Stat 3</div>
</div>
```

### Feature Sections
```jsx
// Section container
<section data-aos="fade-up" data-aos-duration="1000">
  <div data-aos="zoom-in" data-aos-duration="800" data-aos-delay="200">
    <h2>Feature Title</h3>
  </div>
  <p data-aos="fade-right" data-aos-duration="800" data-aos-delay="400">
    Feature description
  </p>
</section>
```

## 🔄 Advanced Usage

### Custom Offset
Trigger animations at different scroll positions:
```jsx
<div data-aos="fade-up" data-aos-offset="300">
  Triggers 300px before entering viewport
</div>
```

### Disable on Mobile
```jsx
<div data-aos="fade-up" data-aos-disable="mobile">
  Won't animate on mobile devices
</div>
```

### Anchor Elements
Trigger animation based on another element:
```jsx
<div data-aos="fade-up" data-aos-anchor=".trigger-element">
  Animated when .trigger-element enters viewport
</div>
```

## 🛠️ Implementation Tips

1. **Stagger Delays**: Use incremental delays (200ms, 400ms, 600ms) for sequential animations
2. **Performance**: Use `data-aos-once="true"` for better performance
3. **Consistency**: Stick to a consistent duration (800-1000ms works well)
4. **Hierarchy**: Animate main elements first, then supporting content
5. **Testing**: Always test on different devices and screen sizes

## 📁 Files Updated

- `src/App.jsx` - Enhanced AOS initialization
- `src/pages/Home/HeroSection.jsx` - Added animations to hero section
- `src/pages/Home/FeatureCards.jsx` - Added animations to feature cards

## 🚀 Ready to Use!

Start adding AOS animations to your components by simply including the `data-aos` attributes. The library is fully configured and will work automatically throughout your application.

For more information, visit the official AOS documentation: https://michalsnik.github.io/aos/