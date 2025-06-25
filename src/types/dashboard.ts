export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  image: string;
  status: 'active' | 'draft' | 'sold-out';
  views: number;
  sales: number;
  createdAt: string;
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  products: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: string;
  orderDate: string;
  trackingNumber?: string;
}

export interface Review {
  id: string;
  customerName: string;
  productName: string;
  rating: number;
  comment: string;
  date: string;
  verified: boolean;
}

export interface Transaction {
  id: string;
  type: 'sale' | 'refund' | 'fee';
  amount: number;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
}

export interface SalesData {
  date: string;
  sales: number;
  orders: number;
  revenue: number;
}

export interface DashboardStats {
  totalSales: number;
  activeListings: number;
  pendingOrders: number;
  totalRevenue: number;
  monthlyGrowth: number;
  lowStockItems: number;
}