import { orderRepository, OrderRepository } from "@/repositories/order.repository";
import { userRepository, UserRepository } from "@/repositories/user.repository";
import { quoteService, QuoteService } from "@/services/quote/quote.service";
import { rateCardRepository, RateCardRepository } from "@/repositories/rate-card.repository";
import { codSurchargeRepository, CodSurchargeRepository } from "@/repositories/cod-surcharge.repository";
import { generateOrderNumber } from "@/lib/orders/order-number";
import { assertValidTransition } from "@/lib/orders/order-state-machine";
import { CreateOrderInput, AdminCreateOrderInput, OrderQueryInput } from "@/schemas/order.schema";
import { CustomerType, OrderStatus, PaymentType, UserRole } from "@/types/enums";
import { Prisma } from "@prisma/client";
import { AuthUserContext } from "@/types/domain";
import { NotFoundError, ForbiddenError, ConflictError } from "@/lib/errors/app-error";

export class OrderService {
  constructor(
    private readonly orderRepo: OrderRepository = orderRepository,
    private readonly userRepo: UserRepository = userRepository,
    private readonly quoteServiceInstance: QuoteService = quoteService,
    private readonly rateCardRepo: RateCardRepository = rateCardRepository,
    private readonly codRepo: CodSurchargeRepository = codSurchargeRepository
  ) {}

  async createCustomerOrder(customerId: string, input: CreateOrderInput) {
    // 1. Fetch authenticated user and customer profile to derive trusted customerType
    const user = await this.userRepo.findById(customerId);
    if (!user) {
      throw new NotFoundError(`Customer with ID '${customerId}' not found`);
    }

    const trustedCustomerType = user.customerProfile?.customerType ?? CustomerType.B2C;

    // 2. Reuse QuoteService as the single source of truth for rate calculation
    const quote = await this.quoteServiceInstance.calculateQuote({
      pickupAddress: input.pickupAddress,
      pickupPinCode: input.pickupPinCode,
      dropAddress: input.dropAddress,
      dropPinCode: input.dropPinCode,
      packageLength: input.packageLength,
      packageBreadth: input.packageBreadth,
      packageHeight: input.packageHeight,
      actualWeight: input.actualWeight,
      customerType: trustedCustomerType,
      paymentType: input.paymentType ?? PaymentType.PREPAID,
    });

    // 3. Fetch referenced rate card details for the immutable pricing snapshot
    const rateCard = await this.rateCardRepo.findById(quote.rateCardId);
    const weightSlab = rateCard?.weightSlabs.find((s) => s.id === quote.weightSlabId);
    const codRule =
      quote.paymentType === PaymentType.COD
        ? await this.codRepo.findActiveRule(quote.routeType)
        : null;

    // 4. Generate unique order number with collision safety retry
    let orderNumber = generateOrderNumber();
    let attempts = 0;
    while (attempts < 3) {
      const existing = await this.orderRepo.findByOrderNumber(orderNumber);
      if (!existing) break;
      orderNumber = generateOrderNumber();
      attempts++;
    }

    // 5. Execute transactional creation
    return this.orderRepo.createOrderWithPricingSnapshot(
      {
        orderNumber,
        customerId,
        customerType: trustedCustomerType,
        status: OrderStatus.CREATED,
        pickupAddress: input.pickupAddress,
        pickupPinCode: input.pickupPinCode,
        pickupZoneId: quote.pickupZone.id,
        dropAddress: input.dropAddress,
        dropPinCode: input.dropPinCode,
        dropZoneId: quote.dropZone.id,
        routeType: quote.routeType,
        packageLength: input.packageLength,
        packageBreadth: input.packageBreadth,
        packageHeight: input.packageHeight,
        actualWeight: input.actualWeight,
        volumetricWeight: quote.volumetricWeight,
        chargeableWeight: quote.chargeableWeight,
        paymentType: input.paymentType ?? PaymentType.PREPAID,
        baseCharge: quote.deliveryCharge,
        codSurcharge: quote.codSurcharge,
        totalCharge: quote.totalCharge,
        scheduledDeliveryDate: input.scheduledDeliveryDate ?? null,
        notes: input.notes ?? null,
        createdById: customerId,
      },
      {
        rateCardId: quote.rateCardId,
        rateCardName: quote.rateCardName,
        customerType: trustedCustomerType,
        routeType: quote.routeType,
        weightSlabId: quote.weightSlabId,
        minWeight: weightSlab ? Number(weightSlab.minWeight) : 0,
        maxWeight: weightSlab ? Number(weightSlab.maxWeight) : 0,
        basePrice: weightSlab ? Number(weightSlab.basePrice) : 0,
        perKgRate: weightSlab ? Number(weightSlab.perKgRate) : 0,
        chargeableWeight: quote.chargeableWeight,
        baseCharge: quote.deliveryCharge,
        codSurchargeRuleId: codRule?.id ?? null,
        codSurchargeType: codRule?.surchargeType ?? null,
        codSurchargeValue: codRule ? Number(codRule.surchargeValue) : null,
        codSurchargeAmount: quote.codSurcharge,
        totalCharge: quote.totalCharge,
        snapshotData: JSON.parse(
          JSON.stringify({
            quote,
            rateCard: rateCard ? { id: rateCard.id, name: rateCard.name } : null,
            weightSlab: weightSlab
              ? {
                  id: weightSlab.id,
                  minWeight: Number(weightSlab.minWeight),
                  maxWeight: Number(weightSlab.maxWeight),
                }
              : null,
            codRule: codRule
              ? {
                  id: codRule.id,
                  type: codRule.surchargeType,
                  value: Number(codRule.surchargeValue),
                }
              : null,
          })
        ) as Prisma.InputJsonValue,
      },
      {
        actorId: customerId,
        actorRole: UserRole.CUSTOMER,
        note: "Order created by customer",
      }
    );
  }

