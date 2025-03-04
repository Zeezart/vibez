
import { extendTheme } from "@chakra-ui/react";

export const theme = extendTheme({
  fonts: {
    heading: `'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif`,
    body: `'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif`,
  },
  colors: {
    brand: {
      50: "#f0e7ff",
      100: "#d9c7ff",
      200: "#b69dff",
      300: "#9b87f5", // New primary color
      400: "#8b6cf6",
      500: "#7c3aed",
      600: "#6d28d9",
      700: "#5b21b6",
      800: "#4c1d95",
      900: "#3a1674",
    },
    gray: {
      50: "#F9FAFB",
      100: "#F3F4F6",
      200: "#E5E7EB",
      300: "#D1D5DB",
      400: "#9CA3AF",
      500: "#6B7280",
      600: "#4B5563",
      700: "#374151",
      800: "#1F2937",
      900: "#111827",
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: "500",
        borderRadius: "md",
      },
      variants: {
        solid: {
          bg: "brand.300",
          color: "white",
          _hover: {
            bg: "brand.400",
          },
        },
        outline: {
          borderColor: "brand.300",
          color: "brand.300",
        },
        ghost: {
          color: "gray.600",
          _hover: {
            bg: "gray.100",
          },
        },
      },
    },
  },
});
