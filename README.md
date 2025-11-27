# 📚 BookHaven

A modern, full-featured online bookstore built with Node.js, Express, and MongoDB. BookHaven provides a seamless shopping experience for book lovers with features like user authentication, shopping cart, wishlist, order management, and more.

![BookHaven](https://img.shields.io/badge/Node.js-18+-green) ![Express](https://img.shields.io/badge/Express-4.x-blue) ![MongoDB](https://img.shields.io/badge/MongoDB-8.x-green) ![License](https://img.shields.io/badge/License-ISC-yellow)

## ✨ Features

### 🛒 Shopping Experience

- **Browse Books** - Explore featured, popular, new releases, and top-rated books
- **Search** - Find books by title, author, or genre with real-time search results
- **Book Details** - View detailed information, ratings, and reviews for each book
- **Shopping Cart** - Add books, adjust quantities, and proceed to checkout
- **Wishlist** - Save books for later with easy move-to-cart functionality

### 👤 User Management

- **Authentication** - Secure sign up and sign in with JWT tokens
- **Profile Management** - Update username, email, password, and avatar
- **Order History** - View past orders with detailed information
- **Order Cancellation** - Cancel orders that are still processing

### 💳 Checkout & Orders

- **Shipping Information** - Enter delivery details during checkout
- **Order Tracking** - Track order status (processing → shipped → delivered)
- **Invoice Generation** - Download PDF invoices for completed orders

### ⭐ Reviews & Ratings

- **User Reviews** - Add ratings and comments to books
- **Average Ratings** - See aggregated ratings displayed on book cards
- **Star Ratings** - Visual star rating system

### 🏷️ Promotions

- **Daily Promotions** - Automatic daily deals with discounted prices
- **Promo Badges** - Visual indicators for books on sale
- **Discount Display** - Original and promotional prices shown

### 🎨 UI/UX

- **Responsive Design** - Optimized for desktop, tablet, and mobile
- **Dark/Light Mode** - Toggle between themes
- **Modern Interface** - Clean, intuitive design with smooth animations

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **View Engine**: EJS (Embedded JavaScript)
- **Authentication**: JWT (JSON Web Tokens)
- **Session Storage**: connect-mongo (MongoDB-backed sessions)
- **File Storage**: Supabase Storage (for avatars)
- **PDF Generation**: PDFKit (for invoices)
- **Deployment**: Vercel (with serverless functions for cron jobs)

## 📦 Installation

### Prerequisites

- Node.js 18+
- MongoDB database
- pnpm (recommended) or npm

### Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/BookHaven.git
   cd BookHaven
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Environment Variables**

   Create a `.env` file in the root directory:

   ```env
   PORT=8080
   MONGO_URI=your_mongodb_connection_string
   SESSION_SECRET=your_session_secret
   JWT_SECRET=your_jwt_secret
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_anon_key
   ```

4. **Start the server**

   ```bash
   pnpm start
   ```

5. **Open in browser**
   ```
   http://localhost:8080
   ```

## 📁 Project Structure

```
BookHaven/
├── api/                    # Vercel serverless functions (cron jobs)
├── controllers/            # Route controllers
├── database/               # Database seed data (JSON)
├── middleware/             # Express middleware
├── models/                 # Mongoose models & services
├── public/                 # Static assets
│   ├── assets/            # Images and SVGs
│   ├── scripts/           # Client-side JavaScript
│   └── styles/            # CSS stylesheets
├── routers/                # Express route definitions
├── services/               # Business logic services
├── views/                  # EJS templates
│   └── partials/          # Reusable template components
├── __tests__/             # Jest test files
├── index.js               # Application entry point
├── package.json
└── vercel.json            # Vercel deployment config
```

## 🚀 Deployment

### Vercel

The project is configured for Vercel deployment with:

- Serverless functions for API routes
- Cron jobs for:
  - Daily promotion generation (midnight UTC)
  - Order status updates (every 6 hours)

Deploy with:

```bash
vercel
```

## 📄 API Endpoints

### Authentication

- `POST /user/signup` - Register new user
- `POST /user/signin` - User login
- `GET /user/signout` - User logout
- `POST /user/update` - Update profile

### Books

- `GET /book/:id` - Get book details
- `GET /explore` - Browse all books
- `GET /search` - Search books

### Cart

- `POST /cart/add` - Add to cart
- `POST /cart/update` - Update quantity
- `POST /cart/remove` - Remove from cart

### Wishlist

- `POST /wishlist/add` - Add to wishlist
- `POST /wishlist/remove` - Remove from wishlist
- `POST /wishlist/moveToCart` - Move items to cart

### Orders

- `POST /orders` - Create order
- `POST /orders/:id/cancel` - Cancel order
- `GET /orders/:id/invoice` - Download invoice

### Reviews

- `POST /reviews/add` - Add review
- `DELETE /reviews/delete` - Delete review

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
