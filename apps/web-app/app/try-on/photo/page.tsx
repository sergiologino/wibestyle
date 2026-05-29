import PhotoTryOnClient from "@/components/try-on/PhotoTryOnClient";
import TryOnGateClient from "@/components/try-on/TryOnGateClient";

export default function TryOnPhotoPage() {
  return (
    <TryOnGateClient>
      <PhotoTryOnClient />
    </TryOnGateClient>
  );
}
