export class ShaderManager {
  private device: GPUDevice;
  private shaders: Map<string, GPUShaderModule> = new Map();

  constructor(device: GPUDevice) {
    this.device = device;
  }

  async loadShaders() {
    this.createShader('vertex', vertexShader);
    this.createShader('fragment', fragmentShader);
  }

  private createShader(name: string, code: string) {
    const shader = this.device.createShaderModule({ label: name, code });
    this.shaders.set(name, shader);
  }

  getShader(name: string): GPUShaderModule {
    const shader = this.shaders.get(name);
    if (!shader) throw new Error(`Shader not found: ${name}`);
    return shader;
  }
}

// Vertex layout (stride 40 bytes):
//   @location(0) position  vec3f  offset  0
//   @location(1) normal    vec3f  offset 12
//   @location(2) color     vec3f  offset 24
//   @location(3) emissive  f32    offset 36

const vertexShader = `
struct Camera {
  viewProj: mat4x4f,
}
@group(0) @binding(0) var<uniform> camera: Camera;

struct VertexInput {
  @location(0) position: vec3f,
  @location(1) normal:   vec3f,
  @location(2) color:    vec3f,
  @location(3) emissive: f32,
}

struct VertexOutput {
  @builtin(position) clipPos:       vec4f,
  @location(0)       normal:        vec3f,
  @location(1)       colorEmissive: vec4f,
  @location(2)       viewDepth:     f32,
}

@vertex
fn main(v: VertexInput) -> VertexOutput {
  let clip = camera.viewProj * vec4f(v.position, 1.0);
  var out: VertexOutput;
  out.clipPos       = clip;
  out.normal        = v.normal;
  out.colorEmissive = vec4f(v.color, v.emissive);
  out.viewDepth     = clip.w;   // view-space depth: clip.w == -z_view == dist along view axis
  return out;
}
`;

const fragmentShader = `
struct FragInput {
  @location(0) normal:        vec3f,
  @location(1) colorEmissive: vec4f,
  @location(2) viewDepth:     f32,
}

@fragment
fn main(f: FragInput) -> @location(0) vec4f {
  let lightDir  = normalize(vec3f(0.4, 1.0, 0.3));
  let moonDir   = normalize(vec3f(-0.3, 0.5, -0.6));
  let color     = f.colorEmissive.rgb;
  let emissive  = f.colorEmissive.a;

  let ambient   = 0.18;
  let diff1     = max(dot(normalize(f.normal), lightDir), 0.0);
  let diff2     = max(dot(normalize(f.normal), moonDir),  0.0) * 0.3;
  let lighting  = ambient + diff1 * 0.65 + diff2;

  let lit   = color * lighting;
  let glow  = color * emissive * 2.5;
  var finalColor = clamp(lit + glow, vec3f(0.0), vec3f(1.8));

  // Atmospheric fog — fades to Night City dark blue
  let fogNear   = 60.0;
  let fogFar    = 900.0;
  let fogFactor = clamp((f.viewDepth - fogNear) / (fogFar - fogNear), 0.0, 0.92);
  let fogColor  = vec3f(0.02, 0.02, 0.07);
  finalColor    = mix(finalColor, fogColor, fogFactor);

  return vec4f(finalColor, 1.0);
}
`;
