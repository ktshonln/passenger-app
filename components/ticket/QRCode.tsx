import React from 'react';
import { View, StyleSheet } from 'react-native';

const QRCode: React.FC<{ value: string; size?: number }> = ({ 
  value, 
  size = 150 
}) => {
  const gridSize = 21;
  const moduleSize = Math.floor(size / gridSize);
  const actualSize = moduleSize * gridSize;
  
  // Position patterns for QR code
  const positionPatterns = [
    // Top-left
    { x: 0, y: 0, size: 7 },
    // Top-right
    { x: 14, y: 0, size: 7 },
    // Bottom-left
    { x: 0, y: 14, size: 7 }
  ];
  
  // Timing patterns
  const timingPattern = Array.from({ length: gridSize - 14 }, (_, i) => i + 7);
  
  // Generate random modules for demo
  const randomModules = [];
  for (let i = 0; i < 150; i++) {
    const x = Math.floor(Math.random() * gridSize);
    const y = Math.floor(Math.random() * gridSize);
    
    // Skip position pattern areas
    let skip = false;
    for (const pattern of positionPatterns) {
      if (x >= pattern.x && x < pattern.x + pattern.size &&
          y >= pattern.y && y < pattern.y + pattern.size) {
        skip = true;
        break;
      }
    }
    // Skip timing pattern areas
    if (!skip && ((y === 6 && timingPattern.includes(x)) || 
                  (x === 6 && timingPattern.includes(y)))) {
      skip = true;
    }
    
    if (!skip) {
      randomModules.push({ x, y });
    }
  }
  
  return (
    <View style={[styles.container, { width: actualSize, height: actualSize }]}>
      {/* Draw position patterns */}
      {positionPatterns.map((pattern, idx) => (
        <View
          key={`pattern-${idx}`}
          style={[
            styles.positionPatternOuter,
            {
              left: pattern.x * moduleSize,
              top: pattern.y * moduleSize,
              width: pattern.size * moduleSize,
              height: pattern.size * moduleSize
            }
          ]}
        >
          <View style={[styles.positionPatternInner, { width: (pattern.size - 2) * moduleSize, height: (pattern.size - 2) * moduleSize }]} />
          <View style={[styles.positionPatternCenter, { width: (pattern.size - 4) * moduleSize, height: (pattern.size - 4) * moduleSize }]} />
        </View>
      ))}
      
      {/* Draw timing patterns */}
      {timingPattern.map((x, idx) => (
        <React.Fragment key={`timing-${idx}`}>
          <View
            style={[
              styles.module,
              {
                left: x * moduleSize,
                top: 6 * moduleSize,
                width: moduleSize,
                height: moduleSize,
                backgroundColor: idx % 2 === 0 ? '#000' : '#fff'
              }
            ]}
          />
          <View
            style={[
              styles.module,
              {
                left: 6 * moduleSize,
                top: x * moduleSize,
                width: moduleSize,
                height: moduleSize,
                backgroundColor: idx % 2 === 0 ? '#000' : '#fff'
              }
            ]}
          />
        </React.Fragment>
      ))}
      
      {/* Draw random modules */}
      {randomModules.map((module, idx) => (
        <View
          key={`module-${idx}`}
          style={[
            styles.module,
            {
              left: module.x * moduleSize,
              top: module.y * moduleSize,
              width: moduleSize,
              height: moduleSize
            }
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    position: 'relative'
  },
  module: {
    position: 'absolute',
    backgroundColor: '#000'
  },
  positionPatternOuter: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#000',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center'
  },
  positionPatternInner: {
    borderWidth: 2,
    borderColor: '#000',
    backgroundColor: '#fff'
  },
  positionPatternCenter: {
    position: 'absolute',
    backgroundColor: '#000'
  }
});

export default QRCode;