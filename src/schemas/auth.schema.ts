import { z } from "zod";
import { UserRole, CustomerType, AgentAvailability } from "@/types/enums";

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  customerType: z.nativeEnum(CustomerType).default(CustomerType.B2C),
  defaultPickupAddress: z.string().optional(),
  defaultPickupPinCode: z.string().regex(/^\d{6}$/, "PIN code must be a 6-digit number").optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const syncUserSchema = z.object({
  id: z.string().uuid("Invalid user UUID"),
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required"),
  role: z.nativeEnum(UserRole).default(UserRole.CUSTOMER),
  phone: z.string().optional().nullable(),
  emailVerified: z.boolean().optional().default(false),
  customerType: z.nativeEnum(CustomerType).optional(),
  companyName: z.string().optional().nullable(),
  defaultPickupAddress: z.string().optional().nullable(),
  defaultPickupPinCode: z.string().optional().nullable(),
  agentAvailability: z.nativeEnum(AgentAvailability).optional(),
  currentZoneId: z.string().uuid().optional().nullable(),
  maxConcurrentOrders: z.number().int().positive().optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional().nullable(),
  companyName: z.string().optional().nullable(),
  defaultPickupAddress: z.string().optional().nullable(),
  defaultPickupPinCode: z.string().regex(/^\d{6}$/, "PIN code must be a 6-digit number").optional().nullable(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type SyncUserInput = z.infer<typeof syncUserSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
