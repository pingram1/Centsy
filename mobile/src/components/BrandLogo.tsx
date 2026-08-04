import { Image, StyleSheet, View, type ImageStyle, type StyleProp, type ViewStyle } from "react-native";

const logoSource = require("../../assets/branding/centsy-logo-transparent.png");
const iconSource = require("../../assets/branding/centsy-icon.png");

type BrandSize = "sm" | "md" | "lg";

const logoHeight: Record<BrandSize, number> = {
  sm: 24,
  md: 30,
  lg: 40,
};

const iconSize: Record<BrandSize, number> = {
  sm: 24,
  md: 32,
  lg: 40,
};

/** Full wordmark (icon + Centsy text). */
export function BrandLogo({
  size = "md",
  style,
  imageStyle,
}: {
  size?: BrandSize;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
}) {
  const height = logoHeight[size];
  return (
    <View style={[styles.logoWrap, style]} accessibilityRole="image" accessibilityLabel="Centsy">
      <Image
        source={logoSource}
        style={[{ height, width: height * 3.6 }, styles.logo, imageStyle]}
        resizeMode="contain"
      />
    </View>
  );
}

/** App icon mark only (for tabs, list rows, empty states). */
export function BrandIcon({
  size = "md",
  style,
}: {
  size?: BrandSize;
  style?: StyleProp<ViewStyle>;
}) {
  const dim = iconSize[size];
  return (
    <View style={[styles.iconWrap, { width: dim, height: dim }, style]}>
      <Image
        source={iconSource}
        style={{ width: dim, height: dim }}
        resizeMode="contain"
        accessibilityLabel="Centsy"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  logoWrap: {
    justifyContent: "center",
  },
  logo: {
    maxWidth: 160,
  },
  iconWrap: {
    borderRadius: 8,
    overflow: "hidden",
  },
});
