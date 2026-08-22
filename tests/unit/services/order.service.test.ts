import { describe, it, expect, vi, beforeEach } from "vitest";
import { OrderService } from "@/services/order/order.service";
import { OrderRepository } from "@/repositories/order.repository";
import { UserRepository } from "@/repositories/user.repository";
import { QuoteService } from "@/services/quote/quote.service";
import { RateCardRepository } from "@/repositories/rate-card.repository";
import { CodSurchargeRepository } from "@/repositories/cod-surcharge.repository";
import { CustomerType, OrderStatus, PaymentType, RouteType, UserRole } from "@/types/enums";
import { NotFoundError, ForbiddenError, ValidationError } from "@/lib/errors/app-error";

describe("OrderService", () => {
  let orderService: OrderService;
  let mockOrderRepo: {
    createOrderWithPricingSnapshot: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    findByOrderNumber: ReturnType<typeof vi.fn>;
    listCustomerOrders: ReturnType<typeof vi.fn>;
    listAdminOrders: ReturnType<typeof vi.fn>;
    updateOrderStatus: ReturnType<typeof vi.fn>;
  };
  let mockUserRepo: {
    findById: ReturnType<typeof vi.fn>;
  };
  let mockQuoteService: {
    calculateQuote: ReturnType<typeof vi.fn>;
  };
  let mockRateCardRepo: {
    findById: ReturnType<typeof vi.fn>;
  };
  let mockCodRepo: {
    findActiveRule: ReturnType<typeof vi.fn>;
  };

  const sampleCustomerId = "cust-1234-uuid";
  const sampleCustomer = {
    id: sampleCustomerId,
    email: "customer@example.com",
    name: "Anita Sharma",
    role: UserRole.CUSTOMER,
    isActive: true,
    customerProfile: {
      customerType: CustomerType.B2C,
    },
  };

  const sampleQuoteResult = {
    pickupZone: { id: "z-north", code: "ZONE-NORTH", name: "North" },
    dropZone: { id: "z-south", code: "ZONE-SOUTH", name: "South" },
    routeType: RouteType.INTER_ZONE,
    customerType: CustomerType.B2C,
    paymentType: PaymentType.COD,
    actualWeight: 1.2,
    volumetricWeight: 0.6,
    chargeableWeight: 1.5,
    rateCardId: "rc-1",
    rateCardName: "Inter B2C Card",
    weightSlabId: "slab-1",
    deliveryCharge: 112.5,
    codSurcharge: 50.0,
    totalCharge: 162.5,
    currency: "INR",
  };

  beforeEach(() => {
    mockOrderRepo = {
      createOrderWithPricingSnapshot: vi.fn(),
      findById: vi.fn(),
      findByOrderNumber: vi.fn(),
      listCustomerOrders: vi.fn(),
      listAdminOrders: vi.fn(),
      updateOrderStatus: vi.fn(),
    };
    mockUserRepo = {
      findById: vi.fn(),
    };
    mockQuoteService = {
      calculateQuote: vi.fn(),
    };
    mockRateCardRepo = {
      findById: vi.fn(),
    };
    mockCodRepo = {
      findActiveRule: vi.fn(),
    };

    orderService = new OrderService(
      mockOrderRepo as unknown as OrderRepository,
      mockUserRepo as unknown as UserRepository,
      mockQuoteService as unknown as QuoteService,
      mockRateCardRepo as unknown as RateCardRepository,
      mockCodRepo as unknown as CodSurchargeRepository
    );
  });

  describe("Customer Order Creation", () => {
    it("creates an order transactionally using trusted CustomerProfile and QuoteService", async () => {
      mockUserRepo.findById.mockResolvedValue(sampleCustomer);
      mockQuoteService.calculateQuote.mockResolvedValue(sampleQuoteResult);
      mockRateCardRepo.findById.mockResolvedValue({
        id: "rc-1",
        name: "Inter B2C Card",
        weightSlabs: [
          { id: "slab-1", minWeight: 0, maxWeight: 5, basePrice: 100, perKgRate: 25 },
        ],
      });
      mockCodRepo.findActiveRule.mockResolvedValue({
        id: "cod-1",
        surchargeType: "PERCENTAGE",
        surchargeValue: 2.5,
      });

      mockOrderRepo.findByOrderNumber.mockResolvedValue(null);
      mockOrderRepo.createOrderWithPricingSnapshot.mockImplementation(async (orderData, snap, track) => ({
        id: "order-uuid-1",
        ...orderData,
        pricingSnapshot: snap,
        trackingEvents: [track],
      }));

      const input = {
        pickupAddress: "Flat 402, Sunshine Apts, Connaught Place",
        pickupPinCode: "110001",
        dropAddress: "Flat 101, Indiranagar",
        dropPinCode: "560038",
        packageLength: 20,
        packageBreadth: 15,
        packageHeight: 10,
        actualWeight: 1.2,
        paymentType: PaymentType.COD,
      };

      const createdOrder = await orderService.createCustomerOrder(sampleCustomerId, input);

      expect(mockQuoteService.calculateQuote).toHaveBeenCalledWith(
        expect.objectContaining({
          customerType: CustomerType.B2C, // Trusted from customerProfile
          paymentType: PaymentType.COD,
        })
      );

      expect(mockOrderRepo.createOrderWithPricingSnapshot).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: sampleCustomerId,
          customerType: CustomerType.B2C,
          status: OrderStatus.CREATED,
          totalCharge: 162.5,
        }),
        expect.objectContaining({
          rateCardId: "rc-1",
          totalCharge: 162.5,
        }),
        expect.objectContaining({
          actorId: sampleCustomerId,
          actorRole: UserRole.CUSTOMER,
        })
      );

      expect(createdOrder.id).toBe("order-uuid-1");
      expect(createdOrder.orderNumber).toMatch(/^LMX-\d{8}-[A-F0-9]{6}$/);
    });

    it("throws NotFoundError if customer profile does not exist", async () => {
      mockUserRepo.findById.mockResolvedValue(null);

      await expect(
        orderService.createCustomerOrder("non-existent-user", {
          pickupAddress: "Flat 402, Sunshine Apts",
          pickupPinCode: "110001",
          dropAddress: "Flat 101, Indiranagar",
          dropPinCode: "560038",
          packageLength: 20,
          packageBreadth: 15,
          packageHeight: 10,
          actualWeight: 1.2,
          paymentType: PaymentType.PREPAID,
        })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("Customer Order Access & Ownership", () => {
    it("allows customer to access their own order", async () => {
      mockOrderRepo.findById.mockResolvedValue({
        id: "order-1",
        customerId: sampleCustomerId,
        orderNumber: "LMX-20260822-ABC123",
      });

      const order = await orderService.getCustomerOrderById(sampleCustomerId, "order-1");
      expect(order.id).toBe("order-1");
    });

    it("throws ForbiddenError when customer tries to access another customer's order", async () => {
      mockOrderRepo.findById.mockResolvedValue({
        id: "order-1",
        customerId: "other-customer-uuid",
        orderNumber: "LMX-20260822-ABC123",
      });

      await expect(
        orderService.getCustomerOrderById(sampleCustomerId, "order-1")
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe("Order Status Transitions", () => {
    const adminUser = {
      id: "admin-1",
      email: "admin@lastmilex.com",
      name: "Admin",
      role: UserRole.ADMIN,
      isActive: true,
    };

    it("updates status and creates tracking event for valid transition", async () => {
      mockOrderRepo.findById.mockResolvedValue({
        id: "order-1",
        customerId: sampleCustomerId,
        status: OrderStatus.CREATED,
      });

      mockOrderRepo.updateOrderStatus.mockResolvedValue({
        id: "order-1",
        status: OrderStatus.CONFIRMED,
      });

      const result = await orderService.updateOrderStatus(
        "order-1",
        OrderStatus.CONFIRMED,
        adminUser,
        "Customer confirmed order"
      );

      expect(mockOrderRepo.updateOrderStatus).toHaveBeenCalledWith(
        "order-1",
        OrderStatus.CREATED,
        OrderStatus.CONFIRMED,
        expect.objectContaining({
          actorId: "admin-1",
          actorRole: UserRole.ADMIN,
        })
      );
      expect(result.status).toBe(OrderStatus.CONFIRMED);
    });

    it("throws ValidationError for illegal status transition", async () => {
      mockOrderRepo.findById.mockResolvedValue({
        id: "order-1",
        customerId: sampleCustomerId,
        status: OrderStatus.CREATED,
      });

      await expect(
        orderService.updateOrderStatus(
          "order-1",
          OrderStatus.DELIVERED, // Illegal jump from CREATED to DELIVERED
          adminUser
        )
      ).rejects.toThrow(ValidationError);
    });
  });
});
