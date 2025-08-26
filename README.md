# 🏠 Airbnb Clone - Full-Stack Accommodation Platform

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/Nhwng/Airbnb)
[![License](https://img.shields.io/badge/license-ISC-green.svg)](https://github.com/Nhwng/Airbnb)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.x-green.svg)](https://mongodb.com/)

## 📖 Overview

A comprehensive full-stack web application that replicates Airbnb's core functionality using the MERN stack (MongoDB, Express.js, React.js, Node.js). This platform enables users to search for accommodations, make bookings through an innovative auction system, manage listings, and process payments seamlessly.

### 🌟 Key Features

#### 🔐 **Authentication & User Management**
- JWT-based secure authentication
- Google OAuth integration
- User profile management
- Role-based access control (Guest, Host, Admin)
- Password reset functionality

#### 🏠 **Listing Management**
- Create and manage property listings
- Multiple image uploads via Cloudinary
- Detailed property descriptions and amenities
- Availability calendar management
- Room type categorization

#### 🎯 **Auction System**
- **Dual Booking System:**
  - **Direct Rental:** Instant booking for next 2 weeks
  - **Auction Rental:** Competitive bidding for bookings 15+ days ahead
- Real-time bidding with WebSocket support
- Buyout option for immediate purchase
- Automated auction management
- Winner notification system

#### 💳 **Payment Processing**
- ZaloPay integration for Vietnamese market
- Sandbox payment testing
- Secure payment callbacks and webhooks
- Order management with expiration
- Payment status tracking

#### 📅 **Booking & Reservations**
- Calendar-based availability checking
- Multi-guest booking support
- Reservation history and management
- Check-in/check-out date validation
- Guest information collection

#### 📊 **Admin Dashboard**
- Auction approval system
- User and listing management
- Statistics and analytics
- Content moderation
- System monitoring

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18.x or higher
- **MongoDB** 6.x or higher
- **npm** or **yarn** package manager
- **Git** for version control

### 1. Clone the Repository

```bash
git clone https://github.com/Nhwng/Airbnb.git
cd Airbnb
```

### 2. Quick Setup (Recommended)

Run the automated setup script:

```bash
chmod +x setup.sh
./setup.sh
```

The script automatically:
- ✅ Installs all dependencies
- ✅ Creates default `.env` files
- ✅ Starts development servers
- ✅ Sets up ngrok tunnel (if available)
- ✅ Configures ZaloPay callbacks

### 3. Manual Setup

#### Install Dependencies

**Frontend:**
```bash
cd client
npm install
```

**Backend:**
```bash
cd api
npm install
```

#### Environment Configuration

**Client `.env` file:**
```env
VITE_BASE_URL=http://localhost:4000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

**API `.env` file:**
```env
# Server Configuration
PORT=4000
CLIENT_URL=http://localhost:5173

# Database
DB_URL=mongodb://localhost:27017/airbnb_clone

# Authentication
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRY=20d
COOKIE_TIME=7
SESSION_SECRET=your_session_secret

# File Upload
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Payment Gateway
ZALOPAY_APP_ID=2554
ZALOPAY_KEY1=your_zalopay_key1
ZALOPAY_KEY2=your_zalopay_key2
ZALOPAY_ENDPOINT=https://sb-openapi.zalopay.vn/v2/create
ZALOPAY_CALLBACK_URL=http://localhost:4000/payments/zalopay/callback

# Ngrok Configuration (Optional)
PUBLIC_TUNNEL_URL=your_ngrok_url
```

#### Start Development Servers

**Backend:**
```bash
cd api
npm start
```

**Frontend:**
```bash
cd client
npm run dev
```

## 🛠️ Technology Stack

### 🖥️ **Frontend**
- **React 18.2.0** - Modern UI library with hooks
- **Vite 4.0.0** - Fast build tool and dev server
- **React Router DOM 6.8.0** - Client-side routing
- **Tailwind CSS 3.2.4** - Utility-first CSS framework
- **Radix UI** - Headless UI components
- **Lucide React** - Beautiful icon library
- **Axios** - HTTP client for API requests
- **React Toastify** - Toast notifications
- **Date-fns** - Date utility library

### ⚙️ **Backend**
- **Node.js** - JavaScript runtime
- **Express.js 4.18.2** - Web application framework
- **MongoDB 6.9.0** with Mongoose - NoSQL database
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Cloudinary** - Image management service
- **Multer** - File upload middleware
- **Node-cron** - Task scheduling
- **Nodemailer** - Email service

### 🔗 **Integrations**
- **ZaloPay** - Vietnamese payment gateway
- **Google OAuth** - Social authentication
- **Cloudinary** - Cloud image storage
- **Ngrok** - Local tunnel for webhooks

### 🗄️ **Database Schema**
- **Users** - Authentication and profiles
- **Listings** - Property information
- **Reservations** - Booking records
- **Auctions** - Bidding system
- **Payments** - Transaction tracking
- **Reviews** - User feedback system

## 🏗️ Project Structure

```
Airbnb/
├── 📁 api/                          # Backend application
│   ├── 📁 config/                   # Configuration files
│   │   ├── db.js                    # Database connection
│   │   └── zalopayConfig.js         # Payment gateway config
│   ├── 📁 controllers/              # Business logic
│   │   ├── userController.js        # User management
│   │   ├── listingController.js     # Property listings
│   │   ├── auctionController.js     # Auction system
│   │   ├── paymentController.js     # Payment processing
│   │   └── reservationController.js # Booking management
│   ├── 📁 middlewares/              # Custom middleware
│   │   ├── user.js                  # Authentication
│   │   └── admin.js                 # Authorization
│   ├── 📁 models/                   # Database schemas
│   │   ├── User.js                  # User model
│   │   ├── Listing.js               # Property model
│   │   ├── Auction.js               # Auction model
│   │   ├── Payment.js               # Payment model
│   │   └── Reservation.js           # Booking model
│   ├── 📁 routes/                   # API endpoints
│   ├── 📁 services/                 # External services
│   │   ├── zalopayService.js        # Payment integration
│   │   └── sseManager.js            # Real-time updates
│   └── 📁 utils/                    # Helper functions
├── 📁 client/                       # Frontend application
│   ├── 📁 src/
│   │   ├── 📁 components/           # Reusable UI components
│   │   ├── 📁 pages/                # Application pages
│   │   ├── 📁 hooks/                # Custom React hooks
│   │   ├── 📁 utils/                # Helper functions
│   │   └── 📁 styles/               # CSS and styling
│   ├── 📁 public/                   # Static assets
│   └── package.json                 # Frontend dependencies
├── setup.sh                         # Automated setup script
└── README.md                        # Project documentation
```

## 🎯 Core Features Deep Dive

### 🎪 Auction System
The platform features an innovative dual booking system:

**📅 Direct Rental (Next 2 Weeks)**
- Instant booking at standard rates
- Fixed pricing with immediate confirmation
- No auction required

**🏆 Auction Rental (Day 15+)**
- Competitive bidding system
- Starting price set by hosts
- Buyout option for immediate purchase
- Real-time bid updates
- Automated winner selection

### 💰 Payment Integration
**ZaloPay Integration:**
- Secure Vietnamese payment gateway
- Real-time payment callbacks
- Webhook verification
- Order expiration handling
- Automatic reservation creation

**Payment Flow:**
1. User creates booking order
2. Payment initiated through ZaloPay
3. Secure payment processing
4. Webhook confirms payment
5. Reservation automatically created
6. Availability updated

### 🔒 Security Features
- JWT token-based authentication
- Password hashing with bcrypt
- CORS protection
- Input validation and sanitization
- Secure file upload handling
- Payment callback verification

## 🌐 API Endpoints

### Authentication
```
POST /users/signup          # User registration
POST /users/signin          # User login
POST /users/signout         # User logout
POST /users/forgotpassword  # Password reset
```

### Listings
```
GET    /listings            # Get all listings
POST   /listings            # Create new listing
PUT    /listings/:id        # Update listing
DELETE /listings/:id        # Delete listing
```

### Auctions
```
GET  /auctions              # Get active auctions
POST /auctions/request      # Request auction approval
POST /auctions/:id/bid      # Place bid
POST /auctions/:id/buyout   # Instant purchase
```

### Payments
```
POST /payments              # Create payment
GET  /payments/:id          # Get payment details
POST /payments/zalopay/callback  # ZaloPay webhook
```

## 🔧 Configuration

### Ngrok Setup for ZaloPay Webhooks

For ZaloPay webhook testing, you need a public URL:

1. **Install ngrok:**
```bash
npm install -g ngrok
```

2. **Start ngrok tunnel:**
```bash
ngrok http 4000
```

3. **Update environment:**
```env
PUBLIC_TUNNEL_URL=https://your-ngrok-url.ngrok.io
ZALOPAY_CALLBACK_URL=https://your-ngrok-url.ngrok.io/payments/zalopay/callback
```

### MongoDB Setup

**Local MongoDB:**
```bash
# Install MongoDB Community Edition
# Start MongoDB service
mongod --dbpath /path/to/your/data/directory
```

**MongoDB Atlas (Cloud):**
```env
DB_URL=mongodb+srv://username:password@cluster.mongodb.net/airbnb_clone
```

### Cloudinary Setup

1. Create account at [Cloudinary](https://cloudinary.com/)
2. Get your cloud name, API key, and API secret
3. Add to `.env` file

## 🚦 Development Commands

### Frontend
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

### Backend
```bash
npm start        # Start production server
npm run dev      # Start development server
npm run ngrok    # Start with ngrok tunnel
```

## 🧪 Testing

### Payment Testing
- Use ZaloPay sandbox environment
- Test cards and credentials provided by ZaloPay
- Webhook testing via ngrok tunnel

### Auction Testing
- Create test listings
- Submit auction requests
- Place bids and test buyout functionality

## 📊 Performance Optimizations

- **Frontend:**
  - Code splitting with React.lazy
  - Image optimization with Cloudinary
  - Bundle optimization with Vite

- **Backend:**
  - Database indexing for faster queries
  - Caching strategies for frequently accessed data
  - Pagination for large datasets

## 🚀 Deployment

### Frontend (Netlify)
```bash
npm run build
# Deploy dist/ folder to Netlify
```

### Backend (VPS/Heroku)
```bash
# Set production environment variables
# Configure MongoDB connection
# Set up domain for webhooks
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📝 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Nhwng** - *Initial work* - [GitHub](https://github.com/Nhwng)

## 🙏 Acknowledgments

- Airbnb for inspiration
- ZaloPay for payment gateway
- Cloudinary for image management
- Open source community for amazing tools

## 📞 Support

For support, email support@example.com or create an issue on GitHub.

---

**🎉 Happy Coding!** Star ⭐ this repository if you found it helpful!
