# Design Guidelines: Payment Gateway Demo

## Design Approach
**Reference-Based: Razorpay Checkout Pattern**
Drawing inspiration from Razorpay's trusted, clean payment interface that prioritizes clarity, security signals, and streamlined user flows. Focus on building trust through professional polish and familiar payment patterns.

## Typography System
**Font Families:**
- Primary: Inter or SF Pro Display (Google Fonts CDN)
- Monospace: JetBrains Mono for account numbers, order IDs, amounts

**Hierarchy:**
- Page Titles: 2xl, semibold
- Section Headers: xl, medium
- Form Labels: sm, medium, uppercase tracking-wide
- Input Text: base, regular
- Helper Text: xs, regular
- Button Text: sm, medium
- Receipt/Order Details: base, regular
- Amounts/Numbers: lg, semibold (monospace)

## Layout & Spacing
**Spacing Primitives:** Use Tailwind units of 2, 4, 6, and 8 consistently
- Form field gaps: space-y-4
- Section padding: p-6 to p-8
- Modal padding: p-8
- Card spacing: p-6
- Button padding: px-6 py-3
- Grid gaps: gap-4

**Container Widths:**
- Main checkout form: max-w-md mx-auto
- Payment modal: max-w-lg
- Bank account creation: max-w-2xl mx-auto
- Receipt page: max-w-xl mx-auto

## Component Library

### 1. Checkout Page (Main Landing)
- Centered card layout with subtle elevation
- Clean white background card with rounded-lg borders
- Logo/brand header at top (text or small icon)
- Form fields stacked vertically with consistent spacing
- Input fields: Full-width, rounded-md, clear focus states with ring emphasis
- "Pay Now" button: Full-width, prominent, rounded-md with subtle shadow

### 2. Payment Modal (Razorpay-style Popup)
**Structure:**
- Overlay: Semi-transparent backdrop
- Modal: Centered, rounded-lg, with close button (X) top-right
- Header section: Order ID displayed prominently with copy icon
- User details summary: Compact grid showing name, email, phone, amount (amount emphasized)
- Payment method tabs: Horizontal pill-style tabs (Card, UPI, Netbanking)
- Content area: Changes based on selected payment method
- For Netbanking: List of bank accounts as selectable cards with radio buttons
- Bank card structure: Account holder name (medium weight), Account number (monospace, muted), Bank name (small caps), Balance (if showing)
- Action buttons: Full-width primary button, text-only cancel link below

### 3. Create Test Bank Account Page
- Page header with clear title and description
- Form in centered card layout (max-w-2xl)
- Input fields with inline helper text
- "Auto-generate" button next to Account Number field (secondary style)
- Initial Balance field with currency symbol prefix
- Accent on the submit button to encourage account creation
- Below form: List of existing accounts in grid (2 columns on desktop, 1 on mobile)
- Account cards: Compact, bordered, showing key details with edit/delete icons

### 4. Bank Account Selection (Within Modal)
- Grid of bank cards: 2 columns on desktop, 1 on mobile
- Each card: Clickable with radio button, clear selected state
- Display: Bank name (bold), Account number (monospace), Current balance (emphasized)
- Visual indicator for insufficient balance (muted with warning icon)

### 5. Receipt/Success Page
- Centered card with success icon at top (checkmark in circle)
- "Payment Successful" headline or "Payment Failed" with appropriate iconography
- Details table: Two-column layout (label: value)
- Order ID: Monospace with copy button
- Amount: Large, bold, monospace
- Payment method badge/pill
- Timestamp: Small, muted
- Action buttons: "Create Another Payment" primary, "View Transactions" secondary

### 6. Loading States
- Spinner overlay during payment processing
- Subtle pulse animation on "Processing..." text
- Modal remains open during processing

### 7. Form Elements
**Input Fields:**
- Consistent height (h-11 or h-12)
- Border with focus ring effect
- Label above input with small gap
- Placeholder text in muted tone
- Error states: Red border with error message below in xs text

**Buttons:**
- Primary: Solid, rounded-md, medium font weight, px-6 py-3
- Secondary: Outlined or ghost style
- Disabled state: Reduced opacity with cursor-not-allowed

**Select/Dropdowns:**
- Match input field styling
- Custom arrow icon for consistency

## Accessibility
- All form inputs have associated labels
- Focus states clearly visible with ring utilities
- Sufficient contrast ratios throughout
- Keyboard navigation support for modal and forms
- ARIA labels for icon buttons (close, copy)

## Responsive Behavior
- Mobile: Full-width cards with p-4, single column layouts
- Desktop: Centered cards with max-widths, multi-column grids where appropriate
- Modal: Full-screen on mobile, centered card on desktop

## Images
**No hero images needed** for this application. Focus on iconography:
- Use Heroicons for UI icons (checkmarks, X close, copy, bank, card, wallet)
- Payment method icons can be simple SVG representations
- Success/failure states use icon + text combination

## Visual Hierarchy Principles
- Amount always stands out (larger, bold, monospace)
- Order IDs clearly identifiable with monospace treatment
- Payment status immediately recognizable (color + icon + text)
- Form fields have clear visual grouping
- CTAs are unmistakable and action-oriented