  async createAdminOrder(adminId: string, input: AdminCreateOrderInput) {
    // 1. Fetch customer and verify profile
    const user = await this.userRepo.findById(input.customerId);
    if (!user) {
      throw new NotFoundError(`Customer with ID '${input.customerId}' not found`);
    }

    const trustedCustomerType = user.customerProfile?.customerType ?? CustomerType.B2C;

    // 2. Calculate quote
    const quote = await this.quoteServiceInstance.calculateQuote({
      pickupAddress: input.pickupAddress,
      pickupPinCode: input.pickupPinCode,
      dropAddress: input.dropAddress,
      dropPinCode: input.dropPinCode,
      packageLength: input.packageLength,
      packageBreadth: input.packageBreadth,
      packageHeight: input.packageHeight,
      actualWeight: input.actualWeight,
      customerType: trustedCustomerType,
      paymentType: input.paymentType ?? PaymentType.PREPAID,
    });

    const rateCard = await this.rateCardRepo.findById(quote.rateCardId);
    const weightSlab = rateCard?.weightSlabs.find((s) => s.id === quote.weightSlabId);
    const codRule =
      quote.paymentType === PaymentType.COD
        ? await this.codRepo.findActiveRule(quote.routeType)
        : null;

    let orderNumber = generateOrderNumber();
    let attempts = 0;
    while (attempts < 3) {
      const existing = await this.orderRepo.findByOrderNumber(orderNumber);
      if (!existing) break;
      orderNumber = generateOrderNumber();
      attempts++;
    }

    return this.orderRepo.createOrderWithPricingSnapshot(
      {
        orderNumber,
        customerId: input.customerId,
        customerType: trustedCustomerType,
        status: OrderStatus.CREATED,
        pickupAddress: input.pickupAddress,
        pickupPinCode: input.pickupPinCode,
        pickupZoneId: quote.pickupZone.id,
        dropAddress: input.dropAddress,
        dropPinCode: input.dropPinCode,
        dropZoneId: quote.dropZone.id,
        routeType: quote.routeType,
        packageLength: input.packageLength,
        packageBreadth: input.packageBreadth,
        packageHeight: input.packageHeight,
        actualWeight: input.actualWeight,
        volumetricWeight: quote.volumetricWeight,
        chargeableWeight: quote.chargeableWeight,
        paymentType: input.paymentType ?? PaymentType.PREPAID,
        baseCharge: quote.deliveryCharge,
        codSurcharge: quote.codSurcharge,
        totalCharge: quote.totalCharge,
        scheduledDeliveryDate: input.scheduledDeliveryDate ?? null,
        notes: input.notes ?? null,
        createdById: adminId,
      },
      {
        rateCardId: quote.rateCardId,
        rateCardName: quote.rateCardName,
        customerType: trustedCustomerType,
        routeType: quote.routeType,
        weightSlabId: quote.weightSlabId,
        minWeight: weightSlab ? Number(weightSlab.minWeight) : 0,
        maxWeight: weightSlab ? Number(weightSlab.maxWeight) : 0,
        basePrice: weightSlab ? Number(weightSlab.basePrice) : 0,
        perKgRate: weightSlab ? Number(weightSlab.perKgRate) : 0,
        chargeableWeight: quote.chargeableWeight,
        baseCharge: quote.deliveryCharge,
        codSurchargeRuleId: codRule?.id ?? null,
        codSurchargeType: codRule?.surchargeType ?? null,
        codSurchargeValue: codRule ? Number(codRule.surchargeValue) : null,
        codSurchargeAmount: quote.codSurcharge,
        totalCharge: quote.totalCharge,
        snapshotData: JSON.parse(
          JSON.stringify({
            quote,
            rateCard: rateCard ? { id: rateCard.id, name: rateCard.name } : null,
            weightSlab: weightSlab
              ? {
                  id: weightSlab.id,
                  minWeight: Number(weightSlab.minWeight),
                  maxWeight: Number(weightSlab.maxWeight),
                }
              : null,
            codRule: codRule
              ? {
                  id: codRule.id,
                  type: codRule.surchargeType,
                  value: Number(codRule.surchargeValue),
                }
              : null,
          })
        ) as Prisma.InputJsonValue,
      },
      {
        actorId: adminId,
        actorRole: UserRole.ADMIN,
        note: "Order created by administrator on behalf of customer",
      }
    );
  }

