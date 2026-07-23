import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';
import { useColors } from '../hooks/useColors';

interface LogoProps {
  size?: number;
  color?: string;
}

/** Alışveriş çantası + konum pini (uygulama ikonu ile uyumlu) */
export function Logo({ size = 48, color }: LogoProps) {
  const colors = useColors();
  const stroke = color || colors.primary;

  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Path
        d="M14 18H34V38C34 39.6569 32.6569 41 31 41H17C15.3431 41 14 39.6569 14 38V18Z"
        stroke={stroke}
        strokeWidth="2.8"
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d="M18 18V14C18 10.6863 20.6863 8 24 8C27.3137 8 30 10.6863 30 14V18"
        stroke={stroke}
        strokeWidth="2.8"
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M24 35C24 35 17 27.5 17 23.5C17 20.4624 19.4624 18 22.5 18H25.5C28.5376 18 31 20.4624 31 23.5C31 27.5 24 35 24 35Z"
        fill={stroke}
      />
      <Circle cx="24" cy="23.5" r="2.2" fill={colors.background} />
    </Svg>
  );
}
