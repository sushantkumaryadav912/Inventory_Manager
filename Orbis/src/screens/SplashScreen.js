// src/screens/SplashScreen.js
import React, { useEffect } from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';
import { colors } from '../theme';

const { width, height } = Dimensions.get('window');

const SplashScreen = () => {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/splashscreen/splash.jpg')}
        style={styles.image}
        resizeMode="cover"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary[600],
  },
  image: {
    width: width,
    height: height,
  },
});

export default SplashScreen;
