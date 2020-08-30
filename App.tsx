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
import {
  View,
  TouchableWithoutFeedback,
  Dimensions,
  Alert,
  Text,
} from "react-native";

import { updateSpitter, randomColorRgb } from "./colors";

import { useFonts, Roboto_400Regular } from "@expo-google-fonts/roboto";

import { LinearGradient } from "expo-linear-gradient";

export default function App() {
  let timeout: number;
  let direction: number = 0;

  let [fontsLoaded] = useFonts({
    Roboto_400Regular,
  });

  const [cubeColors, setCubeColors] = useState(() => updateSpitter());
  const [backgroundColors] = useState<string[]>([
    randomColorRgb(),
    randomColorRgb(),
  ]);

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

  const [gameActive, setGameActive] = useState<boolean>(true);
  const [score, setScore] = useState(0);
  const [actualCubeIndex, setActualCubeIndex] = useState(0);
  const [cubes, setCubes] = useState<CubeMesh[]>([
    new CubeMesh(1.0, 1.0, cubeColors[0]),
    new CubeMesh(1.0, 1.0, cubeColors[0]),
  ]);

  useEffect(() => {
    startFrontMove();

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (score === cubeColors.length) {
      addCubeColors();
    }
  }, [score]);

  useEffect(() => {
    setActualCubeIndex(actualCubeIndex + 1);

    if (cubes.length == 2) {
      cubes[0].translateX(3);
      cubes[0].translateZ(3);
      cubes[1].translateX(3);
      cubes[1].translateZ(1);

      camera.position.set(6, 4, 6);
      camera.lookAt(cubes[0].position);
    }
  }, [cubes]);

  useEffect(() => {
    startFrontMove();

    scene.add(cubes[actualCubeIndex]);
    cubes[actualCubeIndex].translateY(actualCubeIndex * 0.2 + 0.2);
  }, [actualCubeIndex]);

  async function addCubeColors() {
    var newColors = await updateSpitter(cubeColors[cubeColors.length - 1]);
    console.log(cubeColors);
    console.log(newColors);
    setCubeColors([...cubeColors, ...newColors]);
  }

  async function addNewCube() {
    var actualCube = cubes[cubes.length - 1];
    let lastCube = cubes[cubes.length - 2];

    // console.log("actualCube position:", actualCube.position);
    // console.log("actualCube scale:", actualCube.scale);
    // console.log("lastCube position:", lastCube.position);
    // console.log("lastCube scale:", lastCube.scale);

    stopFrontMove();

    if (
      actualCube.position.z - actualCube.scale.z / 2 + actualCube.scale.z <
        lastCube.position.z - lastCube.scale.z / 2 ||
      actualCube.position.x - actualCube.scale.x / 2 + actualCube.scale.x <
        lastCube.position.x - lastCube.scale.x / 2 ||
      actualCube.position.z + actualCube.scale.z / 2 - actualCube.scale.z >
        lastCube.position.z + lastCube.scale.z / 2 ||
      actualCube.position.x + actualCube.scale.x / 2 - actualCube.scale.x >
        lastCube.position.x + lastCube.scale.x / 2
    ) {
      setGameActive(false);

      camera.position.setZ(camera.position.z + score);
      pointLight.position.setZ(camera.position.z + score);
      camera.lookAt(lastCube.position);
      pointLight.lookAt(lastCube.position);

      return;
    }

    let newCube: CubeMesh;

    let newCubeX =
      actualCube.scale.x -
      Math.abs(actualCube.position.x - lastCube.position.x);

    let newCubeZ =
      actualCube.scale.z -
      Math.abs(actualCube.position.z - lastCube.position.z);

    newCube = new CubeMesh(1, 1, cubeColors[score]);

    if (actualCubeIndex & 1) {
      actualCube.scale.set(newCubeX, newCube.scale.y, newCubeZ);
      actualCube.translateX((lastCube.position.x - actualCube.position.x) / 2);
      actualCube.translateZ((lastCube.position.z - actualCube.position.z) / 2);

      newCube.scale.set(newCubeX, newCube.scale.y, newCubeZ);
      newCube.position.setX(actualCube.position.x - 2.0);
      newCube.position.setZ(actualCube.position.z);
    } else {
      actualCube.scale.set(newCubeX, newCube.scale.y, newCubeZ);
      actualCube.translateX((lastCube.position.x - actualCube.position.x) / 2);
      actualCube.translateZ((lastCube.position.z - actualCube.position.z) / 2);

      newCube.scale.set(newCubeX, newCube.scale.y, newCubeZ);
      newCube.position.setX(actualCube.position.x);
      newCube.position.setZ(actualCube.position.z - 2.0);
    }

    let cubesCopy: CubeMesh[] = [...cubes];

    cubesCopy[cubes.length - 1] = actualCube;
    cubesCopy[cubes.length - 2] = lastCube;

    setCubes([...cubesCopy, newCube]);
    camera.translateY(0.18);
    camera.translateZ(0.18);
    camera.lookAt(cubes[cubes.length - 1].position);
    pointLight.translateY(0.18);
    pointLight.translateZ(0.18);
    pointLight.lookAt(cubes[cubes.length - 1].position);

    setScore(score + 1);
  }

  function startFrontMove() {
    if (actualCubeIndex > 0) {
      if (actualCubeIndex & 1) {
        if (cubes[actualCubeIndex].position.z < 1.5) {
          direction = 1;
        } else if (cubes[actualCubeIndex].position.z > 4.5) {
          direction = 0;
        }

        if (direction == 0) {
          cubes[actualCubeIndex].translateZ(-0.02);
        } else {
          cubes[actualCubeIndex].translateZ(+0.02);
        }

        setTimer(setTimeout(startFrontMove, 12));
      } else {
        if (cubes[actualCubeIndex].position.x < 1.5) {
          direction = 1;
        } else if (cubes[actualCubeIndex].position.x > 4.5) {
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

  async function resetGame() {
    window.location.reload(true);

    await setActualCubeIndex(0);

    console.log(scene);
    for (const cube of cubes) {
      if (cube.type == "Mesh") {
        console.log(cube);
        cube.geometry.dispose();
      }
    }
    console.log(scene);

    setTimer(null);

    setGameActive(true);
    setScore(0);
    // await setCubes([
    //   await new CubeMesh(1.0, 1.0, "#F46790"),
    //   await new CubeMesh(1.0, 1.0, "#F46790"),
    // ]);

    await cubes[1].translateY(0.2);

    await scene.add(cubes[0]);
    await scene.add(cubes[1]);

    camera.position.set(6, 4, 6);
    pointLight.position.set(6, 4, 6);

    camera.lookAt(cubes[0].position);
    pointLight.lookAt(cubes[0].position);

    const ambientLight = new AmbientLight(0x101010);
    scene.add(ambientLight);

    pointLight.position.set(8, 4, 14);

    scene.add(pointLight);

    const spotLight = new SpotLight(0xffffff, 0.5);
    spotLight.position.set(0, 500, 100);
    spotLight.lookAt(scene.position);
    scene.add(spotLight);

    return () => clearTimeout(timeout);
  }

  return (
    <LinearGradient
      style={{ flex: 1 }}
      colors={[backgroundColors[0], backgroundColors[1]]}
    >
      <TouchableWithoutFeedback
        style={{ flex: 1, justifyContent: "space-between" }}
        onPress={() => {
          gameActive ? addNewCube() : resetGame();
        }}
      >
        <View style={{ flex: 1 }}>
          <View
            style={{
              alignItems: "center",
              padding: 32,
              backgroundColor: "transparent",
            }}
          >
            {fontsLoaded && (
              <Text
                style={{
                  color: "#fff",
                  fontSize: 68,
                  fontFamily: "Roboto_400Regular",
                }}
              >
                {score}
              </Text>
            )}
          </View>

          {!gameActive && fontsLoaded && (
            <View
              style={{
                alignSelf: "center",
                zIndex: 0,
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontSize: 68,
                  fontFamily: "Roboto_400Regular",
                }}
              >
                TAP TO RESTART
              </Text>
            </View>
          )}

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

              scene.fog = new Fog(sceneColor, 1, 10000);
              // scene.add(new GridHelper(10, 10));

              const ambientLight = new AmbientLight(0x101010);
              scene.add(ambientLight);

              pointLight.position.set(8, 4, 14);

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
        </View>
      </TouchableWithoutFeedback>
    </LinearGradient>
  );
}

class CubeMesh extends Mesh {
  constructor(x: number, z: number, color: string | number) {
    super(
      new BoxBufferGeometry(x, 0.2, z),
      new MeshStandardMaterial({
        // map: new TextureLoader().load(require('./assets/icon.png')),
        color: color,
      })
    );
  }
}
