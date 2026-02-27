import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { Bell, X } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const ReminderToast = ({ visible, title, message, onClose }) => {
  const { colors } = useTheme();
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 50,
        useNativeDriver: true,
        bounciness: 12,
      }).start();

      // Auto close after 5 seconds
      const timer = setTimeout(() => {
        closeToast();
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      Animated.timing(translateY, {
        toValue: -150,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const closeToast = () => {
    Animated.timing(translateY, {
      toValue: -150,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  return (
    <Animated.View style={[
      styles.container, 
      { 
        backgroundColor: colors.card,
        borderColor: colors.border,
        shadowColor: colors.primary,
        transform: [{ translateY }] 
      }
    ]}>
      <View style={styles.iconContainer}>
        <Bell size={20} color={colors.primary} />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
      </View>
      <TouchableOpacity onPress={closeToast} style={styles.closeBtn}>
        <X size={16} color={colors.textSecondary} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    width: width * 0.9,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 9999,
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
  },
  closeBtn: {
    padding: 4,
    marginLeft: 8,
  }
});

export default ReminderToast;
