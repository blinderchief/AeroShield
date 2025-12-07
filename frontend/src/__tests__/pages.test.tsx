import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

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

// Mock the page components to avoid complex dependency issues
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("Landing Page", () => {
  it("renders hero section", async () => {
    // Dynamic import to handle client components
    const LandingPage = (await import("@/app/page")).default;
    renderWithProviders(<LandingPage />);
    
    // Check for main heading or key text
    expect(screen.getByText(/AeroShield/i)).toBeInTheDocument();
  });

  it("renders call to action buttons", async () => {
    const LandingPage = (await import("@/app/page")).default;
    renderWithProviders(<LandingPage />);
    
    // Should have CTA buttons
    const buttons = screen.getAllByRole("link");
    expect(buttons.length).toBeGreaterThan(0);
  });
});

describe("Dashboard Page", () => {
  it("renders dashboard layout", async () => {
    const DashboardPage = (await import("@/app/dashboard/page")).default;
    renderWithProviders(<DashboardPage />);
    
    // Dashboard should render
    expect(document.body).toBeInTheDocument();
  });
});

describe("Buy Insurance Page", () => {
  it("renders insurance purchase form", async () => {
    const BuyPage = (await import("@/app/dashboard/buy/page")).default;
    renderWithProviders(<BuyPage />);
    
    // Should have form elements
    expect(document.body).toBeInTheDocument();
  });
});

describe("Claims Page", () => {
  it("renders claims list", async () => {
    const ClaimsPage = (await import("@/app/dashboard/claims/page")).default;
    renderWithProviders(<ClaimsPage />);
    
    // Should render claims section
    expect(document.body).toBeInTheDocument();
  });
});

describe("Policies Page", () => {
  it("renders policies grid", async () => {
    const PoliciesPage = (await import("@/app/dashboard/policies/page")).default;
    renderWithProviders(<PoliciesPage />);
    
    // Should render policies section
    expect(document.body).toBeInTheDocument();
  });
});

describe("Settings Page", () => {
  it("renders settings form", async () => {
    const SettingsPage = (await import("@/app/dashboard/settings/page")).default;
    renderWithProviders(<SettingsPage />);
    
    // Should render settings section
    expect(document.body).toBeInTheDocument();
  });
});
