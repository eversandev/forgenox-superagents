import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { SkillsetFromHubDrawer } from "./SkillsetFromHubDrawer";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "pt-BR" },
  }),
}));
vi.mock("../../api/modules/expertMarket", () => ({
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
vi.mock("../../api/modules/skillPackages", () => ({
  skillPackagesApi: { fromSkillHub: vi.fn() },
}));

it("uses Portuguese catalog labels in the skill-package importer", async () => {
  render(<SkillsetFromHubDrawer open onClose={vi.fn()} onCreated={vi.fn()} />);
  expect(
    await screen.findByText("Super Agente de automação de testes"),
  ).toBeInTheDocument();
  expect(
    screen.getByText("Fluxo de trabalho para automação de testes."),
  ).toBeInTheDocument();
});
