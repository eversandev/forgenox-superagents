import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ExpertMarketTab from "./ExpertMarketTab";

vi.mock("../../../components/Markdown/LazyMarkdown", () => ({
  default: () => null,
}));
vi.mock("../../../api/modules/expertMarket", () => ({
  expertMarketApi: {
    list: vi.fn().mockResolvedValue({
      items: [
        {
          id: "test",
          slug: "test",
          label: { en: "Tech Test Automation Expert" },
          description: {
            en: "Expert workflow for Tech Test Automation Expert.",
          },
          skill_count: 6,
        },
      ],
      scenes: [],
    }),
  },
}));
const translate = (key: string) => key;
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: translate }) }));

describe("expert market locale", () => {
  it("renders Portuguese cards and switches back to the original English", async () => {
    const props = {
      installedExpertIds: new Set<string>(),
      onRequestCreate: vi.fn(),
    };
    const view = render(<ExpertMarketTab {...props} lang="pt-BR" />);
    expect(
      await screen.findByText("Super Agente de automação de testes"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Fluxo de trabalho para automação de testes."),
    ).toBeInTheDocument();
    view.rerender(<ExpertMarketTab {...props} lang="en" />);
    expect(screen.getByText("Tech Test Automation Expert")).toBeInTheDocument();
    expect(
      screen.getByText("Expert workflow for Tech Test Automation Expert."),
    ).toBeInTheDocument();
  });
});
