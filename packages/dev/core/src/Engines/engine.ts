import type { Nullable } from "../types";
import type { Scene } from "../scene";
import { InternalTexture, InternalTextureSource } from "../Materials/Textures/internalTexture";
import type { IOfflineProvider } from "../Offline/IOfflineProvider";
import type { ILoadingScreen } from "../Loading/loadingScreen";
import { EngineStore } from "./engineStore";
import type { WebGLPipelineContext } from "./WebGL/webGLPipelineContext";
import type { IPipelineContext } from "./IPipelineContext";
import type { ICustomAnimationFrameRequester } from "../Misc/customAnimationFrameRequester";
import type { EngineOptions } from "./thinEngine";
import { ThinEngine } from "./thinEngine";
import * as constants from "./constants";
import type { IViewportLike, IColor4Like } from "../Maths/math.like";
import { PerformanceMonitor } from "../Misc/performanceMonitor";
import type { DataBuffer } from "../Buffers/dataBuffer";
import { WebGLDataBuffer } from "../Meshes/WebGL/webGLDataBuffer";
import { Logger } from "../Misc/logger";
import type { RenderTargetWrapper } from "./renderTargetWrapper";
import { WebGLHardwareTexture } from "./WebGL/webGLHardwareTexture";

import "./Extensions/engine.alpha";
import "./Extensions/engine.readTexture";
import "./Extensions/engine.dynamicBuffer";
import "./AbstractEngine/abstractEngine.loadingScreen";
import "./AbstractEngine/abstractEngine.dom";
import "./AbstractEngine/abstractEngine.states";
import "./AbstractEngine/abstractEngine.renderPass";
import "./AbstractEngine/abstractEngine.texture";

import type { Material } from "../Materials/material";
import type { PostProcess } from "../PostProcesses/postProcess";
import { AbstractEngine } from "./abstractEngine";
import {
    CreateImageBitmapFromSource,
    ExitFullscreen,
    ExitPointerlock,
    GetFontOffset,
    RequestFullscreen,
    RequestPointerlock,
    ResizeImageBitmap,
    _CommonDispose,
    _CommonInit,
} from "./engine.common";
import { PerfCounter } from "../Misc/perfCounter";
import "../Audio/audioEngine";

/**
 * The engine class is responsible for interfacing with all lower-level APIs such as WebGL and Audio
 */
export class Engine extends ThinEngine {
    // Const statics

    /** Defines that alpha blending is disabled */
    public static readonly ALPHA_DISABLE = constants.ALPHA_DISABLE;
    /** Defines that alpha blending to SRC ALPHA * SRC + DEST */
    public static readonly ALPHA_ADD = constants.ALPHA_ADD;
    /** Defines that alpha blending to SRC ALPHA * SRC + (1 - SRC ALPHA) * DEST */
    public static readonly ALPHA_COMBINE = constants.ALPHA_COMBINE;
    /** Defines that alpha blending to DEST - SRC * DEST */
    public static readonly ALPHA_SUBTRACT = constants.ALPHA_SUBTRACT;
    /** Defines that alpha blending to SRC * DEST */
    public static readonly ALPHA_MULTIPLY = constants.ALPHA_MULTIPLY;
    /** Defines that alpha blending to SRC ALPHA * SRC + (1 - SRC) * DEST */
    public static readonly ALPHA_MAXIMIZED = constants.ALPHA_MAXIMIZED;
    /** Defines that alpha blending to SRC + DEST */
    public static readonly ALPHA_ONEONE = constants.ALPHA_ONEONE;
    /** Defines that alpha blending to SRC + (1 - SRC ALPHA) * DEST */
    public static readonly ALPHA_PREMULTIPLIED = constants.ALPHA_PREMULTIPLIED;
    /**
     * Defines that alpha blending to SRC + (1 - SRC ALPHA) * DEST
     * Alpha will be set to (1 - SRC ALPHA) * DEST ALPHA
     */
    public static readonly ALPHA_PREMULTIPLIED_PORTERDUFF = constants.ALPHA_PREMULTIPLIED_PORTERDUFF;
    /** Defines that alpha blending to CST * SRC + (1 - CST) * DEST */
    public static readonly ALPHA_INTERPOLATE = constants.ALPHA_INTERPOLATE;
    /**
     * Defines that alpha blending to SRC + (1 - SRC) * DEST
     * Alpha will be set to SRC ALPHA + (1 - SRC ALPHA) * DEST ALPHA
     */
    public static readonly ALPHA_SCREENMODE = constants.ALPHA_SCREENMODE;

    /** Defines that the resource is not delayed*/
    public static readonly DELAYLOADSTATE_NONE = constants.DELAYLOADSTATE_NONE;
    /** Defines that the resource was successfully delay loaded */
    public static readonly DELAYLOADSTATE_LOADED = constants.DELAYLOADSTATE_LOADED;
    /** Defines that the resource is currently delay loading */
    public static readonly DELAYLOADSTATE_LOADING = constants.DELAYLOADSTATE_LOADING;
    /** Defines that the resource is delayed and has not started loading */
    public static readonly DELAYLOADSTATE_NOTLOADED = constants.DELAYLOADSTATE_NOTLOADED;

