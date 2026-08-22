import { prisma } from "@/lib/prisma";
import {
  CustomerType,
  OrderStatus,
  PaymentType,
  RouteType,
  SurchargeType,
  UserRole,
  Prisma,
} from "@prisma/client";

export interface CreateOrderDbInput {
  orderNumber: string;
  customerId: string;
  customerType: CustomerType;
  status?: OrderStatus;
  pickupAddress: string;
  pickupPinCode: string;
  pickupZoneId: string;
  dropAddress: string;
  dropPinCode: string;
  dropZoneId: string;
  routeType: RouteType;
  packageLength: number;
  packageBreadth: number;
  packageHeight: number;
  actualWeight: number;
  volumetricWeight: number;
  chargeableWeight: number;
  paymentType: PaymentType;
  baseCharge: number;
  codSurcharge: number;
  totalCharge: number;
  scheduledDeliveryDate?: Date | null;
  notes?: string | null;
  createdById: string;
}

export interface CreatePricingSnapshotDbInput {
  rateCardId: string;
  rateCardName: string;
  customerType: CustomerType;
  routeType: RouteType;
  weightSlabId: string;
  minWeight: number;
  maxWeight: number;
  basePrice: number;
  perKgRate: number;
  chargeableWeight: number;
  baseCharge: number;
  codSurchargeRuleId?: string | null;
  codSurchargeType?: SurchargeType | null;
  codSurchargeValue?: number | null;
  codSurchargeAmount: number;
  totalCharge: number;
  snapshotData: Prisma.InputJsonValue;
}

export interface CreateInitialTrackingDbInput {
  actorId: string;
  actorRole: UserRole;
  note?: string | null;
  metadata?: Prisma.InputJsonValue;
}

export class OrderRepository {
  async createOrderWithPricingSnapshot(
    orderData: CreateOrderDbInput,
    snapshotData: CreatePricingSnapshotDbInput,
    initialTracking: CreateInitialTrackingDbInput
  ) {
    return prisma.$transaction(async (tx) => {
      // 1. Create Order
      const initialStatus = orderData.status ?? OrderStatus.CREATED;
      const order = await tx.order.create({
        data: {
          orderNumber: orderData.orderNumber,
          customerId: orderData.customerId,
          customerType: orderData.customerType,
          status: initialStatus,
          pickupAddress: orderData.pickupAddress,
          pickupPinCode: orderData.pickupPinCode,
          pickupZoneId: orderData.pickupZoneId,
          dropAddress: orderData.dropAddress,
          dropPinCode: orderData.dropPinCode,
          dropZoneId: orderData.dropZoneId,
          routeType: orderData.routeType,
          packageLength: orderData.packageLength,
          packageBreadth: orderData.packageBreadth,
          packageHeight: orderData.packageHeight,
          actualWeight: orderData.actualWeight,
          volumetricWeight: orderData.volumetricWeight,
          chargeableWeight: orderData.chargeableWeight,
          paymentType: orderData.paymentType,
          baseCharge: orderData.baseCharge,
          codSurcharge: orderData.codSurcharge,
          totalCharge: orderData.totalCharge,
          scheduledDeliveryDate: orderData.scheduledDeliveryDate ?? null,
          notes: orderData.notes ?? null,
          createdById: orderData.createdById,
        },
      });

      // 2. Create OrderPricingSnapshot
      const pricingSnapshot = await tx.orderPricingSnapshot.create({
        data: {
          orderId: order.id,
          rateCardId: snapshotData.rateCardId,
          rateCardName: snapshotData.rateCardName,
          customerType: snapshotData.customerType,
          routeType: snapshotData.routeType,
          weightSlabId: snapshotData.weightSlabId,
          minWeight: snapshotData.minWeight,
          maxWeight: snapshotData.maxWeight,
          basePrice: snapshotData.basePrice,
          perKgRate: snapshotData.perKgRate,
          chargeableWeight: snapshotData.chargeableWeight,
          baseCharge: snapshotData.baseCharge,
          codSurchargeRuleId: snapshotData.codSurchargeRuleId ?? null,
          codSurchargeType: snapshotData.codSurchargeType ?? null,
          codSurchargeValue: snapshotData.codSurchargeValue ?? null,
          codSurchargeAmount: snapshotData.codSurchargeAmount,
          totalCharge: snapshotData.totalCharge,
          snapshotData: snapshotData.snapshotData,
        },
      });

      // 3. Create initial OrderTrackingEvent
      const trackingEvent = await tx.orderTrackingEvent.create({
        data: {
          orderId: order.id,
          previousStatus: null,
          newStatus: initialStatus,
          actorId: initialTracking.actorId,
          actorRole: initialTracking.actorRole,
          note: initialTracking.note ?? "Order created",
          metadata: initialTracking.metadata ?? undefined,
        },
      });

      return {
        ...order,
        pricingSnapshot,
        trackingEvents: [trackingEvent],
      };
    });
  }

