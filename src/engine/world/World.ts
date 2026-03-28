import { vec3 } from 'gl-matrix';
import { Renderer } from '../renderer/Renderer';
import { CityGenerator } from './CityGenerator';

// Vertex stride: position(3) + normal(3) + color(3) + emissive(1) = 10 floats = 40 bytes
const FLOATS_PER_VERTEX = 10;
const VERTS_PER_BOX = 36; // 6 faces × 2 triangles × 3 vertices

export class World {
  private renderer: Renderer;
  private cityGenerator: CityGenerator;
  private buildings: Building[] = [];
  private lights: Light[] = [];

  private vertexBuffer: GPUBuffer | null = null;
  private vertexCount = 0;

  constructor(renderer: Renderer) {
    this.renderer = renderer;
    this.cityGenerator = new CityGenerator();
  }

  async generate() {
    console.log('🏙️ Generating cyberpunk city...');
    const cityData = this.cityGenerator.generate(50, 50);
    this.buildings = cityData.buildings;
    this.lights = cityData.lights;
    console.log(`Generated ${this.buildings.length} buildings and ${this.lights.length} lights`);
    this.buildGPUBuffers();
  }

  private buildGPUBuffers() {
    const device = this.renderer.getDevice();

    // Ground (6 verts) + all buildings
    const totalVerts = this.buildings.length * VERTS_PER_BOX + 6;
    const data = new Float32Array(totalVerts * FLOATS_PER_VERTEX);
    let offset = 0;

    // Ground plane at y = 0
    const G = 1600;
    const gc: [number, number, number] = [0.055, 0.055, 0.075];
    const gn: [number, number, number] = [0, 1, 0];
    const gv: [number, number, number][] = [
      [-G, 0, -G], [-G, 0,  G], [ G, 0,  G],
      [-G, 0, -G], [ G, 0,  G], [ G, 0, -G],
    ];
    for (const p of gv) {
      data[offset++] = p[0]; data[offset++] = p[1]; data[offset++] = p[2];
      data[offset++] = gn[0]; data[offset++] = gn[1]; data[offset++] = gn[2];
      data[offset++] = gc[0]; data[offset++] = gc[1]; data[offset++] = gc[2];
      data[offset++] = 0;
    }

    for (const b of this.buildings) {
      offset = writeBox(data, offset, b);
    }

    this.vertexCount = offset / FLOATS_PER_VERTEX;

    this.vertexBuffer = device.createBuffer({
      size: data.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });
    new Float32Array(this.vertexBuffer.getMappedRange()).set(data);
    this.vertexBuffer.unmap();
  }

  update(_deltaTime: number, _playerPos: vec3) {
    this.lights.forEach(light => {
      light.intensity = 1.0 + Math.sin(performance.now() / 1000 + light.position[0]) * 0.2;
    });
  }

  render(
    pass: GPURenderPassEncoder,
    pipeline: GPURenderPipeline,
    cameraBindGroup: GPUBindGroup,
  ) {
    if (!this.vertexBuffer || this.vertexCount === 0) return;
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, cameraBindGroup);
    pass.setVertexBuffer(0, this.vertexBuffer);
    pass.draw(this.vertexCount);
  }

  getBuildings(): Building[] {
    return this.buildings;
  }

  getLights(): Light[] {
    return this.lights;
  }

  getGroundLevel(_x: number, _z: number): number {
    return 0;
  }

  raycast(_origin: vec3, _direction: vec3, _maxDistance: number): RaycastHit | null {
    return null;
  }
}

// Bake a box (building) as 36 vertices into Float32Array starting at offset.
// Building.position = centre of box, .size = full extents.
function writeBox(data: Float32Array, startOffset: number, b: Building): number {
  let o = startOffset;
  const px = b.position[0], py = b.position[1], pz = b.position[2];
  const hx = b.size[0] * 0.5, hy = b.size[1] * 0.5, hz = b.size[2] * 0.5;
  const r = b.color[0], g = b.color[1], bl = b.color[2];
  const e = b.emissive;

  const v = (x: number, y: number, z: number, nx: number, ny: number, nz: number) => {
    data[o++] = x;  data[o++] = y;  data[o++] = z;
    data[o++] = nx; data[o++] = ny; data[o++] = nz;
    data[o++] = r;  data[o++] = g;  data[o++] = bl;
    data[o++] = e;
  };

  // +Y top
  v(px-hx, py+hy, pz-hz,  0, 1, 0); v(px+hx, py+hy, pz-hz,  0, 1, 0); v(px+hx, py+hy, pz+hz,  0, 1, 0);
  v(px-hx, py+hy, pz-hz,  0, 1, 0); v(px+hx, py+hy, pz+hz,  0, 1, 0); v(px-hx, py+hy, pz+hz,  0, 1, 0);
  // -Y bottom
  v(px-hx, py-hy, pz+hz,  0,-1, 0); v(px+hx, py-hy, pz+hz,  0,-1, 0); v(px+hx, py-hy, pz-hz,  0,-1, 0);
  v(px-hx, py-hy, pz+hz,  0,-1, 0); v(px+hx, py-hy, pz-hz,  0,-1, 0); v(px-hx, py-hy, pz-hz,  0,-1, 0);
  // +X right
  v(px+hx, py-hy, pz-hz,  1, 0, 0); v(px+hx, py+hy, pz-hz,  1, 0, 0); v(px+hx, py+hy, pz+hz,  1, 0, 0);
  v(px+hx, py-hy, pz-hz,  1, 0, 0); v(px+hx, py+hy, pz+hz,  1, 0, 0); v(px+hx, py-hy, pz+hz,  1, 0, 0);
  // -X left
  v(px-hx, py-hy, pz+hz, -1, 0, 0); v(px-hx, py+hy, pz+hz, -1, 0, 0); v(px-hx, py+hy, pz-hz, -1, 0, 0);
  v(px-hx, py-hy, pz+hz, -1, 0, 0); v(px-hx, py+hy, pz-hz, -1, 0, 0); v(px-hx, py-hy, pz-hz, -1, 0, 0);
  // +Z front
  v(px+hx, py-hy, pz+hz,  0, 0, 1); v(px+hx, py+hy, pz+hz,  0, 0, 1); v(px-hx, py+hy, pz+hz,  0, 0, 1);
  v(px+hx, py-hy, pz+hz,  0, 0, 1); v(px-hx, py+hy, pz+hz,  0, 0, 1); v(px-hx, py-hy, pz+hz,  0, 0, 1);
  // -Z back
  v(px-hx, py-hy, pz-hz,  0, 0,-1); v(px-hx, py+hy, pz-hz,  0, 0,-1); v(px+hx, py+hy, pz-hz,  0, 0,-1);
  v(px-hx, py-hy, pz-hz,  0, 0,-1); v(px+hx, py+hy, pz-hz,  0, 0,-1); v(px+hx, py-hy, pz-hz,  0, 0,-1);

  return o;
}

export interface Building {
  position: vec3;
  size: vec3;
  color: vec3;
  emissive: number;
}

export interface Light {
  position: vec3;
  color: vec3;
  intensity: number;
  radius: number;
}

export interface RaycastHit {
  point: vec3;
  normal: vec3;
  distance: number;
}
