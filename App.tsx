import { ExpoWebGLRenderingContext, GLView } from "expo-gl";
import { Renderer, TextureLoader } from "expo-three";
import React, { useEffect, useState } from "react";
import {
  AmbientLight,
  BoxBufferGeometry,
  Fog,
  GridHelper,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PointLight,
  Scene,
  SpotLight,
} from "three";
import { TouchableWithoutFeedback } from "react-native";

export default function App() {
  let timeout: number;
  let timer: number | any = null;

  let cubes: CubeMesh[] = [];
  let direction: number = 0;

  const [actualCubeIndex, setActualCubeIndex] = useState(1);

  cubes.push(new CubeMesh());
  cubes.push(new CubeMesh());

  useEffect(() => {
    cubes[1].translateY(0.1);

    startFrontMove();

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    console.log("actualCubeIndex:", actualCubeIndex);
    addNewCube();
  }, [actualCubeIndex]);

  async function addNewCube() {
    if (actualCubeIndex > 1) {
      stopFrontMove();
      cubes.push(new CubeMesh());
      cubes[actualCubeIndex].translateY(actualCubeIndex * 0.1);
      startFrontMove();
    }
  }

  function startFrontMove() {
    console.log(actualCubeIndex);

    if (cubes[actualCubeIndex].position.z < -1) {
      direction = 1;
    } else if (cubes[actualCubeIndex].position.z > 1) {
      direction = 0;
    }

    if (direction == 0) {
      cubes[actualCubeIndex].translateZ(-0.08);
    } else {
      cubes[actualCubeIndex].translateZ(+0.08);
    }

    timer = setTimeout(startFrontMove, 50);
  }

  function stopFrontMove() {
    clearTimeout(timer);
  }

  return (
    <TouchableWithoutFeedback
      style={{ flex: 1 }}
      onPress={() => {
        setActualCubeIndex(actualCubeIndex + 1);
      }}
    >
      <GLView
        style={{ flex: 1 }}
        onContextCreate={async (gl: ExpoWebGLRenderingContext) => {
          const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;
          const sceneColor = 0x6ad6f0;

          // Create a WebGLRenderer without a DOM element
          const renderer = new Renderer({ gl });
          renderer.setSize(width, height);
          renderer.setClearColor(sceneColor);

          const camera = new PerspectiveCamera(40, width / 800, 0.1, 1000);
          camera.position.set(3, 2, 3);

          const scene = new Scene();
          scene.fog = new Fog(sceneColor, 1, 10000);
          scene.add(new GridHelper(10, 10));

          const ambientLight = new AmbientLight(0x101010);
          scene.add(ambientLight);

          const pointLight = new PointLight(0xffffff, 2, 1000, 1);
          pointLight.position.set(0, 200, 200);
          scene.add(pointLight);

          const spotLight = new SpotLight(0xffffff, 0.5);
          spotLight.position.set(0, 500, 100);
          spotLight.lookAt(scene.position);
          scene.add(spotLight);

          scene.add(cubes[0]);
          scene.add(cubes[1]);

          camera.lookAt(cubes[0].position);

          // Setup an animation loop
          const render = () => {
            timeout = requestAnimationFrame(render);
            renderer.render(scene, camera);

            gl.endFrameEXP();
          };
          render();
        }}
      />
    </TouchableWithoutFeedback>
  );
}

class CubeMesh extends Mesh {
  constructor() {
    super(
      new BoxBufferGeometry(1.0, 0.1, 1.0),
      new MeshStandardMaterial({
        // map: new TextureLoader().load(require('./assets/icon.png')),
        color: 0xff0000,
      })
    );
  }
}
