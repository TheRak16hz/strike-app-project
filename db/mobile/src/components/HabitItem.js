import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Check, XSquare, Trash2, Edit2, Plus, Minus, Bell } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

const HabitItem = ({ habit, onToggle, onDelete, onEdit }) => {
  const { colors, isDark } = useTheme();
  
  const isQuantifiable = habit.type === 'quantifiable';
  const isInverse = habit.type === 'inverse';
  
  const target = isQuantifiable ? habit.target_value : habit.frequency_count;
  const isCompleted = habit.isCompletedToday;

  let progressPercentage = 0;
  if (target > 0) {
    progressPercentage = Math.min((habit.completedCountToday / target) * 100, 100);
  }

  const hReminder = habit.reminder_time ? habit.reminder_time.substring(0, 5) : null;
  
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  return (
    <View style={[styles.card, isCompleted ? styles.cardCompleted : null]}>
      <View style={styles.headerRow}>
        <View style={styles.titleInfo}>
          {hReminder && (
            <View style={styles.reminderBadge}>
              <Bell size={12} color={colors.textSecondary} />
              <Text style={styles.reminderText}>{hReminder}</Text>
            </View>
          )}
          <View style={styles.titleGroup}>
            <Text style={styles.icon}>{habit.icon || '🎯'}</Text>
            <Text style={[styles.title, isCompleted ? styles.textCompleted : null]}>
              {habit.title}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity onPress={() => onEdit(habit)} style={styles.actionBtn}>
            <Edit2 size={16} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(habit.id)} style={styles.actionBtn}>
            <Trash2 size={16} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

      {habit.description ? (
        <Text style={styles.description} numberOfLines={2}>
          {habit.description}
        </Text>
      ) : null}

      <View style={styles.footerRow}>
        <View style={styles.stats}>
          <Text style={styles.streakText}>🔥 {habit.currentStreak} días racha</Text>
          {isQuantifiable && (
            <Text style={styles.quantifiableStats}>
              {habit.completedCountToday} / {target} {habit.unit}
            </Text>
          )}
        </View>

        {isQuantifiable ? (
          <View style={styles.quantifiableControls}>
            <TouchableOpacity 
              style={[styles.qBtn, styles.qBtnDanger]} 
              onPress={() => onToggle(habit.id, -1)}
            >
              <Minus size={16} color={colors.danger} />
            </TouchableOpacity>
            
            <View style={styles.progressContainer}>
              <LinearGradient 
                colors={colors.primaryGradient}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={[styles.progressBar, { width: `${progressPercentage}%` }]} 
              />
            </View>

            <TouchableOpacity 
              style={[styles.qBtn, styles.qBtnSuccess]} 
              onPress={() => onToggle(habit.id, 1)}
            >
              <Plus size={16} color={colors.success} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={[
              styles.toggleBtn, 
              isCompleted ? styles.toggleCompleted : styles.togglePending,
              isInverse && !isCompleted ? styles.inversePending : null
            ]}
            onPress={() => onToggle(habit.id)}
          >
            {isInverse ? (
              isCompleted ? (
                <View style={styles.inverseRow}>
                  <Check size={18} color="#fff" />
                  <Text style={styles.btnTextWhite}>Auto</Text>
                </View>
              ) : (
                <XSquare size={20} color="#fff" />
              )
            ) : (
              isCompleted ? (
                <LinearGradient
                  colors={colors.primaryGradient}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={styles.gradientCheck}
                >
                  <Check size={20} color="#fff" />
                </LinearGradient>
              ) : (
                <Check size={20} color={colors.border} />
              )
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const getStyles = (colors, isDark) => StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: isDark ? colors.primary : '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.1 : 0.05,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardCompleted: {
    backgroundColor: colors.cardCompleted,
    borderColor: isDark ? colors.card : colors.border,
    opacity: 0.8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleInfo: {
    flex: 1,
  },
  reminderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reminderText: {
    fontSize: 10,
    color: colors.textSecondary,
    marginLeft: 4,
    fontWeight: '600',
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 20,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  textCompleted: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
  },
  actionBtn: {
    padding: 4,
    marginLeft: 8,
  },
  description: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  stats: {
    flexDirection: 'column',
  },
  streakText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f59e0b',
  },
  quantifiableStats: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  toggleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    overflow: 'hidden',
  },
  togglePending: {
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  toggleCompleted: {
    borderColor: 'transparent',
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  gradientCheck: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inversePending: {
    borderColor: colors.danger,
    backgroundColor: colors.danger,
  },
  inverseRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btnTextWhite: {
    color: '#fff',
    fontSize: 10,
    marginLeft: 2,
    fontWeight: 'bold',
  },
  quantifiableControls: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 16,
  },
  qBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  qBtnDanger: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerBg,
  },
  qBtnSuccess: {
    borderColor: colors.success,
    backgroundColor: colors.successBg,
  },
  progressContainer: {
    flex: 1,
    height: 10,
    backgroundColor: colors.border,
    borderRadius: 5,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 5,
  },
});

export default HabitItem;
