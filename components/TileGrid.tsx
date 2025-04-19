import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';

interface TileGridProps {
  children: React.ReactNode;
  columns?: number;
  gap?: number;
}

const TileGrid: React.FC<TileGridProps> = ({ 
  children, 
  columns = 2, 
  gap = 16 
}) => {
  const { isDarkMode } = React.useContext(ThemeContext);
  const { width } = Dimensions.get('window');
  
  // Calculate tile width based on screen width, columns and gap
  const tileWidth = (width - (gap * (columns + 1))) / columns;

  // Convert children to array for easier manipulation
  const childrenArray = React.Children.toArray(children);

  return (
    <View style={[styles.container, { paddingHorizontal: gap }]}>
      {Array.from({ length: Math.ceil(childrenArray.length / columns) }).map((_, rowIndex) => (
        <View key={`row-${rowIndex}`} style={[styles.row, { marginBottom: gap }]}>
          {childrenArray
            .slice(rowIndex * columns, rowIndex * columns + columns)
            .map((child, colIndex) => (
              <View 
                key={`col-${rowIndex}-${colIndex}`} 
                style={{ 
                  width: tileWidth,
                  marginLeft: colIndex === 0 ? 0 : gap 
                }}
              >
                {child}
              </View>
            ))}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
});

export default TileGrid;