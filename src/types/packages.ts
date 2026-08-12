export interface PackageInclude {
  icon: string;
  text: string;
}

export interface Package {
  id: string;
  name: string;
  ideal_for: string;
  includes: PackageInclude[];
  price_aud: number;
  tag?: string;
  image: string;
}
