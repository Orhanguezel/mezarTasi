# Mezarisim.com Project Guidelines

## Google SEO and Image Optimization

### Image Standards
* All product images must be exactly 800x600 pixels for optimal Google indexing
* Use Unsplash URLs with parameters: `?w=800&h=600&fit=crop`
* Maintain aspect ratio consistency across all product images
* Always include descriptive alt text for accessibility and SEO

### Image Optimization Rules
* Main product images: 800x600 (w=800&h=600&fit=crop&crop=center)
* Gallery images: 800x600 (w=800&h=600&fit=crop)
* Thumbnail images: Use same dimensions scaled down via CSS/Tailwind classes
* All images should be optimized for fast loading and Google Core Web Vitals

## Performance Optimization

### Core Web Vitals Standards
* **First Contentful Paint (FCP)**: Target < 1.8s (currently 3.8s - needs improvement)
* **Largest Contentful Paint (LCP)**: Target < 2.5s (currently 6.0s - needs improvement)
* **Total Blocking Time (TBT)**: ✅ 0ms (excellent)
* **Cumulative Layout Shift (CLS)**: ✅ 0 (excellent)
* **Speed Index**: Target < 3.4s (currently 4.5s - needs improvement)

### Performance Implementation Rules
* **Image Loading**: Use ImageOptimized component with lazy loading
* **Critical Resources**: Preload hero images and first 6 product images
* **Code Splitting**: Use dynamic imports for non-critical components
* **Resource Hints**: DNS prefetch for external domains (Unsplash, Google Fonts)
* **Progressive Loading**: Show skeleton loaders during content loading
* **Memory Management**: Use useMemo for expensive calculations

### Mobile Performance Rules
* **Touch Optimization**: Minimum 44px touch targets, touch-action: manipulation
* **Connection Awareness**: Adapt loading strategy based on connection speed
* **Critical Path**: Hero image preload with highest priority (fetchPriority="high")
* **Mobile Viewport**: Proper viewport meta tag with user-scalable=no
* **Service Worker**: Cache critical resources for offline performance
* **Battery Optimization**: Reduce animations on low battery devices
* **Safe Areas**: Handle iPhone notch and safe areas properly
* **Font Loading**: Use font-display: swap, prevent zoom with 16px minimum
* **Haptic Feedback**: Add vibration for touch interactions where appropriate

### Component Performance Guidelines
* **Hero Section**: Priority loading for first slide image
* **Product Gallery**: Lazy load images below fold, preload first 6 items
* **Skeleton States**: Show loading placeholders instead of blank screens
* **Intersection Observer**: Use for lazy loading implementation
* **Content Visibility**: Apply to off-screen content sections

### CSS Performance
* **Critical CSS**: Inline above-the-fold styles
* **GPU Acceleration**: Use transform3d for animations
* **Font Loading**: Use font-display: swap for better FCP
* **Container Queries**: Use for responsive components when possible

## SEO and Search Engine Optimization

### Robots.txt Requirements
* **Allow All Major Content**: Main pages and product pages must be crawlable
* **Block Development Files**: Prevent crawling of .tsx, .ts, .css source files
* **Block Admin/Internal Files**: Prevent crawling of guidelines, README files
* **Sitemap Reference**: Include sitemap location when available
* **Crawl Delay**: Set reasonable crawl delay (1 second) for server protection
* **Multi-Bot Support**: Include directives for Google, Bing, Facebook, Twitter bots

### Sitemap Strategy
* **Dynamic Generation**: Use SitemapGenerator component for development
* **Page Priorities**: Homepage (1.0) > Services (0.8-0.9) > Corporate (0.5-0.6)
* **Update Frequency**: Daily for homepage, weekly for services, monthly for corporate
* **All Important Pages**: Include all service pages, campaigns, and corporate pages
* **XML Format**: Valid XML sitemap with proper namespaces and structure

### Meta Information
* **Page Titles**: Unique, descriptive titles for each page (55-60 characters)
* **Meta Descriptions**: Compelling descriptions for each page (150-160 characters)
* **Keywords**: Focus on mezar taşı, mezar modeli, mermer, granit keywords
* **Local SEO**: Include location-based keywords for regional targeting
* **Schema Markup**: Implement structured data for business information

### Technical SEO
* **URL Structure**: Clean, descriptive URLs without special characters
* **Mobile Optimization**: Responsive design for mobile-first indexing
* **Page Speed**: Maintain Google Core Web Vitals standards
* **SSL/HTTPS**: Ensure secure connections for all pages
* **Canonical URLs**: Prevent duplicate content issues

**Add your own guidelines here**
<!--

System Guidelines

Use this file to provide the AI with rules and guidelines you want it to follow.
This template outlines a few examples of things you can add. You can add your own sections and format it to suit your needs

TIP: More context isn't always better. It can confuse the LLM. Try and add the most important rules you need

# General guidelines

Any general rules you want the AI to follow.
For example:

* Only use absolute positioning when necessary. Opt for responsive and well structured layouts that use flexbox and grid by default
* Refactor code as you go to keep code clean
* Keep file sizes small and put helper functions and components in their own files.

--------------

# Design system guidelines
Rules for how the AI should make generations look like your company's design system

Additionally, if you select a design system to use in the prompt box, you can reference
your design system's components, tokens, variables and components.
For example:

* Use a base font-size of 14px
* Date formats should always be in the format “Jun 10”
* The bottom toolbar should only ever have a maximum of 4 items
* Never use the floating action button with the bottom toolbar
* Chips should always come in sets of 3 or more
* Don't use a dropdown if there are 2 or fewer options

You can also create sub sections and add more specific details
For example:


## Button
The Button component is a fundamental interactive element in our design system, designed to trigger actions or navigate
users through the application. It provides visual feedback and clear affordances to enhance user experience.

### Usage
Buttons should be used for important actions that users need to take, such as form submissions, confirming choices,
or initiating processes. They communicate interactivity and should have clear, action-oriented labels.

### Variants
* Primary Button
  * Purpose : Used for the main action in a section or page
  * Visual Style : Bold, filled with the primary brand color
  * Usage : One primary button per section to guide users toward the most important action
* Secondary Button
  * Purpose : Used for alternative or supporting actions
  * Visual Style : Outlined with the primary color, transparent background
  * Usage : Can appear alongside a primary button for less important actions
* Tertiary Button
  * Purpose : Used for the least important actions
  * Visual Style : Text-only with no border, using primary color
  * Usage : For actions that should be available but not emphasized
-->
