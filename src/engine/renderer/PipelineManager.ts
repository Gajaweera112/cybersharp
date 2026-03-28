import { ShaderManager } from './ShaderManager';

export class PipelineManager {
  private device: GPUDevice;
  private format: GPUTextureFormat;
  private pipelines: Map<string, GPURenderPipeline> = new Map();

  constructor(device: GPUDevice, format: GPUTextureFormat) {
    this.device = device;
    this.format = format;
  }

  async createPipelines(shaderManager: ShaderManager) {
    // Forward pipeline — single colour target (the swap-chain surface),
    // vertex layout matches the baked geometry in World.ts (stride = 40 bytes).
    const forwardPipeline = this.device.createRenderPipeline({
      label: 'forward-pipeline',
      layout: 'auto',
      vertex: {
        module: shaderManager.getShader('vertex'),
        entryPoint: 'main',
        buffers: [{
          arrayStride: 40,
          attributes: [
            { shaderLocation: 0, offset:  0, format: 'float32x3' }, // position
            { shaderLocation: 1, offset: 12, format: 'float32x3' }, // normal
            { shaderLocation: 2, offset: 24, format: 'float32x3' }, // color
            { shaderLocation: 3, offset: 36, format: 'float32'   }, // emissive
          ],
        }],
      },
      fragment: {
        module: shaderManager.getShader('fragment'),
        entryPoint: 'main',
        targets: [{ format: this.format }],
      },
      primitive: {
        topology: 'triangle-list',
        cullMode: 'none', // render all faces; winding-order independent
      },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: 'less',
        format: 'depth24plus',
      },
    });

    this.pipelines.set('forward', forwardPipeline);
  }

  getPipeline(name: string): GPURenderPipeline {
    const pipeline = this.pipelines.get(name);
    if (!pipeline) throw new Error(`Pipeline not found: ${name}`);
    return pipeline;
  }
}