    // Depht or Stencil test Constants.
    /** Passed to depthFunction or stencilFunction to specify depth or stencil tests will never pass. i.e. Nothing will be drawn */
    public static readonly NEVER = constants.NEVER;
    /** Passed to depthFunction or stencilFunction to specify depth or stencil tests will always pass. i.e. Pixels will be drawn in the order they are drawn */
    public static readonly ALWAYS = constants.ALWAYS;
    /** Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is less than the stored value */
    public static readonly LESS = constants.LESS;
    /** Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is equals to the stored value */
    public static readonly EQUAL = constants.EQUAL;
    /** Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is less than or equal to the stored value */
    public static readonly LEQUAL = constants.LEQUAL;
    /** Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is greater than the stored value */
    public static readonly GREATER = constants.GREATER;
    /** Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is greater than or equal to the stored value */
    public static readonly GEQUAL = constants.GEQUAL;
    /** Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is not equal to the stored value */
    public static readonly NOTEQUAL = constants.NOTEQUAL;

    // Stencil Actions Constants.
    /** Passed to stencilOperation to specify that stencil value must be kept */
    public static readonly KEEP = constants.KEEP;
    /** Passed to stencilOperation to specify that stencil value must be replaced */
    public static readonly REPLACE = constants.REPLACE;
    /** Passed to stencilOperation to specify that stencil value must be incremented */
    public static readonly INCR = constants.INCR;
    /** Passed to stencilOperation to specify that stencil value must be decremented */
    public static readonly DECR = constants.DECR;
    /** Passed to stencilOperation to specify that stencil value must be inverted */
    public static readonly INVERT = constants.INVERT;
    /** Passed to stencilOperation to specify that stencil value must be incremented with wrapping */
    public static readonly INCR_WRAP = constants.INCR_WRAP;
    /** Passed to stencilOperation to specify that stencil value must be decremented with wrapping */
    public static readonly DECR_WRAP = constants.DECR_WRAP;

    /** Texture is not repeating outside of 0..1 UVs */
    public static readonly TEXTURE_CLAMP_ADDRESSMODE = constants.TEXTURE_CLAMP_ADDRESSMODE;
    /** Texture is repeating outside of 0..1 UVs */
    public static readonly TEXTURE_WRAP_ADDRESSMODE = constants.TEXTURE_WRAP_ADDRESSMODE;
    /** Texture is repeating and mirrored */
    public static readonly TEXTURE_MIRROR_ADDRESSMODE = constants.TEXTURE_MIRROR_ADDRESSMODE;

    /** @deprecated use TextureType */
    public static readonly TEXTUREFORMAT_ALPHA = constants.TextureFormat.ALPHA;
    /** @deprecated use TextureType */
    public static readonly TEXTUREFORMAT_LUMINANCE = constants.TextureFormat.LUMINANCE;
    /** @deprecated use TextureType */
    public static readonly TEXTUREFORMAT_LUMINANCE_ALPHA = constants.TextureFormat.LUMINANCE_ALPHA;
    /** @deprecated use TextureType */
    public static readonly TEXTUREFORMAT_RGB = constants.TextureFormat.RGB;
    /** @deprecated use TextureType */
    public static readonly TEXTUREFORMAT_RGBA = constants.TextureFormat.RGBA;
    /** @deprecated use TextureType */
    public static readonly TEXTUREFORMAT_RED = constants.TextureFormat.RED;
    /** @deprecated use TextureType */
    public static readonly TEXTUREFORMAT_R = constants.TextureFormat.R;
    /** @deprecated use TextureType */
    public static readonly TEXTUREFORMAT_RG = constants.TextureFormat.RG;
    /** @deprecated use TextureType */
    public static readonly TEXTUREFORMAT_RED_INTEGER = constants.TextureFormat.RED_INTEGER;
    /** @deprecated use TextureType */
    public static readonly TEXTUREFORMAT_R_INTEGER = constants.TextureFormat.R_INTEGER;
    /** @deprecated use TextureType */
    public static readonly TEXTUREFORMAT_RG_INTEGER = constants.TextureFormat.RG_INTEGER;
    /** @deprecated use TextureType */
    public static readonly TEXTUREFORMAT_RGB_INTEGER = constants.TextureFormat.RGB_INTEGER;
    /** @deprecated use TextureType */
    public static readonly TEXTUREFORMAT_RGBA_INTEGER = constants.TextureFormat.RGBA_INTEGER;

