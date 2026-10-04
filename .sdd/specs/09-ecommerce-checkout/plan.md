# Technical Implementation Plan: E-Commerce & Checkout

## Technical Context
- **Pages**: `CartPage.tsx`.
- **State**: `AppContext` (cart context).
- **Functions**: Edge function `create-order`.

## Phase 1: Cart State
- Implement `cartItems`, `addToCart`, `removeFromCart` in Context.
- Persist to localStorage.

## Phase 2: Cart UI
- `CartPage.tsx` displays items and calculates total price.

## Phase 3: Checkout Integration
- Call Supabase Edge Function `create-order`.
- The Edge function inserts the order to DB and triggers webhook for notifications.
