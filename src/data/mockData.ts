import { Product, Order, Review, Transaction, SalesData, DashboardStats } from '../types/dashboard';

export const mockStats: DashboardStats = {
  totalSales: 1247,
  activeListings: 89,
  pendingOrders: 23,
  totalRevenue: 45680.50,
  monthlyGrowth: 12.5,
  lowStockItems: 7
};

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Wireless Bluetooth Headphones',
    price: 79.99,
    stock: 45,
    category: 'Electronics',
    image: 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=400',
    status: 'active',
    views: 1250,
    sales: 23,
    createdAt: '2024-01-15'
  },
  {
    id: '2',
    name: 'Organic Cotton T-Shirt',
    price: 24.99,
    stock: 3,
    category: 'Clothing',
    image: 'https://images.pexels.com/photos/8532616/pexels-photo-8532616.jpeg?auto=compress&cs=tinysrgb&w=400',
    status: 'active',
    views: 890,
    sales: 67,
    createdAt: '2024-01-10'
  },
  {
    id: '3',
    name: 'Stainless Steel Water Bottle',
    price: 18.99,
    stock: 0,
    category: 'Home & Garden',
    image: 'https://images.pexels.com/photos/4246119/pexels-photo-4246119.jpeg?auto=compress&cs=tinysrgb&w=400',
    status: 'sold-out',
    views: 445,
    sales: 156,
    createdAt: '2024-01-05'
  },
  {
    id: '4',
    name: 'LED Desk Lamp',
    price: 34.99,
    stock: 12,
    category: 'Home & Garden',
    image: 'https://images.pexels.com/photos/1112598/pexels-photo-1112598.jpeg?auto=compress&cs=tinysrgb&w=400',
    status: 'active',
    views: 678,
    sales: 34,
    createdAt: '2024-01-20'
  }
];

export const mockOrders: Order[] = [
  {
    id: 'ORD-001',
    customerName: 'Sarah Johnson',
    customerEmail: 'sarah@example.com',
    products: [
      { id: '1', name: 'Wireless Bluetooth Headphones', quantity: 1, price: 79.99 }
    ],
    total: 79.99,
    status: 'shipped',
    shippingAddress: '123 Main St, New York, NY 10001',
    orderDate: '2024-01-25',
    trackingNumber: 'TRK123456789'
  },
  {
    id: 'ORD-002',
    customerName: 'Mike Davis',
    customerEmail: 'mike@example.com',
    products: [
      { id: '2', name: 'Organic Cotton T-Shirt', quantity: 2, price: 24.99 }
    ],
    total: 49.98,
    status: 'processing',
    shippingAddress: '456 Oak Ave, Los Angeles, CA 90210',
    orderDate: '2024-01-24'
  },
  {
    id: 'ORD-003',
    customerName: 'Emily Chen',
    customerEmail: 'emily@example.com',
    products: [
      { id: '4', name: 'LED Desk Lamp', quantity: 1, price: 34.99 }
    ],
    total: 34.99,
    status: 'pending',
    shippingAddress: '789 Pine St, Chicago, IL 60601',
    orderDate: '2024-01-23'
  }
];

export const mockReviews: Review[] = [
  {
    id: '1',
    customerName: 'Alex Thompson',
    productName: 'Wireless Bluetooth Headphones',
    rating: 5,
    comment: 'Excellent sound quality and battery life. Highly recommend!',
    date: '2024-01-20',
    verified: true
  },
  {
    id: '2',
    customerName: 'Lisa Park',
    productName: 'Organic Cotton T-Shirt',
    rating: 4,
    comment: 'Very comfortable and good quality fabric. Size runs a bit small.',
    date: '2024-01-18',
    verified: true
  },
  {
    id: '3',
    customerName: 'Robert Kim',
    productName: 'LED Desk Lamp',
    rating: 5,
    comment: 'Perfect lighting for my home office. Easy to adjust and great design.',
    date: '2024-01-15',
    verified: true
  }
];

export const mockTransactions: Transaction[] = [
  {
    id: 'TXN-001',
    type: 'sale',
    amount: 79.99,
    description: 'Sale: Wireless Bluetooth Headphones',
    date: '2024-01-25',
    status: 'completed'
  },
  {
    id: 'TXN-002',
    type: 'fee',
    amount: -2.40,
    description: 'Platform fee (3%)',
    date: '2024-01-25',
    status: 'completed'
  },
  {
    id: 'TXN-003',
    type: 'sale',
    amount: 49.98,
    description: 'Sale: Organic Cotton T-Shirt (x2)',
    date: '2024-01-24',
    status: 'pending'
  }
];

export const mockSalesData: SalesData[] = [
  { date: '2024-01-19', sales: 8, orders: 12, revenue: 420.50 },
  { date: '2024-01-20', sales: 12, orders: 18, revenue: 680.25 },
  { date: '2024-01-21', sales: 6, orders: 9, revenue: 340.75 },
  { date: '2024-01-22', sales: 15, orders: 22, revenue: 890.30 },
  { date: '2024-01-23', sales: 10, orders: 14, revenue: 520.80 },
  { date: '2024-01-24', sales: 18, orders: 25, revenue: 1120.60 },
  { date: '2024-01-25', sales: 14, orders: 19, revenue: 750.45 }
];