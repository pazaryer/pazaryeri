import { StyleSheet, type StyleProp, type ViewStyle, type TextStyle, type ImageStyle } from 'react-native';

/** Link asChild + style dizisi web'de CSSStyleDeclaration hatası verir — düzleştir */
export function flatStyle<T extends ViewStyle | TextStyle | ImageStyle>(
  ...styles: StyleProp<T>[]
): T {
  return StyleSheet.flatten(styles.filter(Boolean)) as T;
}