    /** @deprecated use TextureType */
    public static readonly TEXTURETYPE_UNSIGNED_BYTE = constants.TextureType.UNSIGNED_BYTE;
    /** @deprecated use TextureType */
    public static readonly TEXTURETYPE_UNSIGNED_INT = constants.TextureType.UNSIGNED_INT;
    /** @deprecated use TextureType */
    public static readonly TEXTURETYPE_FLOAT = constants.TextureType.FLOAT;
    /** @deprecated use TextureType */
    public static readonly TEXTURETYPE_HALF_FLOAT = constants.TextureType.HALF_FLOAT;
    /** @deprecated use TextureType */
    public static readonly TEXTURETYPE_BYTE = constants.TextureType.BYTE;
    /** @deprecated use TextureType */
    public static readonly TEXTURETYPE_SHORT = constants.TextureType.SHORT;
    /** @deprecated use TextureType */
    public static readonly TEXTURETYPE_UNSIGNED_SHORT = constants.TextureType.UNSIGNED_SHORT;
    /** @deprecated use TextureType */
    public static readonly TEXTURETYPE_INT = constants.TextureType.INT;
    /** @deprecated use TextureType */
    public static readonly TEXTURETYPE_UNSIGNED_INTEGER = constants.TextureType.UNSIGNED_INTEGER;
    /** @deprecated use TextureType */
    public static readonly TEXTURETYPE_UNSIGNED_SHORT_4_4_4_4 = constants.TextureType.UNSIGNED_SHORT_4_4_4_4;
    /** @deprecated use TextureType */
    public static readonly TEXTURETYPE_UNSIGNED_SHORT_5_5_5_1 = constants.TextureType.UNSIGNED_SHORT_5_5_5_1;
    /** @deprecated use TextureType */
    public static readonly TEXTURETYPE_UNSIGNED_SHORT_5_6_5 = constants.TextureType.UNSIGNED_SHORT_5_6_5;
    /** @deprecated use TextureType */
    public static readonly TEXTURETYPE_UNSIGNED_INT_2_10_10_10_REV = constants.TextureType.UNSIGNED_INT_2_10_10_10_REV;
    /** @deprecated use TextureType */
    public static readonly TEXTURETYPE_UNSIGNED_INT_24_8 = constants.TextureType.UNSIGNED_INT_24_8;
    /** @deprecated use TextureType */
    public static readonly TEXTURETYPE_UNSIGNED_INT_10F_11F_11F_REV = constants.TextureType.UNSIGNED_INT_10F_11F_11F_REV;
    /** @deprecated use TextureType */
    public static readonly TEXTURETYPE_UNSIGNED_INT_5_9_9_9_REV = constants.TextureType.UNSIGNED_INT_5_9_9_9_REV;
    /** @deprecated use TextureType */
    public static readonly TEXTURETYPE_FLOAT_32_UNSIGNED_INT_24_8_REV = constants.TextureType.FLOAT_32_UNSIGNED_INT_24_8_REV;

    /** nearest is mag = nearest and min = nearest and mip = none */
    public static readonly TEXTURE_NEAREST_SAMPLINGMODE = constants.TEXTURE_NEAREST_SAMPLINGMODE;
    /** Bilinear is mag = linear and min = linear and mip = nearest */
    public static readonly TEXTURE_BILINEAR_SAMPLINGMODE = constants.TEXTURE_BILINEAR_SAMPLINGMODE;
    /** Trilinear is mag = linear and min = linear and mip = linear */
    public static readonly TEXTURE_TRILINEAR_SAMPLINGMODE = constants.TEXTURE_TRILINEAR_SAMPLINGMODE;
    /** nearest is mag = nearest and min = nearest and mip = linear */
    public static readonly TEXTURE_NEAREST_NEAREST_MIPLINEAR = constants.TEXTURE_NEAREST_NEAREST_MIPLINEAR;
    /** Bilinear is mag = linear and min = linear and mip = nearest */
    public static readonly TEXTURE_LINEAR_LINEAR_MIPNEAREST = constants.TEXTURE_LINEAR_LINEAR_MIPNEAREST;
    /** Trilinear is mag = linear and min = linear and mip = linear */
    public static readonly TEXTURE_LINEAR_LINEAR_MIPLINEAR = constants.TEXTURE_LINEAR_LINEAR_MIPLINEAR;
    /** mag = nearest and min = nearest and mip = nearest */
    public static readonly TEXTURE_NEAREST_NEAREST_MIPNEAREST = constants.TEXTURE_NEAREST_NEAREST_MIPNEAREST;
    /** mag = nearest and min = linear and mip = nearest */
    public static readonly TEXTURE_NEAREST_LINEAR_MIPNEAREST = constants.TEXTURE_NEAREST_LINEAR_MIPNEAREST;
    /** mag = nearest and min = linear and mip = linear */
    public static readonly TEXTURE_NEAREST_LINEAR_MIPLINEAR = constants.TEXTURE_NEAREST_LINEAR_MIPLINEAR;
    /** mag = nearest and min = linear and mip = none */
    public static readonly TEXTURE_NEAREST_LINEAR = constants.TEXTURE_NEAREST_LINEAR;
    /** mag = nearest and min = nearest and mip = none */
    public static readonly TEXTURE_NEAREST_NEAREST = constants.TEXTURE_NEAREST_NEAREST;
    /** mag = linear and min = nearest and mip = nearest */
    public static readonly TEXTURE_LINEAR_NEAREST_MIPNEAREST = constants.TEXTURE_LINEAR_NEAREST_MIPNEAREST;
    /** mag = linear and min = nearest and mip = linear */
    public static readonly TEXTURE_LINEAR_NEAREST_MIPLINEAR = constants.TEXTURE_LINEAR_NEAREST_MIPLINEAR;
    /** mag = linear and min = linear and mip = none */
    public static readonly TEXTURE_LINEAR_LINEAR = constants.TEXTURE_LINEAR_LINEAR;
    /** mag = linear and min = nearest and mip = none */
    public static readonly TEXTURE_LINEAR_NEAREST = constants.TEXTURE_LINEAR_NEAREST;

