// User types
export interface User {
  id: string;
  email: string;
  full_name: string;
  document: string; // CPF or CNPJ
  phone: string;
  created_at: string;
  status: 'active' | 'inactive' | 'pending';
}

// Transaction types
export type TransactionStatus = 'pending' | 'approved' | 'cancelled' | 'refunded';
export type PaymentMethod = 'pix';

export interface Transaction {
  id: string;
  order_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  amount: number;
  fee: number;
  net_amount: number;
  status: TransactionStatus;
  payment_method: PaymentMethod;
  created_at: string;
  updated_at: string;
  pix_code?: string;
  pix_qr_code?: string;
}

// Withdrawal types
export type WithdrawalStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Withdrawal {
  id: string;
  recipient_name: string;
  document: string;
  pix_key: string;
  amount: number;
  fee: number;
  total: number;
  status: WithdrawalStatus;
  created_at: string;
}

// Product types
export interface OrderBump {
  id: string;
  name: string;
  value: number;
  status: 'active' | 'inactive';
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  status: 'active' | 'inactive';
  type: 'digital' | 'physical';
  checkout_url: string;
  sold_count: number;
  order_bumps: OrderBump[];
  created_at: string;
}

// Webhook types
export type WebhookEvent = 'payment_pending' | 'payment_approved' | 'payment_cancelled';

export interface Webhook {
  id: string;
  url: string;
  events: WebhookEvent[];
  status: 'active' | 'inactive';
  created_at: string;
}

// API Credentials
export interface ApiCredential {
  id: string;
  token: string;
  status: 'active' | 'revoked';
  created_at: string;
}

// Dashboard stats
export interface DashboardStats {
  available_balance: number;
  withdrawable_balance: number;
  total_revenue: number;
  total_approved_sales: number;
  pending_amount: number;
}

// Chart data
export interface ChartDataPoint {
  month: string;
  sales: number;
  conversions?: number;
}

// Fee configuration
export interface FeeConfig {
  pix_in_percentage: number;
  pix_in_fixed: number;
  pix_out_fixed: number;
  max_pix_transaction: number;
}
