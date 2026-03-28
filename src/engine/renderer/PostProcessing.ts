export class PostProcessing {
  private device: GPUDevice;
  private format: GPUTextureFormat;
  private pipeline!: GPURenderPipeline;
  private sampler!: GPUSampler;
  private paramsBuffer!: GPUBuffer;

  constructor(device: GPUDevice, format: GPUTextureFormat) {
    this.device = device;
    this.format = format;
  }

  async initialize() {
    const module = this.device.createShaderModule({
      label: 'post-process',
      code: POST_SHADER,
    });

    this.pipeline = this.device.createRenderPipeline({
      label: 'post-process-pipeline',
      layout: 'auto',
      vertex:   { module, entryPoint: 'vs_main' },
      fragment: { module, entryPoint: 'fs_main', targets: [{ format: this.format }] },
      primitive: { topology: 'triangle-list' },
    });

    this.sampler = this.device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge',
    });

    // Params: time(f32) + resX(f32) + resY(f32) + pad(f32) = 16 bytes
    this.paramsBuffer = this.device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
  }

  render(
    encoder: GPUCommandEncoder,
    sceneView: GPUTextureView,
    targetView: GPUTextureView,
    width: number,
    height: number,
  ) {
    const time = (performance.now() * 0.001) % 1000;
    this.device.queue.writeBuffer(
      this.paramsBuffer, 0,
      new Float32Array([time, width, height, 0]),
    );

    // Bind group is created per-frame — the scene texture changes after each resize
    const bindGroup = this.device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: sceneView },
        { binding: 1, resource: this.sampler },
        { binding: 2, resource: { buffer: this.paramsBuffer } },
      ],
    });

    const pass = encoder.beginRenderPass({
      colorAttachments: [{
        view: targetView,
        loadOp: 'clear',
        clearValue: { r: 0, g: 0, b: 0, a: 1 },
        storeOp: 'store',
      }],
    });

    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.draw(3); // fullscreen triangle
    pass.end();
  }
}

const POST_SHADER = `
struct VSOut {
  @builtin(position) pos: vec4f,
  @location(0)       uv:  vec2f,
}

// Fullscreen triangle — 3 vertices, no index buffer needed
@vertex
fn vs_main(@builtin(vertex_index) idx: u32) -> VSOut {
  var positions = array<vec2f, 3>(
    vec2f(-1.0, -1.0),
    vec2f( 3.0, -1.0),
    vec2f(-1.0,  3.0),
  );
  let p = positions[idx];
  var out: VSOut;
  out.pos = vec4f(p, 0.0, 1.0);
  // UV: (0,0) = top-left of texture (WebGPU texture convention, Y-down)
  out.uv  = vec2f((p.x + 1.0) * 0.5, (1.0 - p.y) * 0.5);
  return out;
}

@group(0) @binding(0) var sceneTex: texture_2d<f32>;
@group(0) @binding(1) var samp:     sampler;

struct Params {
  time: f32,
  resX: f32,
  resY: f32,
  _pad: f32,
}
@group(0) @binding(2) var<uniform> p: Params;

fn hash21(v: vec2f) -> f32 {
  return fract(sin(dot(v, vec2f(127.1, 311.7))) * 43758.5453);
}

@fragment
fn fs_main(in: VSOut) -> @location(0) vec4f {
  let uv = in.uv;

  // --- Chromatic aberration (RGB channel split toward edges) ---
  let aberr  = 0.0018;
  let d      = uv - vec2f(0.5);
  let rSample = textureSample(sceneTex, samp, uv - d * aberr).r;
  let gSample = textureSample(sceneTex, samp, uv).g;
  let bSample = textureSample(sceneTex, samp, uv + d * aberr).b;
  var color   = vec3f(rSample, gSample, bSample);

  // --- Vignette ---
  let vd  = uv * (1.0 - uv.yx);
  let vig = pow(vd.x * vd.y * 14.0, 0.35);
  color   = color * mix(0.35, 1.0, vig);

  // --- Film grain ---
  let grain = (hash21(uv + fract(p.time * 13.7)) - 0.5) * 0.04;
  color    += grain;

  // --- CRT scanlines (subtle horizontal bands) ---
  let scan  = sin(uv.y * p.resY * 1.8) * 0.012;
  color    += scan;

  // --- Mild neon bloom on bright pixels ---
  let lum = dot(color, vec3f(0.2126, 0.7152, 0.0722));
  if lum > 0.7 {
    color += (color - 0.7) * 0.3;
  }

  return vec4f(clamp(color, vec3f(0.0), vec3f(1.0)), 1.0);
}
`;
