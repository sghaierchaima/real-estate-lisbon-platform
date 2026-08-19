export type Property = {
  id: string;
  title: string;
  description: string | null;

  location: string | null;
  region: string | null;
  city: string | null;

  price: number;

  propertyType: string | null;

  bedrooms: number | null;
  bathrooms: number | null;

  area: number | null;
  landArea: number | null;

  constructionYear: number | null;

  equipments: string[];

  imageUrls: string[];

  featured: boolean;

  createdAt: string;
  updatedAt: string;
};