    /** Explicit coordinates mode */
    public static readonly TEXTURE_EXPLICIT_MODE = constants.TEXTURE_EXPLICIT_MODE;
    /** Spherical coordinates mode */
    public static readonly TEXTURE_SPHERICAL_MODE = constants.TEXTURE_SPHERICAL_MODE;
    /** Planar coordinates mode */
    public static readonly TEXTURE_PLANAR_MODE = constants.TEXTURE_PLANAR_MODE;
    /** Cubic coordinates mode */
    public static readonly TEXTURE_CUBIC_MODE = constants.TEXTURE_CUBIC_MODE;
    /** Projection coordinates mode */
    public static readonly TEXTURE_PROJECTION_MODE = constants.TEXTURE_PROJECTION_MODE;
    /** Skybox coordinates mode */
    public static readonly TEXTURE_SKYBOX_MODE = constants.TEXTURE_SKYBOX_MODE;
    /** Inverse Cubic coordinates mode */
    public static readonly TEXTURE_INVCUBIC_MODE = constants.TEXTURE_INVCUBIC_MODE;
    /** Equirectangular coordinates mode */
    public static readonly TEXTURE_EQUIRECTANGULAR_MODE = constants.TEXTURE_EQUIRECTANGULAR_MODE;
    /** Equirectangular Fixed coordinates mode */
    public static readonly TEXTURE_FIXED_EQUIRECTANGULAR_MODE = constants.TEXTURE_FIXED_EQUIRECTANGULAR_MODE;
    /** Equirectangular Fixed Mirrored coordinates mode */
    public static readonly TEXTURE_FIXED_EQUIRECTANGULAR_MIRRORED_MODE = constants.TEXTURE_FIXED_EQUIRECTANGULAR_MIRRORED_MODE;

    // Texture rescaling mode
    /** @deprecated use ScaleMode */
    public static readonly SCALEMODE_FLOOR = constants.ScaleMode.FLOOR;
    /** @deprecated use ScaleMode */
    public static readonly SCALEMODE_NEAREST = constants.ScaleMode.NEAREST;
    /** @deprecated use ScaleMode */
    public static readonly SCALEMODE_CEILING = constants.ScaleMode.CEILING;

    /**
     * Returns the current npm package of the sdk
     */
    // Not mixed with Version for tooling purpose.
    public static override get NpmPackage(): string {
        return AbstractEngine.NpmPackage;
    }

    /**
     * Returns the current version of the framework
     */
    public static override get Version(): string {
        return AbstractEngine.Version;
    }

    /** Gets the list of created engines */
    public static get Instances(): AbstractEngine[] {
        return EngineStore.Instances;
    }

    /**
     * Gets the latest created engine
     */
    public static get LastCreatedEngine(): Nullable<AbstractEngine> {
        return EngineStore.LastCreatedEngine;
    }

    /**
     * Gets the latest created scene
     */
    public static get LastCreatedScene(): Nullable<Scene> {
        return EngineStore.LastCreatedScene;
    }

    /** @internal */

    /**
     * Will flag all materials in all scenes in all engines as dirty to trigger new shader compilation
     * @param flag defines which part of the materials must be marked as dirty
     * @param predicate defines a predicate used to filter which materials should be affected
     */
    public static MarkAllMaterialsAsDirty(flag: number, predicate?: (mat: Material) => boolean): void {
        for (let engineIndex = 0; engineIndex < Engine.Instances.length; engineIndex++) {
            const engine = Engine.Instances[engineIndex];

            for (let sceneIndex = 0; sceneIndex < engine.scenes.length; sceneIndex++) {
                engine.scenes[sceneIndex].markAllMaterialsAsDirty(flag, predicate);
            }
        }
    }

    // eslint-disable-next-line jsdoc/require-returns-check
    /**
     * Method called to create the default loading screen.
     * This can be overridden in your own app.
     * @param canvas The rendering canvas element
     * @returns The loading screen
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public static override DefaultLoadingScreenFactory(canvas: HTMLCanvasElement): ILoadingScreen {
        return AbstractEngine.DefaultLoadingScreenFactory(canvas);
    }

    // Members

    /**
     * If set, will be used to request the next animation frame for the render loop
     */
    public customAnimationFrameRequester: Nullable<ICustomAnimationFrameRequester> = null;

    private _rescalePostProcess: Nullable<PostProcess>;

    protected override get _supportsHardwareTextureRescaling() {
        return !!Engine._RescalePostProcessFactory;
    }

    private _measureFps(): void {
        this._performanceMonitor.sampleFrame();
        this._fps = this._performanceMonitor.averageFPS;
        this._deltaTime = this._performanceMonitor.instantaneousFrameTime || 0;
    }

    private _performanceMonitor = new PerformanceMonitor();
    /**
     * Gets the performance monitor attached to this engine
     * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/optimize_your_scene#engineinstrumentation
     */
    public override get performanceMonitor(): PerformanceMonitor {
        return this._performanceMonitor;
    }

    // Events

    /**
     * Creates a new engine
     * @param canvasOrContext defines the canvas or WebGL context to use for rendering. If you provide a WebGL context, Babylon.js will not hook events on the canvas (like pointers, keyboards, etc...) so no event observables will be available. This is mostly used when Babylon.js is used as a plugin on a system which already used the WebGL context
     * @param antialias defines enable antialiasing (default: false)
     * @param options defines further options to be sent to the getContext() function
     * @param adaptToDeviceRatio defines whether to adapt to the device's viewport characteristics (default: false)
     */
    constructor(
        canvasOrContext: Nullable<HTMLCanvasElement | OffscreenCanvas | WebGLRenderingContext | WebGL2RenderingContext>,
        antialias?: boolean,
        options?: EngineOptions,
        adaptToDeviceRatio: boolean = false
    ) {
        super(canvasOrContext, antialias, options, adaptToDeviceRatio);

        this._drawCalls = new PerfCounter();

        if (!canvasOrContext) {
            return;
        }

        this._features.supportRenderPasses = true;

        options = this._creationOptions;

        if ((<any>canvasOrContext).getContext) {
            const canvas = <HTMLCanvasElement>canvasOrContext;

            this._sharedInit(canvas);
        }
    }

