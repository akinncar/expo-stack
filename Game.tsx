import {
  View,
  TouchableWithoutFeedback,
  StyleSheet,
  Dimensions,
  Text,
  SafeAreaView,
  Platform,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
import { TweenMax, Linear } from 'gsap';

import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, Roboto_300Light } from '@expo-google-fonts/roboto';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import CubeMesh from './meshs/CubeMesh';
import { updateSpitter, randomColorRgb } from './utils/colors';

export default function Game({}): JSX.Element {
  const navigation = useNavigation();

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
      35,
      Dimensions.get('window').width / Dimensions.get('window').height,
      0.1,
      1000,
    ),
  );
  const [pointLight] = useState<PointLight>(
    new PointLight(0xffffff, 2, 1000, 1),
  );

  const [timer, setTimer] = useState<number | any>(null);
  const [animationCube, setAnimationCube] = useState<TweenMax>();
  const [gameActive, setGameActive] = useState<boolean>(true);
  const [score, setScore] = useState(0);
  const [scoreRecord, setScoreRecord] = useState(0);
  const [actualCubeIndex, setActualCubeIndex] = useState(0);
  const [cubes, setCubes] = useState<CubeMesh[]>([
    new CubeMesh(1.0, 1.0, cubeColors[0]),
    new CubeMesh(1.0, 1.0, cubeColors[0]),
  ]);

  useEffect(() => {
    retriveScoreData();
    startFrontMove();

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (score === cubeColors.length) {
      Platform.OS !== 'web' && Haptics.selectionAsync();
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

      let currentScoreRecord = await retriveScoreData();

      if (score > currentScoreRecord) {
        storeScoreRecord(score);
        setScoreRecord(score);
      }

      let multiplyY = Platform.OS === 'web' ? 8 : 14;

      TweenMax.to(camera.position, 3, {
        x: camera.position.x + score / 8,
        y: camera.position.y + score / multiplyY,
        z: camera.position.z + score / 8,
      });

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

    TweenMax.to(camera.position, 0.8, {
      y: camera.position.y + 0.2,
    });

    camera.lookAt(cubes[cubes.length - 1].position);
    pointLight.translateY(0.18);
    pointLight.translateZ(0.18);
    pointLight.lookAt(cubes[cubes.length - 1].position);

    setScore(score + 1);
  }

  function tweenZ(direction: number) {
    let multiplyScore = score > 20 ? 0.2 : score * 0.01;

    console.log(cubes);

    setAnimationCube(
      TweenMax.to(cubes[actualCubeIndex].position, 1.6 - multiplyScore, {
        z:
          direction === 0
            ? cubes[actualCubeIndex].position.z + 4
            : cubes[actualCubeIndex].position.z - 4,
        ease: Linear.easeNone,
        onComplete: () => {
          if (cubes[actualCubeIndex].position.z < 1.5) {
            direction = 0;
          } else if (cubes[actualCubeIndex].position.z > 4.5) {
            direction = 1;
          }
          tweenZ(direction);
        },
      }),
    );
  }

  function tweenX(direction: number) {
    let multiplyScore = score > 20 ? 0.2 : score * 0.01;

    setAnimationCube(
      TweenMax.to(cubes[actualCubeIndex].position, 1.6 - multiplyScore, {
        x:
          direction === 0
            ? cubes[actualCubeIndex].position.x + 4
            : cubes[actualCubeIndex].position.x - 4,

        ease: Linear.easeNone,
        onComplete: () => {
          if (cubes[actualCubeIndex].position.x < 1.5) {
            direction = 0;
          } else if (cubes[actualCubeIndex].position.x > 4.5) {
            direction = 1;
          }
          tweenX(direction);
        },
      }),
    );
  }

  function startFrontMove() {
    if (actualCubeIndex > 0) {
      if (actualCubeIndex & 1) {
        tweenZ(0);
      } else {
        tweenX(0);
      }
    }
  }

  function stopFrontMove() {
    animationCube.kill();
  }

  async function resetGame() {
    navigation.reset({
      routes: [{ name: 'Stack' }],
    });
  }

  async function storeScoreRecord(value: number) {
    try {
      await AsyncStorage.setItem(
        '@ExpoStackGame:scoreRecord',
        value.toString(),
      );
    } catch (error) {
      // Error saving data
    }
  }

  async function retriveScoreData() {
    try {
      const value = await AsyncStorage.getItem('@ExpoStackGame:scoreRecord');
      if (value !== null) {
        let record = parseInt(value);
        setScoreRecord(record);
        return record;
      }

      setScoreRecord(0);
      return 0;
    } catch (error) {
      // Error retrieving data
    }
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
            {fontsLoaded && (
              <View style={styles.scoreRecordContainer}>
                <MaterialCommunityIcons name="crown" size={32} color="#fff" />
                <Text style={styles.scoreRecord}>{scoreRecord}</Text>
              </View>
            )}
          </SafeAreaView>

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
              const { drawingBufferWidth: width, drawingBufferHeight: height } =
                gl;
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

  touch: {
    flex: 1,
    justifyContent: 'space-between',
  },

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

  scoreRecordContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },

  scoreRecord: {
    color: '#fff',
    fontSize: 32,
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
