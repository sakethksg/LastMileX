import { describe, it, expect, vi } from "vitest";
import React from "react";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageHeader } from "@/components/ui/PageHeader";

describe("Frontend Accessible UI Components", () => {
  describe("LoadingSkeleton Component", () => {
    it("creates element with role='status' and aria-busy='true'", () => {
      const element = LoadingSkeleton({ message: "Fetching drivers..." });
      expect(element.props.role).toBe("status");
      expect(element.props["aria-busy"]).toBe("true");
      expect(element.props["aria-label"]).toBe("Fetching drivers...");
    });

    it("renders table variant with role='status'", () => {
      const element = LoadingSkeleton({ variant: "table", message: "Loading table..." });
      expect(element.props.role).toBe("status");
      expect(element.props["aria-busy"]).toBe("true");
    });
  });

  describe("EmptyState Component", () => {
    it("renders accessible region with provided title and description", () => {
      const element = EmptyState({
        title: "No Orders Found",
        description: "Please check back later.",
      });

      expect(element.props.role).toBe("region");
      expect(element.props["aria-label"]).toBe("No Orders Found");
    });
  });

  describe("ErrorState Component", () => {
    it("renders with role='alert' and aria-live='assertive'", () => {
      const element = ErrorState({
        title: "Conflict Error",
        message: "State transition rejected",
        code: "ORDER_STATE_CONFLICT",
      });

      expect(element.props.role).toBe("alert");
      expect(element.props["aria-live"]).toBe("assertive");
    });
  });

  describe("PageHeader Component", () => {
    it("renders title and back link structure", () => {
      const element = PageHeader({
        title: "Order #ORD-1001",
        subtitle: "Dispatch summary",
        backHref: "/orders",
        backLabel: "Back to Orders",
      });

      expect(element).toBeDefined();
      expect(element.props.className).toContain("border-b");
    });
  });
});