    protected override _initGLContext(): void {
        super._initGLContext();

        this._rescalePostProcess = null;
    }

    /**
     * Shared initialization across engines types.
     * @param canvas The canvas associated with this instance of the engine.
     */
    protected override _sharedInit(canvas: HTMLCanvasElement) {
        super._sharedInit(canvas);

        _CommonInit(this, canvas, this._creationOptions);
    }

    /**
     * Resize an image and returns the image data as an uint8array
     * @param image image to resize
     * @param bufferWidth destination buffer width
     * @param bufferHeight destination buffer height
     * @returns an uint8array containing RGBA values of bufferWidth * bufferHeight size
     */
    public override resizeImageBitmap(image: HTMLImageElement | ImageBitmap, bufferWidth: number, bufferHeight: number): Uint8Array {
        return ResizeImageBitmap(this, image, bufferWidth, bufferHeight);
    }

    /**
     * Engine abstraction for loading and creating an image bitmap from a given source string.
     * @param imageSource source to load the image from.
     * @param options An object that sets options for the image's extraction.
     * @returns ImageBitmap
     */
    public override _createImageBitmapFromSource(imageSource: string, options?: ImageBitmapOptions): Promise<ImageBitmap> {
        return CreateImageBitmapFromSource(this, imageSource, options);
    }

    /**
     * Toggle full screen mode
     * @param requestPointerLock defines if a pointer lock should be requested from the user
     */
    public override switchFullscreen(requestPointerLock: boolean): void {
        if (this.isFullscreen) {
            this.exitFullscreen();
        } else {
            this.enterFullscreen(requestPointerLock);
        }
    }

    /**
     * Enters full screen mode
     * @param requestPointerLock defines if a pointer lock should be requested from the user
     */
    public override enterFullscreen(requestPointerLock: boolean): void {
        if (!this.isFullscreen) {
            this._pointerLockRequested = requestPointerLock;
            if (this._renderingCanvas) {
                RequestFullscreen(this._renderingCanvas);
            }
        }
    }

    /**
     * Exits full screen mode
     */
    public override exitFullscreen(): void {
        if (this.isFullscreen) {
            ExitFullscreen();
        }
    }

    /** States */

    /**
     * Sets a boolean indicating if the dithering state is enabled or disabled
     * @param value defines the dithering state
     */
    public setDitheringState(value: boolean): void {
        if (value) {
            this._gl.enable(this._gl.DITHER);
        } else {
            this._gl.disable(this._gl.DITHER);
        }
    }

    /**
     * Sets a boolean indicating if the rasterizer state is enabled or disabled
     * @param value defines the rasterizer state
     */
    public setRasterizerState(value: boolean): void {
        if (value) {
            this._gl.disable(this._gl.RASTERIZER_DISCARD);
        } else {
            this._gl.enable(this._gl.RASTERIZER_DISCARD);
        }
    }

    /**
     * Directly set the WebGL Viewport
     * @param x defines the x coordinate of the viewport (in screen space)
     * @param y defines the y coordinate of the viewport (in screen space)
     * @param width defines the width of the viewport (in screen space)
     * @param height defines the height of the viewport (in screen space)
     * @returns the current viewport Object (if any) that is being replaced by this call. You can restore this viewport later on to go back to the original state
     */
    public setDirectViewport(x: number, y: number, width: number, height: number): Nullable<IViewportLike> {
        const currentViewport = this._cachedViewport;
        this._cachedViewport = null;

        this._viewport(x, y, width, height);

        return currentViewport;
    }

    /**
     * Executes a scissor clear (ie. a clear on a specific portion of the screen)
     * @param x defines the x-coordinate of the bottom left corner of the clear rectangle
     * @param y defines the y-coordinate of the corner of the clear rectangle
     * @param width defines the width of the clear rectangle
     * @param height defines the height of the clear rectangle
     * @param clearColor defines the clear color
     */
    public scissorClear(x: number, y: number, width: number, height: number, clearColor: IColor4Like): void {
        this.enableScissor(x, y, width, height);
        this.clear(clearColor, true, true, true);
        this.disableScissor();
    }

    /**
     * Enable scissor test on a specific rectangle (ie. render will only be executed on a specific portion of the screen)
     * @param x defines the x-coordinate of the bottom left corner of the clear rectangle
     * @param y defines the y-coordinate of the corner of the clear rectangle
     * @param width defines the width of the clear rectangle
     * @param height defines the height of the clear rectangle
     */
    public enableScissor(x: number, y: number, width: number, height: number): void {
        const gl = this._gl;

        // Change state
        gl.enable(gl.SCISSOR_TEST);
        gl.scissor(x, y, width, height);
    }

    /**
     * Disable previously set scissor test rectangle
     */
    public disableScissor() {
        const gl = this._gl;

        gl.disable(gl.SCISSOR_TEST);
    }

    /**
     * @internal
     */
    public _loadFileAsync(url: string, offlineProvider?: IOfflineProvider, useArrayBuffer?: false): Promise<string>;
    public _loadFileAsync(url: string, offlineProvider?: IOfflineProvider, useArrayBuffer?: true): Promise<ArrayBuffer>;

