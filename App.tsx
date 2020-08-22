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
  // let timer:number | any = null;

  // let cubes: CubeMesh[] = [];
  let direction: number = 0;

  const [scene, setScene] = useState<Scene>(new Scene());
  const [camera, setCamera] = useState<PerspectiveCamera>(
    new PerspectiveCamera(25, 2, 1, 1000)
  );
  const [timer, setTimer] = useState<number | any>(null);

  const [actualCubeIndex, setActualCubeIndex] = useState(0);
  const [cubes, setCubes] = useState<CubeMesh[]>([
    new CubeMesh(),
    new CubeMesh(),
  ]);

  useEffect(() => {
    startFrontMove();

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    setActualCubeIndex(actualCubeIndex + 1);
  }, [cubes]);

  useEffect(() => {
    console.log("actualCubeIndex:", actualCubeIndex);

    if (actualCubeIndex == 1) {
      startFrontMove();
    }

    if (actualCubeIndex > 1) {
      stopFrontMove();
      startFrontMove();
    }

    scene.add(cubes[actualCubeIndex]);
    cubes[actualCubeIndex].translateY(actualCubeIndex * 0.2);
  }, [actualCubeIndex]);

  async function addNewCube() {
    setCubes([...cubes, new CubeMesh()]);
    camera.translateY(0.2);
    camera.translateZ(0.2);
    // await startFrontMove();
  }

  function startFrontMove() {
    if (actualCubeIndex > 0) {
      if (actualCubeIndex & 1) {
        if (cubes[actualCubeIndex].position.z < -1.3) {
          direction = 1;
        } else if (cubes[actualCubeIndex].position.z > 1.3) {
          direction = 0;
        }

        if (direction == 0) {
          cubes[actualCubeIndex].translateZ(-0.02);
        } else {
          cubes[actualCubeIndex].translateZ(+0.02);
        }

        setTimer(setTimeout(startFrontMove, 12));
      } else {
        if (cubes[actualCubeIndex].position.x < -1.3) {
          direction = 1;
        } else if (cubes[actualCubeIndex].position.x > 1.3) {
          direction = 0;
        }

        if (direction == 0) {
          cubes[actualCubeIndex].translateX(-0.02);
        } else {
          cubes[actualCubeIndex].translateX(+0.02);
        }

        setTimer(setTimeout(startFrontMove, 12));
      }
    }
  }

  function stopFrontMove() {
    clearTimeout(timer);
  }

  return (
    <TouchableWithoutFeedback
      style={{ flex: 1 }}
      onPress={() => {
        addNewCube();
      }}
    >
      <GLView
        style={{ flex: 1 }}
        onContextCreate={async (gl: ExpoWebGLRenderingContext) => {
          console.log("oi");

          const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;
          const sceneColor = 0x6ad6f0;

          // Create a WebGLRenderer without a DOM element
          const renderer = new Renderer({ gl });
          renderer.setSize(width, height);
          renderer.setClearColor(sceneColor);

          camera.position.set(3, 2, 3);

          scene.fog = new Fog(sceneColor, 1, 10000);
          // scene.add(new GridHelper(10, 10));

          const ambientLight = new AmbientLight(0x101010);
          scene.add(ambientLight);

          const pointLight = new PointLight(0xffffff, 2, 1000, 1);
          pointLight.position.set(3, 2, 16);

          scene.add(pointLight);

          const spotLight = new SpotLight(0xffffff, 0.5);
          spotLight.position.set(0, 500, 100);
          spotLight.lookAt(scene.position);
          scene.add(spotLight);

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
      new BoxBufferGeometry(1.0, 0.2, 1.0),
      new MeshStandardMaterial({
        // map: new TextureLoader().load(require('./assets/icon.png')),
        color: 0xff0000,
      })
    );
  }
}
