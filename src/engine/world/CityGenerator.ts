import { vec3 } from 'gl-matrix';
import { Building, Light } from './World';

// District types that define the visual character of each zone
type District = 'watson' | 'heywood' | 'pacifica' | 'city-center' | 'badlands';

interface DistrictConfig {
  heightMult: number;   // relative building height multiplier
  density: number;      // probability a cell is occupied (0-1)
  primaryColor: () => vec3;
  neonChance: number;
}

const DISTRICTS: Record<District, DistrictConfig> = {
  'watson': {       // Industrial — dark metal, orange/red neon
    heightMult: 0.7, density: 0.8,
    primaryColor: () => randomFrom([
      vec3.fromValues(0.18, 0.16, 0.15),
      vec3.fromValues(0.22, 0.20, 0.18),
      vec3.fromValues(0.15, 0.15, 0.20),
    ]),
    neonChance: 0.35,
  },
  'heywood': {      // Suburban — low buildings, green/white neon
    heightMult: 0.4, density: 0.65,
    primaryColor: () => randomFrom([
      vec3.fromValues(0.20, 0.22, 0.20),
      vec3.fromValues(0.25, 0.23, 0.18),
    ]),
    neonChance: 0.25,
  },
  'pacifica': {     // Ruins — crumbling grey, dim purple neon
    heightMult: 0.55, density: 0.5,
    primaryColor: () => vec3.fromValues(0.16, 0.15, 0.16),
    neonChance: 0.18,
  },
  'city-center': {  // Corpo towers — glass/steel, blue/yellow neon, very tall
    heightMult: 1.8, density: 0.75,
    primaryColor: () => randomFrom([
      vec3.fromValues(0.15, 0.18, 0.22),
      vec3.fromValues(0.20, 0.22, 0.25),
      vec3.fromValues(0.12, 0.14, 0.18),
    ]),
    neonChance: 0.55,
  },
  'badlands': {     // Desert fringe — dusty brown, sparse, almost no neon
    heightMult: 0.3, density: 0.3,
    primaryColor: () => randomFrom([
      vec3.fromValues(0.25, 0.20, 0.14),
      vec3.fromValues(0.22, 0.17, 0.12),
    ]),
    neonChance: 0.08,
  },
};

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getDistrictNeonColors(d: District): vec3[] {
  switch (d) {
    case 'watson':      return [
      vec3.fromValues(1.0, 0.3, 0.0),   // orange
      vec3.fromValues(1.0, 0.0, 0.24),  // red
      vec3.fromValues(0.8, 0.6, 0.0),   // amber
    ];
    case 'heywood':     return [
      vec3.fromValues(0.0, 1.0, 0.5),   // green
      vec3.fromValues(0.9, 0.9, 0.9),   // white
    ];
    case 'pacifica':    return [
      vec3.fromValues(0.6, 0.0, 1.0),   // purple
      vec3.fromValues(0.4, 0.0, 0.8),   // deep violet
    ];
    case 'city-center': return [
      vec3.fromValues(1.0, 0.94, 0.0),  // corpo yellow
      vec3.fromValues(0.0, 0.96, 1.0),  // net blue
      vec3.fromValues(0.0, 0.6, 1.0),   // electric blue
    ];
    case 'badlands':    return [
      vec3.fromValues(0.9, 0.5, 0.0),   // fire orange
    ];
  }
}

export class CityGenerator {
  generate(width: number, depth: number): CityData {
    const buildings: Building[] = [];
    const lights: Light[] = [];

    const blockSize = 20;
    const streetWidth = 8;
    const gridSize = blockSize + streetWidth;

    const halfW = width / 2;
    const halfD = depth / 2;

    for (let x = -halfW; x < halfW; x++) {
      for (let z = -halfD; z < halfD; z++) {
        const district = this.getDistrict(x / halfW, z / halfD);
        const cfg = DISTRICTS[district];

        if (Math.random() > cfg.density) continue;

        const baseHeight = 8 + Math.random() * 20;
        const buildingHeight = baseHeight * cfg.heightMult * (1 + Math.random() * 1.2);
        const buildingWidth  = 7 + Math.random() * 14;
        const buildingDepth  = 7 + Math.random() * 14;

        const jitter = gridSize * 0.18;
        const posX = x * gridSize + (Math.random() - 0.5) * jitter;
        const posZ = z * gridSize + (Math.random() - 0.5) * jitter;

        const isNeon = Math.random() < cfg.neonChance;

        const color = isNeon
          ? randomFrom(getDistrictNeonColors(district))
          : cfg.primaryColor();

        // City center gets extra-tall landmark towers occasionally
        const isTower = district === 'city-center' && Math.random() < 0.12;
        const finalHeight = isTower
          ? buildingHeight * (2.5 + Math.random() * 2)
          : buildingHeight;

        buildings.push({
          position: vec3.fromValues(posX, finalHeight / 2, posZ),
          size:     vec3.fromValues(buildingWidth, finalHeight, buildingDepth),
          color,
          emissive: isNeon ? 0.6 + Math.random() * 0.4 : 0.0,
        });

        // Neon buildings emit light
        if (isNeon) {
          const neonColors = getDistrictNeonColors(district);
          for (let i = 0; i < 2; i++) {
            lights.push({
              position: vec3.fromValues(
                posX + (Math.random() - 0.5) * buildingWidth,
                finalHeight * 0.5 + Math.random() * finalHeight * 0.4,
                posZ + (Math.random() - 0.5) * buildingDepth,
              ),
              color: randomFrom(neonColors),
              intensity: 1.0,
              radius: 12 + Math.random() * 12,
            });
          }
        }

        // Street-level lights on every block
        if (Math.random() < 0.4) {
          lights.push({
            position: vec3.fromValues(posX, 3.5, posZ),
            color: vec3.fromValues(0.9, 0.85, 0.6),
            intensity: 0.6,
            radius: 12,
          });
        }
      }
    }

    return { buildings, lights };
  }

  // Maps normalised grid position [-1, 1] to a district
  private getDistrict(nx: number, nz: number): District {
    const d = Math.sqrt(nx * nx + nz * nz);
    if (d < 0.15) return 'city-center';
    if (d < 0.35) return 'watson';
    if (nz > 0.4 && nx > 0)  return 'heywood';
    if (nz < -0.4 && nx < 0) return 'pacifica';
    if (d > 0.75)             return 'badlands';
    return 'watson';
  }
}

export interface CityData {
  buildings: Building[];
  lights: Light[];
}
