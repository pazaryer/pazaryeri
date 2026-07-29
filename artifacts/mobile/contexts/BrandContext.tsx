import React, { createContext, useContext, useMemo } from 'react';
import { getAppBrand, type AppBrand } from '@/lib/brand-runtime';

const BrandContext = createContext<AppBrand>(getAppBrand());

export function BrandProvider({ brand, children }: { brand: AppBrand; children: React.ReactNode }) {
  const value = useMemo(() => brand, [brand]);
  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
}

export function useBrand(): AppBrand {
  return useContext(BrandContext);
}
