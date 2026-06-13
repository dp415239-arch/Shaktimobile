import { Audio } from 'expo-av';

let clickSound = null;
let saveSound = null;
let deleteSound = null;
let errorSound = null;
let toggleSound = null;

export const preloadSounds = async () => {
  try {
    // Create simple beep sounds using Audio API
    // For production, you would load actual sound files
    console.log('Sounds ready');
  } catch (error) {
    console.error('Sound preload error:', error);
  }
};

export const playClickSound = async () => {
  try {
    // Using Audio from expo-av
    const { sound } = await Audio.Sound.createAsync(
      require('../assets/sounds/click.mp3')
    );
    await sound.playAsync();
    setTimeout(() => sound.unloadAsync(), 1000);
  } catch (error) {
    // Silent fail if sound not available
  }
};

export const playSaveSound = async () => {
  try {
    const { sound } = await Audio.Sound.createAsync(
      require('../assets/sounds/save.mp3')
    );
    await sound.playAsync();
    setTimeout(() => sound.unloadAsync(), 1000);
  } catch (error) {}
};

export const playDeleteSound = async () => {
  try {
    const { sound } = await Audio.Sound.createAsync(
      require('../assets/sounds/delete.mp3')
    );
    await sound.playAsync();
    setTimeout(() => sound.unloadAsync(), 1000);
  } catch (error) {}
};

export const playErrorSound = async () => {
  try {
    const { sound } = await Audio.Sound.createAsync(
      require('../assets/sounds/error.mp3')
    );
    await sound.playAsync();
    setTimeout(() => sound.unloadAsync(), 1000);
  } catch (error) {}
};

export const playToggleSound = async () => {
  try {
    const { sound } = await Audio.Sound.createAsync(
      require('../assets/sounds/toggle.mp3')
    );
    await sound.playAsync();
    setTimeout(() => sound.unloadAsync(), 1000);
  } catch (error) {}
};
