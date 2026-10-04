/** The parts of gifenc (which ships no types) that scripts/capture.ts uses. */
declare module 'gifenc' {
  export type Palette = number[][];

  export interface FrameOptions {
    palette?: Palette;
    /** Hundredths of a second are what GIF stores; this is in milliseconds. */
    delay?: number;
    /** 0: loop forever. */
    repeat?: number;
    transparent?: boolean;
    transparentIndex?: number;
    /** 1: leave the frame in place, so the next one draws over it. */
    dispose?: number;
  }

  export interface Encoder {
    writeFrame(index: Uint8Array, width: number, height: number, options?: FrameOptions): void;
    finish(): void;
    bytes(): Uint8Array;
  }

  const gifenc: {
    GIFEncoder(): Encoder;
    quantize(rgba: Uint8Array | Uint8ClampedArray, maxColors: number): Palette;
    applyPalette(rgba: Uint8Array | Uint8ClampedArray, palette: Palette): Uint8Array;
  };
  export default gifenc;
}
