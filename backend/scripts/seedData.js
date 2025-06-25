import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Review from '../models/Review.js';
import Transaction from '../models/Transaction.js';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});
    await Review.deleteMany({});
    await Transaction.deleteMany({});

    console.log('Cleared existing data');

    // Create seller user
    const seller = await User.create({
      firstName: 'John',
      lastName: 'Doe',
      email: 'seller@example.com',
      password: 'password123',
      role: 'seller',
      shopProfile: {
        shopName: 'My Awesome Store',
        description: 'We sell amazing products with excellent customer service.',
        category: 'Electronics',
        contactEmail: 'contact@mystore.com',
        phone: '+1 (555) 123-4567',
        address: {
          street: '123 Business St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        }
      },
      emailVerified: true,
      isActive: true
    });

    console.log('Created seller user');

    // Create products
    const products = await Product.create([
      {
        seller: seller._id,
        name: 'Wireless Bluetooth Headphones',
        description: 'High-quality wireless headphones with noise cancellation and long battery life.',
        category: 'Electronics',
        price: 79.99,
        stock: 45,
        images: [
          {
            url: 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=800',
            alt: 'Wireless Bluetooth Headphones',
            isPrimary: true
          }
        ],
        status: 'active',
        analytics: {
          views: 1250,
          sales: 23,
          revenue: 1839.77
        }
      },
      {
        seller: seller._id,
        name: 'Organic Cotton T-Shirt',
        description: 'Comfortable and sustainable organic cotton t-shirt in various colors.',
        category: 'Clothing',
        price: 24.99,
        stock: 3,
        images: [
          {
            url: 'https://images.pexels.com/photos/8532616/pexels-photo-8532616.jpeg?auto=compress&cs=tinysrgb&w=800',
            alt: 'Organic Cotton T-Shirt',
            isPrimary: true
          }
        ],
        status: 'active',
        lowStockThreshold: 5,
        analytics: {
          views: 890,
          sales: 67,
          revenue: 1674.33
        }
      },
      {
        seller: seller._id,
        name: 'Stainless Steel Water Bottle',
        description: 'Durable and eco-friendly stainless steel water bottle with temperature retention.',
        category: 'Home & Garden',
        price: 18.99,
        stock: 0,
        images: [
          {
            url: 'https://images.pexels.com/photos/4246119/pexels-photo-4246119.jpeg?auto=compress&cs=tinysrgb&w=800',
            alt: 'Stainless Steel Water Bottle',
            isPrimary: true
          }
        ],
        status: 'sold-out',
        analytics: {
          views: 445,
          sales: 156,
          revenue: 2962.44
        }
      },
      {
        seller: seller._id,
        name: 'LED Desk Lamp',
        description: 'Modern LED desk lamp with adjustable brightness and color temperature.',
        category: 'Home & Garden',
        price: 34.99,
        stock: 12,
        images: [
          {
            url: 'https://images.pexels.com/photos/1112598/pexels-photo-1112598.jpeg?auto=compress&cs=tinysrgb&w=800',
            alt: 'LED Desk Lamp',
            isPrimary: true
          }
        ],
        status: 'active',
        analytics: {
          views: 678,
          sales: 34,
          revenue: 1189.66
        }
      }
    ]);

    console.log('Created products');

    // Create orders
    const orders = await Order.create([
      {
        seller: seller._id,
        customer: {
          name: 'Sarah Johnson',
          email: 'sarah@example.com',
          phone: '+1 (555) 987-6543'
        },
        items: [
          {
            product: products[0]._id,
            name: products[0].name,
            price: products[0].price,
            quantity: 1,
            image: products[0].images[0].url
          }
        ],
        pricing: {
          subtotal: 79.99,
          tax: 6.40,
          shipping: 5.99,
          total: 92.38
        },
        status: 'shipped',
        paymentStatus: 'paid',
        paymentMethod: 'credit_card',
        shipping: {
          address: {
            firstName: 'Sarah',
            lastName: 'Johnson',
            address1: '123 Main St',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'USA'
          },
          tracking: {
            number: 'TRK123456789',
            carrier: 'UPS',
            status: 'in_transit'
          }
        }
      },
      {
        seller: seller._id,
        customer: {
          name: 'Mike Davis',
          email: 'mike@example.com'
        },
        items: [
          {
            product: products[1]._id,
            name: products[1].name,
            price: products[1].price,
            quantity: 2,
            image: products[1].images[0].url
          }
        ],
        pricing: {
          subtotal: 49.98,
          tax: 4.00,
          shipping: 3.99,
          total: 57.97
        },
        status: 'processing',
        paymentStatus: 'paid',
        paymentMethod: 'paypal',
        shipping: {
          address: {
            firstName: 'Mike',
            lastName: 'Davis',
            address1: '456 Oak Ave',
            city: 'Los Angeles',
            state: 'CA',
            zipCode: '90210',
            country: 'USA'
          }
        }
      }
    ]);

    console.log('Created orders');

    // Create reviews
    const reviews = await Review.create([
      {
        product: products[0]._id,
        seller: seller._id,
        customer: {
          name: 'Alex Thompson',
          email: 'alex@example.com'
        },
        order: orders[0]._id,
        rating: 5,
        title: 'Excellent headphones!',
        comment: 'Excellent sound quality and battery life. Highly recommend!',
        verified: true,
        status: 'approved'
      },
      {
        product: products[1]._id,
        seller: seller._id,
        customer: {
          name: 'Lisa Park',
          email: 'lisa@example.com'
        },
        rating: 4,
        comment: 'Very comfortable and good quality fabric. Size runs a bit small.',
        verified: true,
        status: 'approved'
      },
      {
        product: products[3]._id,
        seller: seller._id,
        customer: {
          name: 'Robert Kim',
          email: 'robert@example.com'
        },
        rating: 5,
        comment: 'Perfect lighting for my home office. Easy to adjust and great design.',
        verified: true,
        status: 'approved'
      }
    ]);

    console.log('Created reviews');

    // Create transactions
    const transactions = await Transaction.create([
      {
        seller: seller._id,
        order: orders[0]._id,
        type: 'sale',
        amount: 92.38,
        description: `Sale: Order ${orders[0].orderNumber}`,
        status: 'completed',
        paymentMethod: 'credit_card',
        netAmount: 89.61,
        fees: {
          platform: 2.77,
          total: 2.77
        },
        processedAt: new Date()
      },
      {
        seller: seller._id,
        type: 'fee',
        amount: -2.77,
        description: 'Platform fee (3%)',
        status: 'completed',
        netAmount: -2.77,
        fees: {
          platform: 2.77,
          total: 2.77
        },
        processedAt: new Date()
      },
      {
        seller: seller._id,
        order: orders[1]._id,
        type: 'sale',
        amount: 57.97,
        description: `Sale: Order ${orders[1].orderNumber}`,
        status: 'pending',
        paymentMethod: 'paypal',
        netAmount: 56.23,
        fees: {
          platform: 1.74,
          total: 1.74
        }
      }
    ]);

    console.log('Created transactions');

    console.log('Seed data created successfully!');
    console.log('Seller login: seller@example.com / password123');

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the seed function
connectDB().then(() => {
  seedData();
});