import { Mesh, BoxBufferGeometry, MeshStandardMaterial } from "three";

export default class CubeMesh extends Mesh {
  constructor(x: number, z: number, color: string | number) {
    super(
      new BoxBufferGeometry(x, 0.2, z),
      new MeshStandardMaterial({
        color: color,
      })
    );
  }
}
