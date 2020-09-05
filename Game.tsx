import {
  View,
  TouchableWithoutFeedback,
  StyleSheet,
  Dimensions,
  Text,
  SafeAreaView,
} from 'react-native';
import React, { useEffect, useState } from 'react';

import {
  AmbientLight,
  Fog,
  PerspectiveCamera,
  PointLight,
  Scene,
  SpotLight,
} from 'three';
import { Renderer } from 'expo-three';

import { ExpoWebGLRenderingContext, GLView } from 'expo-gl';
import { TweenMax } from 'gsap';

import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, Roboto_300Light } from '@expo-google-fonts/roboto';

import CubeMesh from './meshs/CubeMesh';
import { updateSpitter, randomColorRgb } from './utils/colors';

export default function Game(): JSX.Element {
  let timeout: number;
  let direction = 0;

  const [fontsLoaded] = useFonts({
    Roboto_300Light,
  });

  const [cubeColors, setCubeColors] = useState(() => updateSpitter());
  const [backgroundColors] = useState<string[]>([
    randomColorRgb(),
    randomColorRgb(),
  ]);

  const [scene] = useState<Scene>(new Scene());
  const [camera] = useState<PerspectiveCamera>(
    new PerspectiveCamera(
      25,
      Dimensions.get('window').width / Dimensions.get('window').height,
      0.01,
      1000,
    ),
  );
  const [pointLight] = useState<PointLight>(
    new PointLight(0xffffff, 2, 1000, 1),
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
    const newColors = await updateSpitter(cubeColors[cubeColors.length - 1]);

    setCubeColors([...cubeColors, ...newColors]);
  }

  async function addNewCube() {
    const actualCube: CubeMesh = cubes[cubes.length - 1];
    const lastCube: CubeMesh = cubes[cubes.length - 2];

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

      TweenMax.to(camera.position, 3, {
        x: camera.position.x + score / 3,
        y: camera.position.y + score / 3,
        z: camera.position.z + score / 3,
      });

      pointLight.position.setZ(camera.position.z + score);
      pointLight.lookAt(lastCube.position);

      return;
    }

    const newCubeX =
      actualCube.scale.x -
      Math.abs(actualCube.position.x - lastCube.position.x);

    const newCubeZ =
      actualCube.scale.z -
      Math.abs(actualCube.position.z - lastCube.position.z);

    const newCube = new CubeMesh(1, 1, cubeColors[score]);

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

    const cubesCopy: CubeMesh[] = [...cubes];

    cubesCopy[cubes.length - 1] = actualCube;
    cubesCopy[cubes.length - 2] = lastCube;

    setCubes([...cubesCopy, newCube]);

    TweenMax.to(camera.position, 1, {
      y: camera.position.y + 0.2,
    });

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

    return () => clearTimeout(timeout);
  }

  return (
    <LinearGradient
      style={styles.flex}
      colors={[backgroundColors[0], backgroundColors[1]]}
    >
      <TouchableWithoutFeedback
        style={styles.touch}
        onPress={() => {
          gameActive ? addNewCube() : resetGame();
        }}
      >
        <View style={styles.flex}>
          <SafeAreaView style={styles.scoreContainer}>
            {fontsLoaded && <Text style={styles.score}>{score}</Text>}
          </SafeAreaView>

          {!gameActive && fontsLoaded && (
            <View style={styles.restartContainer}>
              <Text style={styles.restart}>TAP TO RESTART</Text>
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

              const renderer = new Renderer({ gl });
              renderer.setSize(width, height);

              scene.fog = new Fog(sceneColor, 1, 10000);

              const ambientLight = new AmbientLight(0x101010);
              scene.add(ambientLight);

              pointLight.position.set(8, 4, 14);

              scene.add(pointLight);

              const spotLight = new SpotLight(0xffffff, 0.5);
              spotLight.position.set(0, 500, 100);
              spotLight.lookAt(scene.position);
              scene.add(spotLight);

              camera.lookAt(cubes[0].position);

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

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  touch: { flex: 1, justifyContent: 'space-between' },

  scoreContainer: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: 'transparent',
  },

  score: {
    color: '#fff',
    fontSize: 68,
    fontFamily: 'Roboto_300Light',
  },

  restartContainer: {
    alignSelf: 'center',
    zIndex: 0,
  },

  restart: {
    color: '#fff',
    fontSize: 32,
    textAlign: 'center',
    fontFamily: 'Roboto_300Light',
  },
});
