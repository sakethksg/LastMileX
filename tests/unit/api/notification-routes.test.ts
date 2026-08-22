import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as getUserNotifications } from "@/app/api/notifications/route";
import { GET as getUserNotificationById } from "@/app/api/notifications/[id]/route";
import { GET as getAdminNotifications } from "@/app/api/admin/notifications/route";
import { GET as getAdminNotificationById } from "@/app/api/admin/notifications/[id]/route";
import { POST as retryNotificationRoute } from "@/app/api/admin/notifications/[id]/retry/route";
import { requireAuth, requireRole } from "@/lib/auth/server-auth";
import { notificationService } from "@/services/notification/notification.service";
import { UserRole, NotificationStatus, NotificationEventType, NotificationType } from "@/types/enums";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors/app-error";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/server-auth", () => ({
  requireAuth: vi.fn(),
  requireRole: vi.fn(),
}));

vi.mock("@/services/notification/notification.service", () => ({
  notificationService: {
    getUserNotifications: vi.fn(),
    getUserNotificationById: vi.fn(),
    getAdminNotifications: vi.fn(),
    getAdminNotificationById: vi.fn(),
    retryNotification: vi.fn(),
  },
}));

describe("Notification API Routes", () => {
  const customerUser = {
    id: "cust-1",
    email: "customer@example.com",
    name: "Customer",
    role: UserRole.CUSTOMER,
    isActive: true,
  };

  const adminUser = {
    id: "admin-1",
    email: "admin@lastmilex.com",
    name: "Admin",
    role: UserRole.ADMIN,
    isActive: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function createMockRequest(url: string, method = "GET"): NextRequest {
    return new NextRequest(new URL(url, "http://localhost:3000"), {
      method,
      headers: { "content-type": "application/json" },
    });
  }

  it("GET /api/notifications returns user's notifications", async () => {
    vi.mocked(requireAuth).mockResolvedValue(customerUser);
    vi.mocked(notificationService.getUserNotifications).mockResolvedValue({
      notifications: [{ id: "notif-1", subject: "Order Confirmed" } as any],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });

    const req = createMockRequest("http://localhost:3000/api/notifications?page=1");
    const res = await getUserNotifications(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toHaveLength(1);
  });

  it("GET /api/notifications/[id] returns notification for owner", async () => {
    vi.mocked(requireAuth).mockResolvedValue(customerUser);
    vi.mocked(notificationService.getUserNotificationById).mockResolvedValue({
      id: "notif-1",
      userId: customerUser.id,
      subject: "Order Confirmed",
    } as any);

    const req = createMockRequest("http://localhost:3000/api/notifications/notif-1");
    const res = await getUserNotificationById(req, { params: Promise.resolve({ id: "notif-1" }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.id).toBe("notif-1");
  });

  it("GET /api/admin/notifications rejects non-admin with 403", async () => {
    vi.mocked(requireRole).mockRejectedValue(new ForbiddenError("Access denied"));

    const req = createMockRequest("http://localhost:3000/api/admin/notifications");
    const res = await getAdminNotifications(req);
    expect(res.status).toBe(403);
  });

  it("POST /api/admin/notifications/[id]/retry retries failed notification", async () => {
    vi.mocked(requireRole).mockResolvedValue(adminUser);
    vi.mocked(notificationService.retryNotification).mockResolvedValue({
      id: "notif-1",
      status: NotificationStatus.SENT,
    } as any);

    const req = createMockRequest("http://localhost:3000/api/admin/notifications/notif-1/retry", "POST");
    const res = await retryNotificationRoute(req, { params: Promise.resolve({ id: "notif-1" }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.status).toBe(NotificationStatus.SENT);
  });
});
