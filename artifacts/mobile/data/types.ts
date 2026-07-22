export interface Listing {
  id: string;
  title: string;
  price: string;
  category: string;
  distance: string;
  location: string;
  image: string;
  height: number;
  sellerId: string;
  description: string;
  isFavorite: boolean;
  views: number;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  totalSales: number;
  memberSince: string;
  isVerified: boolean;
}
