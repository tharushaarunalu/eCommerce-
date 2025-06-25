# Seller Dashboard Backend

A comprehensive Node.js/Express.js backend API for an e-commerce seller dashboard with MongoDB integration.

## Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **Product Management**: CRUD operations with image upload and inventory tracking
- **Order Management**: Complete order lifecycle with status updates and tracking
- **Analytics**: Comprehensive sales, product, and customer analytics
- **Reviews & Ratings**: Customer review system with seller responses
- **Transactions**: Payment processing and financial reporting
- **Notifications**: Real-time notifications with Socket.IO
- **File Upload**: Cloudinary integration for image management
- **Data Validation**: Express-validator for input validation
- **Security**: Helmet, rate limiting, and CORS protection

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
-**Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer + Cloudinary
- **Real-time**: Socket.IO
- **Validation**: Express-validator
- **Security**: Helmet, CORS, Rate limiting

## Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
```bash
cp .env.example .env
```

Edit `.env` file with your configuration:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/seller-dashboard
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=30d

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

CLIENT_URL=http://localhost:5173
```

4. **Start MongoDB**
Make sure MongoDB is running on your system.

5. **Seed Database (Optional)**
```bash
npm run seed
```

6. **Start the server**
```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new seller
- `POST /api/auth/login` - Login seller
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/logout` - Logout

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /api/products/alerts/low-stock` - Get low stock products
- `PUT /api/products/bulk` - Bulk update products

### Orders
- `GET /api/orders` - Get all orders
- `GET /api/orders/:id` - Get single order
- `POST /api/orders` - Create order
- `PUT /api/orders/:id/status` - Update order status
- `PUT /api/orders/:id/tracking` - Add tracking info
- `GET /api/orders/analytics/summary` - Get order analytics

### Reviews
- `GET /api/reviews` - Get all reviews
- `GET /api/reviews/product/:productId` - Get product reviews
- `POST /api/reviews` - Create review
- `PUT /api/reviews/:id/respond` - Respond to review
- `PUT /api/reviews/:id/helpful` - Mark as helpful
- `PUT /api/reviews/:id/flag` - Flag review

### Analytics
- `GET /api/analytics/overview` - Dashboard overview
- `GET /api/analytics/sales` - Sales analytics
- `GET /api/analytics/products` - Product analytics
- `GET /api/analytics/customers` - Customer analytics

### Transactions
- `GET /api/transactions` - Get all transactions
- `GET /api/transactions/:id` - Get single transaction
- `GET /api/transactions/summary/stats` - Transaction summary
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/:id/status` - Update status

### Notifications
- `GET /api/notifications` - Get notifications
- `GET /api/notifications/unread-count` - Unread count
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/mark-all-read` - Mark all read
- `PUT /api/notifications/:id/archive` - Archive notification

### File Upload
- `POST /api/upload/image` - Upload single image
- `POST /api/upload/images` - Upload multiple images
- `DELETE /api/upload/image/:publicId` - Delete image

## Database Models

### User
- Personal information and shop profile
- Authentication credentials
- Settings and preferences
- Role-based permissions

### Product
- Product details and specifications
- Inventory management
- Analytics tracking
- Image management

### Order
- Customer information
- Order items and pricing
- Shipping and billing addresses
- Status tracking and timeline

### Review
- Customer feedback and ratings
- Seller responses
- Verification status
- Moderation features

### Transaction
- Financial records
- Payment processing
- Fee calculations
- Status tracking

### Notification
- Real-time alerts
- Multi-channel delivery
- Priority levels
- Read/archive status

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs for password security
- **Rate Limiting**: Prevent API abuse
- **CORS Protection**: Cross-origin request security
- **Helmet**: Security headers
- **Input Validation**: Express-validator for data validation
- **Error Handling**: Comprehensive error management

## Real-time Features

- **Socket.IO Integration**: Real-time notifications
- **Order Updates**: Live order status changes
- **Inventory Alerts**: Stock level notifications
- **New Reviews**: Instant review notifications

## File Management

- **Cloudinary Integration**: Cloud-based image storage
- **Image Optimization**: Automatic compression and formatting
- **Multiple Upload**: Batch image processing
- **Secure URLs**: Protected image access

## Development

### Project Structure
```
backend/
├── models/          # Database models
├── routes/          # API routes
├── middleware/      # Custom middleware
├── scripts/         # Utility scripts
├── server.js        # Main server file
└── package.json     # Dependencies
```

### Testing
The seed script creates test data including:
- Seller account (seller@example.com / password123)
- Sample products with images
- Test orders and transactions
- Customer reviews

### Error Handling
Comprehensive error handling with:
- Custom error middleware
- Validation error formatting
- Database error handling
- JWT error management

## Production Deployment

1. **Environment Variables**: Set all required environment variables
2. **Database**: Use MongoDB Atlas or dedicated MongoDB instance
3. **File Storage**: Configure Cloudinary for production
4. **Security**: Enable all security middleware
5. **Monitoring**: Implement logging and monitoring
6. **SSL**: Use HTTPS in production

## API Documentation

The API follows RESTful conventions with:
- Consistent response formats
- Proper HTTP status codes
- Comprehensive error messages
- Pagination for list endpoints
- Search and filtering capabilities

## Support

For issues and questions:
1. Check the error logs
2. Verify environment configuration
3. Ensure database connectivity
4. Review API documentation