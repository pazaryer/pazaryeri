import React from 'react';
import Svg, { Path, Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { useColors } from '../hooks/useColors';

interface LogoProps {
  size?: number;
  color?: string;
}

export function Logo({ size = 48, color }: LogoProps) {
  const colors = useColors();
  const fillColor = color || colors.primary;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Shopping bag base */}
      <Path
        d="M19 8H5V20C5 21.1046 5.89543 22 7 22H17C18.1046 22 19 21.1046 19 20V8Z"
        fill={fillColor}
      />
      {/* Handle */}
      <Path
        d="M16 10V6C16 3.79086 14.2091 2 12 2C9.79086 2 8 3.79086 8 6V10"
        stroke={fillColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Location Pin overlay/cutout */}
      <Path
        d="M12 18L9 14.3333C8.33333 13.5 8 12.6667 8 11.5C8 9.567 9.79086 8 12 8C14.2091 8 16 9.567 16 11.5C16 12.6667 15.6667 13.5 15 14.3333L12 18Z"
        fill={colors.background}
      />
      <Circle cx="12" cy="11.5" r="1.5" fill={fillColor} />
    </Svg>
  );
}
