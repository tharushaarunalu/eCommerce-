# E-commerce Seller Dashboard - Setup Guide

A complete MERN stack application for e-commerce sellers with a React frontend and Node.js backend.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **MongoDB** - [Download here](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- **Git** - [Download here](https://git-scm.com/)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd seller-dashboard
```

### 2. Backend Setup

#### Navigate to backend directory
```bash
cd backend
```

#### Install dependencies
```bash
npm install
```

#### Environment Configuration
```bash
# Copy the example environment file
cp .env.example .env
```

Edit the `.env` file with your configuration:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/seller-dashboard

# JWT Secret (generate a strong secret)
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
JWT_EXPIRE=30d

# Cloudinary (for image uploads) - Sign up at https://cloudinary.com
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email Configuration (optional - for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Stripe (optional - for payments)
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Frontend URL
CLIENT_URL=http://localhost:5173
```

#### Start MongoDB
**Option 1: Local MongoDB**
```bash
# On macOS with Homebrew
brew services start mongodb-community

# On Windows (if installed as service)
net start MongoDB

# On Linux
sudo systemctl start mongod
```

**Option 2: MongoDB Atlas (Cloud)**
- Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Create a cluster and get connection string
- Replace `MONGODB_URI` in `.env` with your Atlas connection string

#### Seed the Database (Optional but Recommended)
```bash
npm run seed
```
This creates test data including:
- Seller account: `seller@example.com` / `password123`
- Sample products, orders, reviews, and transactions

#### Start the Backend Server
```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

The backend will run on `http://localhost:5000`

### 3. Frontend Setup

#### Open a new terminal and navigate to frontend
```bash
# From the root directory
cd ../  # if you're in backend directory
# You should now be in the root directory with package.json
```

#### Install dependencies
```bash
npm install
```

#### Start the Frontend Development Server
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## 🔧 Development Workflow

### Running Both Servers Simultaneously

**Option 1: Two Terminal Windows**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend (from root directory)
npm run dev
```

**Option 2: Using concurrently (Recommended)**

Install concurrently globally:
```bash
npm install -g concurrently
```

From the root directory, create a script to run both:
```bash
# Add this to your root package.json scripts
"dev:all": "concurrently \"cd backend && npm run dev\" \"npm run dev\""
```

Then run:
```bash
npm run dev:all
```

## 🌐 Accessing the Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000
- **API Health Check:** http://localhost:5000/api/health

### Test Login Credentials
After running the seed script:
- **Email:** seller@example.com
- **Password:** password123

## 📁 Project Structure

```
seller-dashboard/
├── backend/                 # Node.js/Express backend
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   ├── middleware/         # Custom middleware
│   ├── scripts/            # Utility scripts
│   ├── server.js           # Main server file
│   ├── package.json        # Backend dependencies
│   └── .env                # Environment variables
├── src/                    # React frontend
│   ├── components/         # React components
│   ├── data/              # Mock data
│   ├── types/             # TypeScript types
│   └── App.tsx            # Main App component
├── package.json           # Frontend dependencies
└── README.md              # This file
```

## 🔍 API Testing

You can test the API endpoints using tools like:

**Postman Collection:**
```bash
# Health check
GET http://localhost:5000/api/health

# Register new seller
POST http://localhost:5000/api/auth/register
Content-Type: application/json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "shopProfile": {
    "shopName": "John's Store",
    "category": "Electronics"
  }
}

# Login
POST http://localhost:5000/api/auth/login
Content-Type: application/json
{
  "email": "seller@example.com",
  "password": "password123"
}
```

## 🛠 Troubleshooting

### Common Issues

**1. MongoDB Connection Error**
```bash
# Check if MongoDB is running
# For local installation:
mongosh  # Should connect without errors

# For Atlas: Verify connection string and network access
```

**2. Port Already in Use**
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

**3. Environment Variables Not Loading**
```bash
# Ensure .env file is in backend directory
# Check file permissions
ls -la backend/.env

# Verify no extra spaces in .env file
```

**4. CORS Issues**
- Ensure `CLIENT_URL` in backend `.env` matches frontend URL
- Check that CORS is properly configured in `server.js`

**5. Image Upload Issues**
- Verify Cloudinary credentials in `.env`
- Check Cloudinary dashboard for API usage

### Logs and Debugging

**Backend Logs:**
```bash
# The backend server will show detailed logs including:
# - Database connection status
# - API requests
# - Error messages
```

**Frontend Logs:**
```bash
# Check browser console for frontend errors
# Network tab shows API requests/responses
```

## 🚀 Production Deployment

### Backend Deployment (Heroku Example)
```bash
# Install Heroku CLI
# Login to Heroku
heroku login

# Create app
heroku create your-app-name

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=your-production-mongodb-uri
heroku config:set JWT_SECRET=your-production-jwt-secret
# ... set all other environment variables

# Deploy
git push heroku main
```

### Frontend Deployment (Netlify/Vercel)
```bash
# Build for production
npm run build

# Deploy dist folder to your hosting service
```

## 📚 Additional Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [React Documentation](https://react.dev/)
- [Cloudinary Documentation](https://cloudinary.com/documentation)

## 🆘 Support

If you encounter issues:

1. Check the console logs for error messages
2. Verify all environment variables are set correctly
3. Ensure MongoDB is running and accessible
4. Check that all dependencies are installed
5. Verify port availability

For specific errors, check the error messages in:
- Backend terminal output
- Browser console (F12)
- Network tab in browser dev tools