    /**
     * @internal
     */
    public _loadFileAsync(url: string, offlineProvider?: IOfflineProvider, useArrayBuffer?: boolean): Promise<string | ArrayBuffer> {
        return new Promise((resolve, reject) => {
            this._loadFile(
                url,
                (data) => {
                    resolve(data);
                },
                undefined,
                offlineProvider,
                useArrayBuffer,
                (request, exception) => {
                    reject(exception);
                }
            );
        });
    }

    /**
     * Gets the source code of the vertex shader associated with a specific webGL program
     * @param program defines the program to use
     * @returns a string containing the source code of the vertex shader associated with the program
     */
    public getVertexShaderSource(program: WebGLProgram): Nullable<string> {
        const shaders = this._gl.getAttachedShaders(program);

        if (!shaders) {
            return null;
        }

        return this._gl.getShaderSource(shaders[0]);
    }

    /**
     * Gets the source code of the fragment shader associated with a specific webGL program
     * @param program defines the program to use
     * @returns a string containing the source code of the fragment shader associated with the program
     */
    public getFragmentShaderSource(program: WebGLProgram): Nullable<string> {
        const shaders = this._gl.getAttachedShaders(program);

        if (!shaders) {
            return null;
        }

        return this._gl.getShaderSource(shaders[1]);
    }

    /**
     * sets the object from which width and height will be taken from when getting render width and height
     * Will fallback to the gl object
     * @param dimensions the framebuffer width and height that will be used.
     */
    public override set framebufferDimensionsObject(dimensions: Nullable<{ framebufferWidth: number; framebufferHeight: number }>) {
        this._framebufferDimensionsObject = dimensions;
        if (this._framebufferDimensionsObject) {
            this.onResizeObservable.notifyObservers(this);
        }
    }

    protected override _rebuildBuffers(): void {
        // Index / Vertex
        for (const scene of this.scenes) {
            scene.resetCachedMaterial();
            scene._rebuildGeometries();
        }

        for (const scene of this._virtualScenes) {
            scene.resetCachedMaterial();
            scene._rebuildGeometries();
        }

        super._rebuildBuffers();
    }

    /**
     * Get Font size information
     * @param font font name
     * @returns an object containing ascent, height and descent
     */
    public override getFontOffset(font: string): { ascent: number; height: number; descent: number } {
        return GetFontOffset(font);
    }

    protected override _cancelFrame() {
        if (this.customAnimationFrameRequester) {
            if (this._frameHandler !== 0) {
                this._frameHandler = 0;
                const { cancelAnimationFrame } = this.customAnimationFrameRequester;
                if (cancelAnimationFrame) {
                    cancelAnimationFrame(this.customAnimationFrameRequester.requestID);
                }
            }
        } else {
            super._cancelFrame();
        }
    }

    public override _renderLoop(): void {
        // Reset the frame handler before rendering a frame to determine if a new frame has been queued.
        this._frameHandler = 0;

        if (!this._contextWasLost) {
            let shouldRender = true;
            if (this.isDisposed || (!this.renderEvenInBackground && this._windowIsBackground)) {
                shouldRender = false;
            }

            if (shouldRender) {
                // Start new frame
                this.beginFrame();

                // Child canvases
                if (!this._renderViews()) {
                    // Main frame
                    this._renderFrame();
                }

                // Present
                this.endFrame();
            }
        }

        // The first condition prevents queuing another frame if we no longer have active render loops (e.g., if
        // `stopRenderLoop` is called mid frame). The second condition prevents queuing another frame if one has
        // already been queued (e.g., if `stopRenderLoop` and `runRenderLoop` is called mid frame).
        if (this._activeRenderLoops.length > 0 && this._frameHandler === 0) {
            if (this.customAnimationFrameRequester) {
                this.customAnimationFrameRequester.requestID = this._queueNewFrame(
                    this.customAnimationFrameRequester.renderFunction || this._boundRenderFunction,
                    this.customAnimationFrameRequester
                );
                this._frameHandler = this.customAnimationFrameRequester.requestID;
            } else {
                this._frameHandler = this._queueNewFrame(this._boundRenderFunction, this.getHostWindow());
            }
        }
    }

    /**
     * Enters Pointerlock mode
     */
    public enterPointerlock(): void {
        if (this._renderingCanvas) {
            RequestPointerlock(this._renderingCanvas);
        }
    }

    /**
     * Exits Pointerlock mode
     */
    public exitPointerlock(): void {
        ExitPointerlock();
    }

    /**
     * Begin a new frame
     */
    public override beginFrame(): void {
        this._measureFps();
        super.beginFrame();
    }

    public override _deletePipelineContext(pipelineContext: IPipelineContext): void {
        const webGLPipelineContext = pipelineContext as WebGLPipelineContext;
        if (webGLPipelineContext && webGLPipelineContext.program) {
            if (webGLPipelineContext.transformFeedback) {
                this.deleteTransformFeedback(webGLPipelineContext.transformFeedback);
                webGLPipelineContext.transformFeedback = null;
            }
        }
        super._deletePipelineContext(pipelineContext);
    }

    public override createShaderProgram(
        pipelineContext: IPipelineContext,
        vertexCode: string,
        fragmentCode: string,
        defines: Nullable<string>,
        context?: WebGLRenderingContext,
        transformFeedbackVaryings: Nullable<string[]> = null
    ): WebGLProgram {
        context = context || this._gl;

        this.onBeforeShaderCompilationObservable.notifyObservers(this);

        const program = super.createShaderProgram(pipelineContext, vertexCode, fragmentCode, defines, context, transformFeedbackVaryings);
        this.onAfterShaderCompilationObservable.notifyObservers(this);

        return program;
    }

