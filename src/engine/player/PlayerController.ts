import { vec3 } from 'gl-matrix';
import { InputManager } from '../input/InputManager';
import { Camera } from './Camera';
import { World } from '../world/World';

export class PlayerController {
  private camera: Camera;
  private inputManager: InputManager;
  private world: World;

  private velocity: vec3;
  private speed = 8.0;
  private sprintSpeed = 16.0;
  private jumpVelocity = 8.0;
  private gravity = -22.0;
  private mouseSensitivity = 0.0018;

  private isGrounded = false;
  private isCrouching = false;
  private height = 1.8;
  private crouchHeight = 1.0;

  constructor(inputManager: InputManager, world: World) {
    this.camera = new Camera();
    this.inputManager = inputManager;
    this.world = world;
    this.velocity = vec3.create();
  }

  update(deltaTime: number) {
    this.handleMouseLook();
    this.handleMovement(deltaTime);
    this.applyGravity(deltaTime);
  }

  private handleMouseLook() {
    if (!this.inputManager.isPointerLocked()) return;
    const delta = this.inputManager.getMouseDelta();
    this.camera.rotate(
      -delta.y * this.mouseSensitivity,
      -delta.x * this.mouseSensitivity,
    );
  }

  private handleMovement(deltaTime: number) {
    const forward = this.camera.getForward();
    const right   = this.camera.getRight();

    // Flatten movement to XZ plane
    const fwd2 = vec3.fromValues(forward[0], 0, forward[2]);
    const rgt2 = vec3.fromValues(right[0], 0, right[2]);
    if (vec3.length(fwd2) > 0) vec3.normalize(fwd2, fwd2);
    if (vec3.length(rgt2) > 0) vec3.normalize(rgt2, rgt2);

    const moveDir = vec3.create();
    if (this.inputManager.isKeyDown('KeyW')) vec3.add(moveDir, moveDir, fwd2);
    if (this.inputManager.isKeyDown('KeyS')) vec3.subtract(moveDir, moveDir, fwd2);
    if (this.inputManager.isKeyDown('KeyA')) vec3.subtract(moveDir, moveDir, rgt2);
    if (this.inputManager.isKeyDown('KeyD')) vec3.add(moveDir, moveDir, rgt2);

    if (vec3.length(moveDir) > 0) vec3.normalize(moveDir, moveDir);

    const isSprinting = this.inputManager.isKeyDown('ShiftLeft');
    const speed = isSprinting ? this.sprintSpeed : this.speed;
    vec3.scale(moveDir, moveDir, speed * deltaTime);

    const pos = this.camera.getPosition();
    pos[0] += moveDir[0];
    pos[2] += moveDir[2];

    if (this.inputManager.isKeyDown('Space') && this.isGrounded) {
      this.velocity[1] = this.jumpVelocity;
      this.isGrounded = false;
    }

    this.isCrouching = this.inputManager.isKeyDown('ControlLeft');
  }

  private applyGravity(deltaTime: number) {
    this.velocity[1] += this.gravity * deltaTime;

    const pos = this.camera.getPosition();
    pos[1] += this.velocity[1] * deltaTime;

    const eyeHeight = this.isCrouching ? this.crouchHeight : this.height;
    const groundLevel = this.world.getGroundLevel(pos[0], pos[2]) + eyeHeight;

    if (pos[1] <= groundLevel) {
      pos[1] = groundLevel;
      this.velocity[1] = 0;
      this.isGrounded = true;
    }
  }

  getCamera(): Camera {
    return this.camera;
  }

  getPosition(): vec3 {
    return this.camera.getPosition();
  }

  getVelocity(): vec3 {
    return this.velocity;
  }

  isPlayerGrounded(): boolean {
    return this.isGrounded;
  }

  isLocked(): boolean {
    return this.inputManager.isPointerLocked();
  }

  getCameraYaw(): number {
    return this.camera.getRotation()[1];
  }
}