  async getCustomerOrders(customerId: string, query?: OrderQueryInput) {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 20;
    const skip = (page - 1) * limit;

    const { total, orders } = await this.orderRepo.listCustomerOrders(customerId, {
      status: query?.status,
      skip,
      take: limit,
    });

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getCustomerOrderById(customerId: string, orderId: string) {
    const order = await this.orderRepo.findById(orderId);
    if (!order) {
      throw new NotFoundError(`Order with ID '${orderId}' not found`);
    }

    if (order.customerId !== customerId) {
      throw new ForbiddenError("You are not authorized to view this order");
    }

    return order;
  }

  async getAdminOrders(query?: OrderQueryInput) {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 20;
    const skip = (page - 1) * limit;

    const { total, orders } = await this.orderRepo.listAdminOrders({
      status: query?.status,
      customerId: query?.customerId,
      orderNumber: query?.orderNumber,
      dateFrom: query?.dateFrom,
      dateTo: query?.dateTo,
      skip,
      take: limit,
    });

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getAdminOrderById(orderId: string) {
    const order = await this.orderRepo.findById(orderId);
    if (!order) {
      throw new NotFoundError(`Order with ID '${orderId}' not found`);
    }
    return order;
  }

  async updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    actorContext: AuthUserContext,
    note?: string | null
  ) {
    const order = await this.orderRepo.findById(orderId);
    if (!order) {
      throw new NotFoundError(`Order with ID '${orderId}' not found`);
    }

    // Ownership check for customers
    if (actorContext.role === UserRole.CUSTOMER && order.customerId !== actorContext.id) {
      throw new ForbiddenError("You are not authorized to update this order");
    }

    // Validate state transition
    assertValidTransition(order.status, newStatus, actorContext.role);

    return this.orderRepo.updateOrderStatus(order.id, order.status, newStatus, {
      actorId: actorContext.id,
      actorRole: actorContext.role,
      note: note ?? `Status updated to ${newStatus}`,
    });
  }
}

export const orderService = new OrderService();
