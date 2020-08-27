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
import { View, TouchableWithoutFeedback, Dimensions } from "react-native";

import { LinearGradient } from "expo-linear-gradient";

export default function App() {
  let timeout: number;
  let direction: number = 0;

  const [scene, setScene] = useState<Scene>(new Scene());
  const [camera, setCamera] = useState<PerspectiveCamera>(
    new PerspectiveCamera(
      25,
      Dimensions.get("window").width / Dimensions.get("window").height,
      0.01,
      1000
    )
  );
  const [pointLight, setPointLight] = useState<PointLight>(
    new PointLight(0xffffff, 2, 1000, 1)
  );

  const [timer, setTimer] = useState<number | any>(null);

  const [actualCubeIndex, setActualCubeIndex] = useState(0);
  const [cubes, setCubes] = useState<CubeMesh[]>([
    new CubeMesh(1.0, 1.0, "#F46790"),
    new CubeMesh(1.0, 1.0, "#F46790"),
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
    cubes[actualCubeIndex].translateY(actualCubeIndex * 0.2 + 0.2);
  }, [actualCubeIndex]);

  async function addNewCube() {
    let actualCube = cubes[cubes.length - 1];
    let lastCube = cubes[cubes.length - 2];

    let newCube: CubeMesh;

    if (actualCubeIndex & 1) {
      let newCubeZ =
        actualCube.scale.z -
        (lastCube.position.z - -Math.abs(actualCube.position.z));

      newCube = new CubeMesh(actualCube.scale.x, newCubeZ, "#F46790");
      newCube.translateZ(-(lastCube.position.z - actualCube.position.z) / 2);
    } else {
      let newCubeX =
        actualCube.scale.x -
        (lastCube.position.x - -Math.abs(actualCube.position.x));

      newCube = new CubeMesh(newCubeX, actualCube.scale.z, "#F46790");
      newCube.translateX(-(lastCube.position.x - actualCube.position.x) / 2);
    }

    // setCubes(
    //   cubes.map((cube: CubeMesh, index: number) =>
    //     index === cubes.length - 1 ? Object.assign({}, newCube) : cube
    //   )
    // );

    setCubes([...cubes, newCube]);
    camera.translateY(0.2);
    camera.translateZ(0.2);
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
    <LinearGradient style={{ flex: 1 }} colors={["#129fba", "#fff"]}>
      <TouchableWithoutFeedback
        style={{ flex: 1 }}
        onPress={() => {
          addNewCube();
        }}
      >
        <GLView
          style={{ flex: 1 }}
          onContextCreate={async (gl: ExpoWebGLRenderingContext) => {
            const {
              drawingBufferWidth: width,
              drawingBufferHeight: height,
            } = gl;
            const sceneColor = 0x129fba;

            // Create a WebGLRenderer without a DOM element
            const renderer = new Renderer({ gl });
            renderer.setSize(width, height);
            // renderer.setClearColor(sceneColor);

            camera.position.set(3, 5, 0);

            scene.fog = new Fog(sceneColor, 1, 10000);
            // scene.add(new GridHelper(10, 10));

            const ambientLight = new AmbientLight(0x101010);
            scene.add(ambientLight);

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
    </LinearGradient>
  );
}

class CubeMesh extends Mesh {
  constructor(x: number, z: number, color: string | number) {
    super(
      new BoxBufferGeometry(x ?? 1.0, 0.2, z ?? 1.0),
      new MeshStandardMaterial({
        // map: new TextureLoader().load(require('./assets/icon.png')),
        color: color,
      })
    );
  }
}
