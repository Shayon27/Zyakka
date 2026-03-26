# Zyakka - Food Delivery Platform PRD

## Overview
Zyakka is a premium food delivery mobile app built with React Native (Expo) + FastAPI + MongoDB. It differentiates from Swiggy/Zomato with tiffin subscriptions, group ordering, direct kitchen chat, and zero-waste packaging.

## Tech Stack
- **Frontend**: React Native (Expo SDK 54), Expo Router, TypeScript
- **Backend**: FastAPI (Python), MongoDB (Motor)
- **Auth**: JWT-based custom authentication
- **Payments**: Stripe (via emergentintegrations)
- **Design**: Organic & Earthy theme (#FAF7F2, #C65D47, #4A6B53, #E8B365)

## Implemented Features (MVP)

### Authentication
- JWT-based login/signup with email/password
- Role-based routing: customer → home tabs, kitchen → kitchen dashboard, admin → admin dashboard
- Demo accounts: kitchen1@zyakka.com/kitchen123, admin@zyakka.com/admin123

### Landing Page
- Hero image with brand overlay
- Feature pills (Tiffin Plans, Group Orders, Zero Waste)
- Bento grid showcasing unique features
- Trust indicators (50+ kitchens, 4.8 avg rating, 15 min delivery)
- CTA: Get Started → Signup, Login link

### Customer Flow
- **Home**: Restaurant listing with search, filters (All/Veg/Non-Veg/Top Rated/Nearby)
- **Restaurant Detail**: Menu with categories, veg/non-veg indicators, add-to-cart
- **Cart**: Item management, zero-waste toggle ($1 refundable deposit), tax/delivery fee breakdown
- **Order Tracking**: Real-time status updates with step progress, chat link
- **Tiffin Subscriptions**: Browse 7-day/30-day plans, subscribe, manage

### Kitchen Owner Dashboard
- Incoming order management (Accept/Reject)
- Status updates (preparing → out for delivery → delivered)
- Real-time order refresh

### Admin Dashboard
- Stats grid (total orders, active orders, revenue, customers)
- Kitchen payouts with 85/15 revenue split
- Demand heatmap data

### Other Features
- **Group Orders**: Create groups, invite members, shared ordering
- **Direct Kitchen Chat**: WhatsApp-style messaging per order
- **Zero-Waste Packaging**: Toggle in cart with refundable deposit
- **Stripe Payments**: Checkout session flow (ready but needs frontend WebBrowser integration)

## Database Collections
- users, restaurants (6 seeded), menu_items (24 seeded), carts, orders
- subscriptions, subscription_plans (6 seeded), group_orders, chat_messages, payment_transactions

## API Endpoints
- Auth: register, login, profile
- Restaurants: list (with filters), detail with menu
- Cart: add, update, clear
- Orders: create, list, detail, status update
- Subscriptions: plans, subscribe, my-subs, cancel
- Group Orders: create, list, detail, join, add-items, place
- Chat: messages (REST + WebSocket)
- Payments: checkout, status, webhook
- Kitchen: orders, accept/reject, status, prep-time, stock
- Admin: stats, orders, kitchens, payouts

## Next Steps
- Complete Stripe payment integration with WebBrowser on mobile
- Real-time GPS tracking simulation
- Push notifications for order updates
- Image upload for restaurant/menu items
- Review & rating system
