import rawCities from './maranhaoCities.json';

export type MaranhaoCity = {
  id: string;
  name: string;
};

export const maranhaoCities: MaranhaoCity[] = rawCities;
