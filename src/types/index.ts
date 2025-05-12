// Customer Types
export interface Customer {
  _id: string;
  name: string;
  email: string;
  phone: string;
  totalSpend: number;
  lastOrderDate: Date;
  visitCount: number;
  createdAt: Date;
}

// Order Types
export interface Order {
  _id: string;
  customerId: string;
  orderValue: number;
  date: Date;
  productList: string[];
}

// Campaign Types
export interface Rule {
  field: string;
  operator: string;
  value: string;
  logicGate?: string;
}

export interface Campaign {
  _id: string;
  name: string;
  audienceQuery: Rule[];
  createdAt: Date;
  summary?: string;
}

// Communication Log Types
export interface CommunicationLog {
  _id: string;
  campaignId: string;
  customerId: string;
  message: string;
  status: 'SENT' | 'FAILED' | 'PENDING';
  timestamp: Date;
}

// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  picture: string;
}