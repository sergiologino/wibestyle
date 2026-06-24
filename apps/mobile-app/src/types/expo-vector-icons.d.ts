declare module "@expo/vector-icons" {
  import type { ComponentType } from "react";
  import type { TextProps } from "react-native";

  export type FeatherIconProps = TextProps & {
    name: string;
    size?: number;
    color?: string;
  };

  export const Feather: ComponentType<FeatherIconProps>;
}
