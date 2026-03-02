import React, { useState, useEffect, useMemo } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, Modal, Switch, LayoutAnimation, UIManager, Platform } from 'react-native';
import { Plus, Settings, X, Activity } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

import { initDB } from './src/db/database';
import { habitService } from './src/services/habitService';
import HabitItem from './src/components/HabitItem';
import HabitForm from './src/components/HabitForm';
import ReminderToast from './src/components/ReminderToast';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

function MainApp() {
  const { colors, toggleTheme, isDark } = useTheme();
  const [dbReady, setDbReady] = useState(false);
  const [habits, setHabits] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [toastConfig, setToastConfig] = useState(null);
  
  useEffect(() => {
    // 1. Init Database
    const setup = async () => {
      await initDB();
      setDbReady(true);
      await loadHabits();
    };
    setup();

    // Notificaciones en la app
    const checkReminders = () => {
      const now = new Date();
      const currentHHMM = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      habits.forEach(habit => {
        if (!habit.isCompletedToday && habit.reminder_time === currentHHMM) {
          setToastConfig({
            title: `¡Es hora de ${habit.title}!`,
            message: `Tienes programado este hábito.`,
          });
        }
      });
    };

    const interval = setInterval(checkReminders, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [habits]);

  const loadHabits = async () => {
    try {
      const data = await habitService.getHabits();
      setHabits(data || []);
    } catch (error) {
      console.error('Error loading habits:', error);
    }
  };

  // Actions
  const handleToggle = async (id, amount) => {
    await habitService.toggle(id, amount);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    await loadHabits(); 
  };

  const handleDelete = async (id) => {
    await habitService.delete(id);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    await loadHabits();
  };

  const handleEdit = (habit) => {
    setEditingHabit(habit);
    setModalVisible(true);
  };

  const handleSaveHabit = async (habitData) => {
    if (editingHabit) {
      await habitService.update(editingHabit.id, habitData);
    } else {
      await habitService.create(habitData);
    }
    setEditingHabit(null);
    setModalVisible(false);
    await loadHabits();
  };

  const openNewHabit = () => {
    setEditingHabit(null);
    setModalVisible(true);
  };

  const styles = useMemo(() => getStyles(colors), [colors]);

  if (!dbReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{marginTop: 10, color: colors.textSecondary}}>Cargando Base de datos...</Text>
      </View>
    );
  }

  // Calculate Progress
  const total = habits.length;
  const completed = habits.filter(h => h.isCompletedToday).length;
  const progressPercentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? "light" : "dark"} />
      
      <ReminderToast 
        visible={!!toastConfig} 
        title={toastConfig?.title} 
        message={toastConfig?.message} 
        onClose={() => setToastConfig(null)} 
      />

      <View style={styles.header}>
        <View style={styles.logoGroup}>
          <Activity color={colors.primary} size={32} />
          <Text style={styles.title}>Strike</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setSettingsVisible(true)}>
            <Settings color={colors.textSecondary} size={24} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.fabHeader} onPress={openNewHabit}>
            <Plus color="#fff" size={24} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressTextRow}>
          <Text style={styles.progressLabel}>Progreso Diario</Text>
          <Text style={styles.progressValue}>{progressPercentage}%</Text>
        </View>
        <View style={styles.progressBarBg}>
          <LinearGradient 
            colors={colors.primaryGradient}
            start={{x: 0, y: 0}} 
            end={{x: 1, y: 0}}
            style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} 
          />
        </View>
        <Text style={styles.progressDesc}>{completed} de {total} hábitos completados</Text>
      </View>

      <FlatList 
        data={habits}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <HabitItem 
            habit={item} 
            onToggle={handleToggle}
            onDelete={handleDelete}
            onEdit={handleEdit}
            colors={colors}
          />
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No tienes hábitos creados aún.</Text>
            <Text style={styles.emptySub}>Presiona el botón + para empezar tu primera racha.</Text>
          </View>
        )}
      />

      <HabitForm 
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditingHabit(null);
        }}
        onSubmit={handleSaveHabit}
        editingHabit={editingHabit}
        colors={colors}
      />

      {/* Settings Modal */}
      <Modal visible={settingsVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Configuración</Text>
              <TouchableOpacity onPress={() => setSettingsVisible(false)}>
                <X color={colors.textSecondary} size={24} />
              </TouchableOpacity>
            </View>
            
            <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.settingLabel}>Modo Oscuro</Text>
              <Switch 
                value={isDark} 
                onValueChange={toggleTheme}
                trackColor={{ false: '#cbd5e1', true: colors.primary }}
                thumbColor="#fff"
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <MainApp />
    </ThemeProvider>
  );
}

// Utils
function todayStr() {
  const t = new Date();
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${days[t.getDay()]}, ${t.getDate()} de ${months[t.getMonth()]}`;
}

const getStyles = (colors) => StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: colors.card,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    padding: 8,
    marginRight: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  fabHeader: {
    backgroundColor: colors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  progressSection: {
    padding: 20,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  progressValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
  },
  progressBarBg: {
    height: 10,
    backgroundColor: colors.border,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 5,
  },
  progressDesc: {
    marginTop: 8,
    fontSize: 12,
    color: colors.textSecondary,
  },
  listContent: {
    padding: 20,
    paddingBottom: 80,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 250,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  settingHint: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: -8,
    marginBottom: 16,
  }
});
