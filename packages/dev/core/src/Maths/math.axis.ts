import { Vector3 } from "./math.vector";

/** Defines supported spaces */
export const enum Space {
    /** Local (object) space */
    LOCAL = 0,
    /** World space */
    WORLD = 1,
    /** Bone space */
    BONE = 2,
}

/** Defines the 3 main axes */
export const axis = {
    /** X axis */
    x: new Vector3(1.0, 0.0, 0.0),
    X: new Vector3(1.0, 0.0, 0.0),
    /** Y axis */
    y: new Vector3(0.0, 1.0, 0.0),
    Y: new Vector3(0.0, 1.0, 0.0),
    /** Z axis */
    z: new Vector3(0.0, 0.0, 1.0),
    Z: new Vector3(0.0, 0.0, 1.0),
};

/** @deprecated */
export const Axis = axis;

/**
 * Defines cartesian components.
 */
export const enum Coordinate {
    /** X axis */
    X,
    /** Y axis */
    Y,
    /** Z axis */
    Z,
}
