import {
  UserRole,
  CustomerType,
  AgentAvailability,
  PaymentType,
  RouteType,
  OrderStatus,
  NotificationStatus,
} from "./enums";

export interface AuthUserContext {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  isActive: boolean;
}

export interface UserWithProfile {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  phone: string | null;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  customerProfile?: {
    id: string;
    defaultPickupAddress: string | null;
    defaultPickupPinCode: string | null;
    companyName: string | null;
    customerType: CustomerType;
  } | null;
  deliveryAgentProfile?: {
    id: string;
    availability: AgentAvailability;
    currentZoneId: string | null;
    maxConcurrentOrders: number;
    vehicleType: string | null;
    vehicleNumber: string | null;
    activeDeliveryCount: number;
  } | null;
}

export interface CalculateQuoteInput {
  pickupAddress: string;
  pickupPinCode: string;
  dropAddress: string;
  dropPinCode: string;
  packageLength: number;
  packageBreadth: number;
  packageHeight: number;
  actualWeight: number;
  customerType?: CustomerType;
  paymentType?: PaymentType;
  codAmount?: number;
}

export interface QuoteBreakdown {
  pickupZone: {
    id: string;
    code: string;
    name: string;
  };
  dropZone: {
    id: string;
    code: string;
    name: string;
  };
  routeType: RouteType;
  customerType: CustomerType;
  paymentType: PaymentType;
  actualWeight: number;
  volumetricWeight: number;
  chargeableWeight: number;
  rateCardId: string;
  rateCardName: string;
  weightSlabId: string;
  deliveryCharge: number;
  codSurcharge: number;
  totalCharge: number;
  currency: string;
}

export interface CustomerDashboardData {
  overview: {
    totalOrders: number;
    activeOrders: number;
    deliveredOrders: number;
    failedOrders: number;
    cancelledOrders: number;
    unreadNotificationsCount: number;
  };
  activeDeliveries: any[];
  recentOrders: any[];
}

export interface AgentDashboardData {
  profile: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    availability: AgentAvailability;
    currentZoneId: string | null;
    activeDeliveryCount: number;
    maxConcurrentOrders: number;
    capacityRemaining: number;
    atCapacity: boolean;
    vehicleType: string | null;
    vehicleNumber: string | null;
  };
  activeOrders: any[];
  metrics: {
    today: {
      completed: number;
      failed: number;
    };
    allTime: {
      completed: number;
      failed: number;
    };
    successRate: number;
  };
}

export interface AdminDashboardData {
  overview: {
    totalOrders: number;
    activeOrders: number;
    deliveredOrders: number;
    failedOrders: number;
    cancelledOrders: number;
  };
  deliveryMetrics: {
    completedToday: number;
    failedToday: number;
    successRate: number;
  };
  agents: {
    total: number;
    available: number;
    busy: number;
    offline: number;
    atCapacity: number;
  };
  financials: {
    totalOrderValue: number;
    deliveredOrderValue: number;
    codExpectedValue: number;
  };
  ordersByStatus: Array<{
    status: string;
    count: number;
  }>;
  recentOrders: any[];
  recentFailures: any[];
}
