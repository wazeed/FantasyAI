import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import type { LinearGradientProps } from 'react-native-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../contexts/ThemeContext';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle,
  withSpring,
  withTiming
} from 'react-native-reanimated';

interface CategoryTileProps {
  title: string;
  subtitle: string;
  iconName: keyof typeof Ionicons.glyphMap;
  colors: string[];
  onPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
}

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

const CategoryTile: React.FC<CategoryTileProps> = ({ 
  title, 
  subtitle, 
  iconName, 
  colors,
  onPress,
  onPressIn,
  onPressOut
}) => {
  const { isDarkMode } = React.useContext(ThemeContext);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      flex: 1, // Make sure the animated view fills its container
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
    onPressIn?.();
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
    onPressOut?.();
  };

  return (
    <Animated.View 
      style={[styles.container, animatedStyle]}
      onTouchStart={handlePressIn}
      onTouchEnd={() => {
        handlePressOut();
        onPress?.();
      }}
      onTouchCancel={handlePressOut}
    >
      <AnimatedLinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons 
              name={iconName} 
              size={26} 
              color="#FFFFFF" 
            />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">{title}</Text>
            <Text style={styles.subtitle} numberOfLines={2} ellipsizeMode="tail">{subtitle}</Text>
          </View>
        </View>
      </AnimatedLinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  gradient: {
    flex: 1,
    padding: 18,
    borderRadius: 24,
  },
  content: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  iconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 17,
  },
});

export default CategoryTile;