import 'react-native-gesture-handler';
import React from 'react';

import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { StatusBar } from 'expo-status-bar';

import Game from './Game';

export default function App(): JSX.Element {
  const Drawer = createDrawerNavigator();

  return (
    <NavigationContainer>
      <Drawer.Navigator screenOptions={{
        headerShown: false
      }
      }>
        <Drawer.Screen name="Stack" component={Game} />
      </Drawer.Navigator>
      <StatusBar hidden />
    </NavigationContainer>
  );
}
