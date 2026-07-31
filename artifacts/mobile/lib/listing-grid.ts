import { Dimensions } from 'react-native';

export const GRID_H_PADDING = 14;
export const GRID_GAP = 8;
export const HOME_GRID_COLS = 2;
export const DEFAULT_GRID_COLS = 3;
export const FEATURED_CARD_WIDTH = Math.min(168, Dimensions.get('window').width * 0.44);

export function listingCardWidth(
  cols: number,
  hPadding: number = GRID_H_PADDING,
  gap: number = GRID_GAP,
): number {
  const screenWidth = Dimensions.get('window').width;
  return (screenWidth - hPadding * 2 - gap * (cols - 1)) / cols;
}