    protected override _createShaderProgram(
        pipelineContext: WebGLPipelineContext,
        vertexShader: WebGLShader,
        fragmentShader: WebGLShader,
        context: WebGLRenderingContext,
        transformFeedbackVaryings: Nullable<string[]> = null
    ): WebGLProgram {
        const shaderProgram = context.createProgram();
        pipelineContext.program = shaderProgram;

        if (!shaderProgram) {
            throw new Error("Unable to create program");
        }

        context.attachShader(shaderProgram, vertexShader);
        context.attachShader(shaderProgram, fragmentShader);

        if (this.webGLVersion > 1 && transformFeedbackVaryings) {
            const transformFeedback = this.createTransformFeedback();

            this.bindTransformFeedback(transformFeedback);
            this.setTranformFeedbackVaryings(shaderProgram, transformFeedbackVaryings);
            pipelineContext.transformFeedback = transformFeedback;
        }

        context.linkProgram(shaderProgram);

        if (this.webGLVersion > 1 && transformFeedbackVaryings) {
            this.bindTransformFeedback(null);
        }

        pipelineContext.context = context;
        pipelineContext.vertexShader = vertexShader;
        pipelineContext.fragmentShader = fragmentShader;

        if (!pipelineContext.isParallelCompiled) {
            this._finalizePipelineContext(pipelineContext);
        }

        return shaderProgram;
    }

    /**
     * @internal
     */
    public override _releaseTexture(texture: InternalTexture): void {
        super._releaseTexture(texture);
    }

    /**
     * @internal
     */
    public override _releaseRenderTargetWrapper(rtWrapper: RenderTargetWrapper): void {
        super._releaseRenderTargetWrapper(rtWrapper);

        // Set output texture of post process to null if the framebuffer has been released/disposed
        this.scenes.forEach((scene) => {
            scene.postProcesses.forEach((postProcess) => {
                if (postProcess._outputTexture === rtWrapper) {
                    postProcess._outputTexture = null;
                }
            });
            scene.cameras.forEach((camera) => {
                camera._postProcesses.forEach((postProcess) => {
                    if (postProcess) {
                        if (postProcess._outputTexture === rtWrapper) {
                            postProcess._outputTexture = null;
                        }
                    }
                });
            });
        });
    }

