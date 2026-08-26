import StylistClient from "@/components/stylist/StylistClient";
import TryOnGateClient from "@/components/try-on/TryOnGateClient";

export default function StylistPage() {
  return (
    <TryOnGateClient>
      <StylistClient />
    </TryOnGateClient>
  );
}
