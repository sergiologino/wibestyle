import * as ImageManipulator from "expo-image-manipulator";
import type { RNFile } from "@/lib/mobile-api";

type PickedImageAsset = {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
  width?: number | null;
};

export async function preparePickedImageForUpload(
  asset: PickedImageAsset,
  fallbackName: string,
  maxWidth = 1200,
): Promise<RNFile> {
  const resizeWidth = asset.width && asset.width > 0 ? Math.min(asset.width, maxWidth) : maxWidth;
  const result = await ImageManipulator.manipulateAsync(
    asset.uri,
    [{ resize: { width: resizeWidth } }],
    {
      compress: 0.82,
      format: ImageManipulator.SaveFormat.JPEG,
    },
  );

  return {
    uri: result.uri,
    type: "image/jpeg",
    name: fallbackName.endsWith(".jpg") || fallbackName.endsWith(".jpeg") ? fallbackName : `${fallbackName}.jpg`,
  };
}
