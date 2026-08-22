import {
  UserRole,
  CustomerType,
  AgentAvailability,
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