  async findById(id: string) {
    return prisma.order.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
          },
        },
        pickupZone: true,
        dropZone: true,
        pricingSnapshot: true,
        trackingEvents: {
          orderBy: { timestamp: "asc" },
          include: {
            actor: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        },
      },
    });
  }

  async findByOrderNumber(orderNumber: string) {
    return prisma.order.findUnique({
      where: { orderNumber },
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
          },
        },
        pickupZone: true,
        dropZone: true,
        pricingSnapshot: true,
        trackingEvents: {
          orderBy: { timestamp: "asc" },
        },
      },
    });
  }

  async listCustomerOrders(
    customerId: string,
    params?: {
      status?: OrderStatus;
      skip?: number;
      take?: number;
    }
  ) {
    const where: Prisma.OrderWhereInput = {
      customerId,
      ...(params?.status ? { status: params.status } : {}),
    };

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        skip: params?.skip ?? 0,
        take: params?.take ?? 20,
        orderBy: { createdAt: "desc" },
        include: {
          pickupZone: true,
          dropZone: true,
          pricingSnapshot: true,
        },
      }),
    ]);

    return { total, orders };
  }

  async listAdminOrders(params?: {
    status?: OrderStatus;
    customerId?: string;
    orderNumber?: string;
    dateFrom?: Date;
    dateTo?: Date;
    skip?: number;
    take?: number;
  }) {
    const where: Prisma.OrderWhereInput = {
      ...(params?.status ? { status: params.status } : {}),
      ...(params?.customerId ? { customerId: params.customerId } : {}),
      ...(params?.orderNumber ? { orderNumber: { contains: params.orderNumber, mode: "insensitive" } } : {}),
      ...(params?.dateFrom || params?.dateTo
        ? {
            createdAt: {
              ...(params?.dateFrom ? { gte: params.dateFrom } : {}),
              ...(params?.dateTo ? { lte: params.dateTo } : {}),
            },
          }
        : {}),
    };

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        skip: params?.skip ?? 0,
        take: params?.take ?? 20,
        orderBy: { createdAt: "desc" },
        include: {
          customer: {
            select: {
              id: true,
              email: true,
              name: true,
              phone: true,
            },
          },
          pickupZone: true,
          dropZone: true,
          pricingSnapshot: true,
        },
      }),
    ]);

    return { total, orders };
  }

  async updateOrderStatus(
    orderId: string,
    previousStatus: OrderStatus,
    newStatus: OrderStatus,
    trackingEvent: {
      actorId: string;
      actorRole: UserRole;
      note?: string | null;
      metadata?: Prisma.InputJsonValue;
    }
  ) {
    return prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: newStatus,
        },
        include: {
          pricingSnapshot: true,
          pickupZone: true,
          dropZone: true,
        },
      });

      const newTrackingEvent = await tx.orderTrackingEvent.create({
        data: {
          orderId,
          previousStatus,
          newStatus,
          actorId: trackingEvent.actorId,
          actorRole: trackingEvent.actorRole,
          note: trackingEvent.note ?? null,
          metadata: trackingEvent.metadata ?? undefined,
        },
      });

      return {
        ...updatedOrder,
        newTrackingEvent,
      };
    });
  }
}

export const orderRepository = new OrderRepository();
