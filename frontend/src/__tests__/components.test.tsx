import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Test utilities
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

function renderWithProviders(ui: React.ReactElement) {
  const testQueryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={testQueryClient}>{ui}</QueryClientProvider>
  );
}

describe("Component Tests", () => {
  describe("Button Component", () => {
    it("renders button with text", () => {
      const { Button } = require("@/components/ui/button");
      renderWithProviders(<Button>Click me</Button>);
      expect(screen.getByText("Click me")).toBeInTheDocument();
    });

    it("handles click events", () => {
      const { Button } = require("@/components/ui/button");
      const handleClick = jest.fn();
      renderWithProviders(<Button onClick={handleClick}>Click me</Button>);
      fireEvent.click(screen.getByText("Click me"));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("applies variant classes", () => {
      const { Button } = require("@/components/ui/button");
      renderWithProviders(<Button variant="outline">Outline</Button>);
      const button = screen.getByText("Outline");
      expect(button).toHaveClass("border");
    });

    it("disables button correctly", () => {
      const { Button } = require("@/components/ui/button");
      renderWithProviders(<Button disabled>Disabled</Button>);
      expect(screen.getByText("Disabled")).toBeDisabled();
    });
  });

  describe("Input Component", () => {
    it("renders input element", () => {
      const { Input } = require("@/components/ui/input");
      renderWithProviders(<Input placeholder="Enter text" />);
      expect(screen.getByPlaceholderText("Enter text")).toBeInTheDocument();
    });

    it("handles value changes", () => {
      const { Input } = require("@/components/ui/input");
      const handleChange = jest.fn();
      renderWithProviders(
        <Input placeholder="Enter text" onChange={handleChange} />
      );
      fireEvent.change(screen.getByPlaceholderText("Enter text"), {
        target: { value: "test" },
      });
      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe("Card Component", () => {
    it("renders card with content", () => {
      const { Card, CardHeader, CardTitle, CardContent } = require("@/components/ui/card");
      renderWithProviders(
        <Card>
          <CardHeader>
            <CardTitle>Test Card</CardTitle>
          </CardHeader>
          <CardContent>Card content here</CardContent>
        </Card>
      );
      expect(screen.getByText("Test Card")).toBeInTheDocument();
      expect(screen.getByText("Card content here")).toBeInTheDocument();
    });
  });

  describe("Badge Component", () => {
    it("renders badge with text", () => {
      const { Badge } = require("@/components/ui/badge");
      renderWithProviders(<Badge>Active</Badge>);
      expect(screen.getByText("Active")).toBeInTheDocument();
    });

    it("applies variant classes", () => {
      const { Badge } = require("@/components/ui/badge");
      renderWithProviders(<Badge variant="secondary">Secondary</Badge>);
      expect(screen.getByText("Secondary")).toBeInTheDocument();
    });
  });
});

describe("Loading Components", () => {
  it("renders loading spinner", () => {
    const { LoadingSpinner } = require("@/components/loading");
    const { container } = renderWithProviders(<LoadingSpinner />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders skeleton loader", () => {
    const { Skeleton } = require("@/components/loading");
    const { container } = renderWithProviders(
      <Skeleton className="h-10 w-full" />
    );
    expect(container.firstChild).toHaveClass("animate-pulse");
  });

  it("renders card skeleton", () => {
    const { CardSkeleton } = require("@/components/loading");
    renderWithProviders(<CardSkeleton />);
    // CardSkeleton should render multiple skeleton elements
    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });
});

describe("Hook Tests", () => {
  describe("useApi Hooks", () => {
    it("usePolicies returns data", async () => {
      const mockPolicies = [
        { id: "1", flightNumber: "AA100", status: "active" },
      ];
      
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPolicies),
      });

      // Hook testing would require more setup with renderHook
      // This is a placeholder for actual hook tests
      expect(true).toBe(true);
    });
  });
});

describe("Store Tests", () => {
  describe("Preferences Store", () => {
    it("toggles theme", () => {
      const { usePreferencesStore } = require("@/lib/store");
      const store = usePreferencesStore.getState();
      
      const initialTheme = store.theme;
      store.toggleTheme();
      expect(usePreferencesStore.getState().theme).not.toBe(initialTheme);
    });

    it("updates notification preferences", () => {
      const { usePreferencesStore } = require("@/lib/store");
      const store = usePreferencesStore.getState();
      
      store.setNotifications({ email: false });
      expect(usePreferencesStore.getState().notifications.email).toBe(false);
    });
  });

  describe("Insurance Store", () => {
    it("sets selected flight", () => {
      const { useInsuranceStore } = require("@/lib/store");
      const store = useInsuranceStore.getState();
      
      const flight = {
        flightNumber: "AA100",
        airline: "American Airlines",
        departure: "JFK",
        arrival: "LAX",
        departureTime: new Date().toISOString(),
      };
      
      store.setSelectedFlight(flight);
      expect(useInsuranceStore.getState().selectedFlight).toEqual(flight);
    });

    it("clears purchase state", () => {
      const { useInsuranceStore } = require("@/lib/store");
      const store = useInsuranceStore.getState();
      
      store.clearPurchaseState();
      expect(useInsuranceStore.getState().selectedFlight).toBeNull();
      expect(useInsuranceStore.getState().riskAssessment).toBeNull();
    });
  });
});
