import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TermsAndConditionsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Terms and Conditions</Text>
        <Text style={styles.content}>
          {/* Add your terms and conditions content here */}
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
          Nullam in dui mauris. Vivamus hendrerit arcu sed erat molestie vehicula. 
          Sed auctor neque eu tellus rhoncus ut eleifend nibh porttitor.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
  }
});