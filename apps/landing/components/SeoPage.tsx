import type { SeoPageContent } from "@/content/seo-pages";
import type { LeadInterest } from "@/components/LeadForm";
import HowItWorksPage from "@/components/seo/templates/HowItWorksPage";
import EditorialSeoPage from "@/components/seo/templates/EditorialSeoPage";
import DefaultSeoPage from "@/components/seo/templates/DefaultSeoPage";

type SeoPageProps = {
  page: SeoPageContent;
  interest?: LeadInterest;
};

export default function SeoPage({ page, interest = "clothing" }: SeoPageProps) {
  if (page.template === "how-it-works") {
    return <HowItWorksPage page={page} />;
  }
  if (page.template === "editorial") {
    return <EditorialSeoPage page={page} interest={interest} />;
  }
  return <DefaultSeoPage page={page} interest={interest} />;
}