    /**
     * @internal
     * Rescales a texture
     * @param source input texture
     * @param destination destination texture
     * @param scene scene to use to render the resize
     * @param internalFormat format to use when resizing
     * @param onComplete callback to be called when resize has completed
     */
    public override _rescaleTexture(source: InternalTexture, destination: InternalTexture, scene: Nullable<any>, internalFormat: number, onComplete: () => void): void {
        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MAG_FILTER, this._gl.LINEAR);
        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MIN_FILTER, this._gl.LINEAR);
        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_S, this._gl.CLAMP_TO_EDGE);
        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_T, this._gl.CLAMP_TO_EDGE);

        const rtt = this.createRenderTargetTexture(
            {
                width: destination.width,
                height: destination.height,
            },
            {
                generateMipMaps: false,
                type: constants.TextureType.UNSIGNED_INT,
                samplingMode: constants.TEXTURE_BILINEAR_SAMPLINGMODE,
                generateDepthBuffer: false,
                generateStencilBuffer: false,
            }
        );

        if (!this._rescalePostProcess && Engine._RescalePostProcessFactory) {
            this._rescalePostProcess = Engine._RescalePostProcessFactory(this);
        }

        if (this._rescalePostProcess) {
            this._rescalePostProcess.externalTextureSamplerBinding = true;
            this._rescalePostProcess.getEffect().executeWhenCompiled(() => {
                this._rescalePostProcess!.onApply = function (effect) {
                    effect._bindTexture("textureSampler", source);
                };

                let hostingScene: Scene = scene;

                if (!hostingScene) {
                    hostingScene = this.scenes[this.scenes.length - 1];
                }
                hostingScene.postProcessManager.directRender([this._rescalePostProcess!], rtt, true);

                this._bindTextureDirectly(this._gl.TEXTURE_2D, destination, true);
                this._gl.copyTexImage2D(this._gl.TEXTURE_2D, 0, internalFormat, 0, 0, destination.width, destination.height, 0);

                this.unBindFramebuffer(rtt);
                rtt.dispose();

                if (onComplete) {
                    onComplete();
                }
            });
        }
    }

    /**
     * Wraps an external web gl texture in a Babylon texture.
     * @param texture defines the external texture
     * @param hasMipMaps defines whether the external texture has mip maps (default: false)
     * @param samplingMode defines the sampling mode for the external texture (default: Constants.TEXTURE_TRILINEAR_SAMPLINGMODE)
     * @param width defines the width for the external texture (default: 0)
     * @param height defines the height for the external texture (default: 0)
     * @returns the babylon internal texture
     */
    public wrapWebGLTexture(
        texture: WebGLTexture,
        hasMipMaps: boolean = false,
        samplingMode: number = constants.TEXTURE_TRILINEAR_SAMPLINGMODE,
        width: number = 0,
        height: number = 0
    ): InternalTexture {
        const hardwareTexture = new WebGLHardwareTexture(texture, this._gl);
        const internalTexture = new InternalTexture(this, InternalTextureSource.Unknown, true);
        internalTexture._hardwareTexture = hardwareTexture;
        internalTexture.baseWidth = width;
        internalTexture.baseHeight = height;
        internalTexture.width = width;
        internalTexture.height = height;
        internalTexture.isReady = true;
        internalTexture.useMipMaps = hasMipMaps;
        this.updateTextureSamplingMode(samplingMode, internalTexture);
        return internalTexture;
    }

    /**
     * @internal
     */
    public _uploadImageToTexture(texture: InternalTexture, image: HTMLImageElement | ImageBitmap, faceIndex: number = 0, lod: number = 0) {
        const gl = this._gl;

        const textureType = this._getWebGLTextureType(texture.type);
        const format = this._getInternalFormat(texture.format);
        const internalFormat = this._getRGBABufferInternalSizedFormat(texture.type, format);

        const bindTarget = texture.isCube ? gl.TEXTURE_CUBE_MAP : gl.TEXTURE_2D;

        this._bindTextureDirectly(bindTarget, texture, true);
        this._unpackFlipY(texture.invertY);

        let target: GLenum = gl.TEXTURE_2D;
        if (texture.isCube) {
            target = gl.TEXTURE_CUBE_MAP_POSITIVE_X + faceIndex;
        }

        gl.texImage2D(target, lod, internalFormat, format, textureType, image);
        this._bindTextureDirectly(bindTarget, null, true);
    }

    /**
     * Updates a depth texture Comparison Mode and Function.
     * If the comparison Function is equal to 0, the mode will be set to none.
     * Otherwise, this only works in webgl 2 and requires a shadow sampler in the shader.
     * @param texture The texture to set the comparison function for
     * @param comparisonFunction The comparison function to set, 0 if no comparison required
     */
    public updateTextureComparisonFunction(texture: InternalTexture, comparisonFunction: number): void {
        if (this.webGLVersion === 1) {
            Logger.Error("WebGL 1 does not support texture comparison.");
            return;
        }

        const gl = this._gl;

        if (texture.isCube) {
            this._bindTextureDirectly(this._gl.TEXTURE_CUBE_MAP, texture, true);

            if (comparisonFunction === 0) {
                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_COMPARE_FUNC, constants.LEQUAL);
                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_COMPARE_MODE, gl.NONE);
            } else {
                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_COMPARE_FUNC, comparisonFunction);
                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
            }

            this._bindTextureDirectly(this._gl.TEXTURE_CUBE_MAP, null);
        } else {
            this._bindTextureDirectly(this._gl.TEXTURE_2D, texture, true);

            if (comparisonFunction === 0) {
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, constants.LEQUAL);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.NONE);
            } else {
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, comparisonFunction);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
            }

            this._bindTextureDirectly(this._gl.TEXTURE_2D, null);
        }

        texture._comparisonFunction = comparisonFunction;
    }

    /**
     * Creates a webGL buffer to use with instantiation
     * @param capacity defines the size of the buffer
     * @returns the webGL buffer
     */
    public createInstancesBuffer(capacity: number): DataBuffer {
        const buffer = this._gl.createBuffer();

        if (!buffer) {
            throw new Error("Unable to create instance buffer");
        }

        const result = new WebGLDataBuffer(buffer);
        result.capacity = capacity;

        this.bindArrayBuffer(result);
        this._gl.bufferData(this._gl.ARRAY_BUFFER, capacity, this._gl.DYNAMIC_DRAW);

        result.references = 1;

        return result;
    }

    /**
     * Delete a webGL buffer used with instantiation
     * @param buffer defines the webGL buffer to delete
     */
    public deleteInstancesBuffer(buffer: WebGLBuffer): void {
        this._gl.deleteBuffer(buffer);
    }

    private _clientWaitAsync(sync: WebGLSync, flags = 0, intervalms = 10): Promise<void> {
        const gl = <WebGL2RenderingContext>(this._gl as any);
        return new Promise((resolve, reject) => {
            const check = () => {
                const res = gl.clientWaitSync(sync, flags, 0);
                if (res == gl.WAIT_FAILED) {
                    reject();
                    return;
                }
                if (res == gl.TIMEOUT_EXPIRED) {
                    setTimeout(check, intervalms);
                    return;
                }
                resolve();
            };

            check();
        });
    }

    /**
     * @internal
     */
    public _readPixelsAsync(x: number, y: number, w: number, h: number, format: number, type: number, outputBuffer: ArrayBufferView) {
        if (this._webGLVersion < 2) {
            throw new Error("_readPixelsAsync only work on WebGL2+");
        }

        const gl = <WebGL2RenderingContext>(this._gl as any);
        const buf = gl.createBuffer();
        gl.bindBuffer(gl.PIXEL_PACK_BUFFER, buf);
        gl.bufferData(gl.PIXEL_PACK_BUFFER, outputBuffer.byteLength, gl.STREAM_READ);
        gl.readPixels(x, y, w, h, format, type, 0);
        gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);

        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        if (!sync) {
            return null;
        }

        gl.flush();

        return this._clientWaitAsync(sync, 0, 10).then(() => {
            gl.deleteSync(sync);

            gl.bindBuffer(gl.PIXEL_PACK_BUFFER, buf);
            gl.getBufferSubData(gl.PIXEL_PACK_BUFFER, 0, outputBuffer);
            gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
            gl.deleteBuffer(buf);

            return outputBuffer;
        });
    }

    public override dispose(): void {
        this.hideLoadingUI();

        // Rescale PP
        if (this._rescalePostProcess) {
            this._rescalePostProcess.dispose();
        }

        _CommonDispose(this, this._renderingCanvas);

        super.dispose();
    }
}
