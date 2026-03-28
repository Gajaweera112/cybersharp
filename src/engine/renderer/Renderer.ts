import { mat4 } from 'gl-matrix';
import { Camera } from '../player/Camera';
import { World } from '../world/World';
import { ShaderManager } from './ShaderManager';
import { PipelineManager } from './PipelineManager';
import { PostProcessing } from './PostProcessing';

export class Renderer {
  private canvas: HTMLCanvasElement;
  private adapter!: GPUAdapter;
  private device!: GPUDevice;
  private context!: GPUCanvasContext;
  private presentationFormat!: GPUTextureFormat;

  private shaderManager!: ShaderManager;
  private pipelineManager!: PipelineManager;
  private postProcessing!: PostProcessing;

  private depthTexture!: GPUTexture;
  private depthTextureView!: GPUTextureView;

  // Scene texture: world renders here, then post-process reads it
  private sceneTexture!: GPUTexture;
  private sceneTextureView!: GPUTextureView;

  private pipeline!: GPURenderPipeline;
  private cameraBuffer!: GPUBuffer;
  private cameraBindGroup!: GPUBindGroup;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  async initialize() {
    this.adapter = await navigator.gpu.requestAdapter() as GPUAdapter;
    if (!this.adapter) throw new Error('WebGPU adapter not available');

    this.device = await this.adapter.requestDevice();
    this.context = this.canvas.getContext('webgpu') as GPUCanvasContext;
    this.presentationFormat = navigator.gpu.getPreferredCanvasFormat();

    this.context.configure({
      device: this.device,
      format: this.presentationFormat,
      alphaMode: 'opaque',
    });

    this.shaderManager = new ShaderManager(this.device);
    this.pipelineManager = new PipelineManager(this.device, this.presentationFormat);
    this.postProcessing = new PostProcessing(this.device, this.presentationFormat);

    await this.shaderManager.loadShaders();
    await this.pipelineManager.createPipelines(this.shaderManager);
    await this.postProcessing.initialize();

    this.pipeline = this.pipelineManager.getPipeline('forward');

    // Camera uniform buffer: one mat4x4f = 64 bytes
    this.cameraBuffer = this.device.createBuffer({
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.cameraBindGroup = this.device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [{ binding: 0, resource: { buffer: this.cameraBuffer } }],
    });

    this.createDepthTexture();
    this.createSceneTexture();
  }

  private createDepthTexture() {
    if (this.depthTexture) this.depthTexture.destroy();
    this.depthTexture = this.device.createTexture({
      size: [this.canvas.width, this.canvas.height],
      format: 'depth24plus',
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
    this.depthTextureView = this.depthTexture.createView();
  }

  private createSceneTexture() {
    if (this.sceneTexture) this.sceneTexture.destroy();
    this.sceneTexture = this.device.createTexture({
      size: [this.canvas.width, this.canvas.height],
      format: this.presentationFormat,
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });
    this.sceneTextureView = this.sceneTexture.createView();
  }

  resize(width: number, height: number) {
    if (!this.device || !this.depthTexture) return;
    this.createDepthTexture();
    this.createSceneTexture();
  }

  render(world: World, camera: Camera) {
    // Upload viewProj matrix
    const viewProj = mat4.create();
    mat4.multiply(viewProj, camera.getProjectionMatrix(), camera.getViewMatrix());
    this.device.queue.writeBuffer(this.cameraBuffer, 0, viewProj as Float32Array);

    const encoder = this.device.createCommandEncoder();

    // --- Pass 1: Forward geometry → scene texture ---
    const geoPass = encoder.beginRenderPass({
      colorAttachments: [{
        view: this.sceneTextureView,
        clearValue: { r: 0.02, g: 0.02, b: 0.06, a: 1.0 },
        loadOp: 'clear',
        storeOp: 'store',
      }],
      depthStencilAttachment: {
        view: this.depthTextureView,
        depthClearValue: 1.0,
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
      },
    });

    world.render(geoPass, this.pipeline, this.cameraBindGroup);
    geoPass.end();

    // --- Pass 2: Post-processing → swap chain ---
    const swapView = this.context.getCurrentTexture().createView();
    this.postProcessing.render(
      encoder,
      this.sceneTextureView,
      swapView,
      this.canvas.width,
      this.canvas.height,
    );

    this.device.queue.submit([encoder.finish()]);
  }

  getDevice(): GPUDevice {
    return this.device;
  }

  getPipeline(name: string): GPURenderPipeline {
    return this.pipelineManager.getPipeline(name);
  }
}
