import HomePage from "@/components/home/HomePage";
import JsonLd from "@/components/JsonLd";
import { faqSchema } from "@/lib/schema";
import { homeFaq } from "@/content/home-faq";

export default function Page() {
  return (
    <>
      <JsonLd data={faqSchema(homeFaq.map((f) => ({ q: f.q, a: f.a })))} />
      <HomePage />
    </>
  );
}
