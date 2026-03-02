import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { X, CheckCircle, Activity, Undo } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const EMOJI_LIST = ['🎯', '💧', '🏃', '📚', '🧘', '🥦', '💊', '💰', '💪', '🧠', '🛌', '☕'];

const HabitForm = ({ visible, onClose, onSubmit, editingHabit, colors }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('regular');
  const [targetValue, setTargetValue] = useState('1');
  const [unit, setUnit] = useState('');
  const [icon, setIcon] = useState('🎯');
  const [reminderTime, setReminderTime] = useState('');

  const styles = useMemo(() => getStyles(colors), [colors]);

  useEffect(() => {
    if (editingHabit) {
      setTitle(editingHabit.title || '');
      setDescription(editingHabit.description || '');
      setType(editingHabit.type || 'regular');
      setTargetValue(editingHabit.target_value ? editingHabit.target_value.toString() : '1');
      setUnit(editingHabit.unit || '');
      setIcon(editingHabit.icon || '🎯');
      setReminderTime(editingHabit.reminder_time ? editingHabit.reminder_time.substring(0, 5) : '');
    } else {
      resetForm();
    }
  }, [editingHabit, visible]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setType('regular');
    setTargetValue('1');
    setUnit('');
    setIcon('🎯');
    setReminderTime('');
  };

  const handleSubmit = () => {
    if (!title.trim()) return;

    const formattedReminder = reminderTime ? (reminderTime.length === 5 ? `${reminderTime}:00` : reminderTime) : null;

    onSubmit({
      title,
      description,
      type,
      target_value: parseInt(targetValue) || 1,
      unit,
      icon,
      reminder_time: formattedReminder,
      frequency_type: 'daily',
      frequency_count: 1,
      color: colors.primary,
    });
    
    resetForm();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{editingHabit ? 'Editar Hábito' : 'Nuevo Hábito'}</Text>
          <TouchableOpacity onPress={onClose}>
            <X color={colors.textSecondary} size={24} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Tipo de Hábito */}
          <Text style={styles.label}>Selecciona el Tipo</Text>
          <View style={styles.typeGrid}>
            <TouchableOpacity 
              style={[styles.typeCard, type === 'regular' && styles.typeCardActive]}
              onPress={() => setType('regular')}
            >
              <CheckCircle color={type === 'regular' ? colors.primary : colors.textSecondary} size={24} />
              <Text style={styles.typeTitle}>Regular</Text>
              <Text style={styles.typeDesc}>Marcar para completar</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.typeCard, type === 'quantifiable' && styles.typeCardActive]}
              onPress={() => setType('quantifiable')}
            >
              <Activity color={type === 'quantifiable' ? colors.primary : colors.textSecondary} size={24} />
              <Text style={styles.typeTitle}>Medible</Text>
              <Text style={styles.typeDesc}>Objetivo numérico</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.typeCard, type === 'inverse' && styles.typeCardActive]}
              onPress={() => setType('inverse')}
            >
              <Undo color={type === 'inverse' ? colors.primary : colors.textSecondary} size={24} />
              <Text style={styles.typeTitle}>Inverso</Text>
              <Text style={styles.typeDesc}>Automático, desmarcar si fallas</Text>
            </TouchableOpacity>
          </View>

          {/* Nombre y Detalles */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Nombre del hábito *</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Ej: Leer 10 páginas"
              placeholderTextColor={colors.textSecondary}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Descripción</Text>
            <TextInput 
              style={[styles.input, styles.textArea]} 
              placeholder="Detalles opcionales"
              placeholderTextColor={colors.textSecondary}
              value={description}
              onChangeText={setDescription}
              multiline
            />
          </View>

          {/* Ajustes Específicos */}
          {type === 'quantifiable' && (
            <View style={styles.row}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Meta Diaria</Text>
                <TextInput 
                  style={styles.input} 
                  keyboardType="numeric"
                  value={targetValue}
                  onChangeText={setTargetValue}
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Unidad</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="ej: vasos"
                  value={unit}
                  onChangeText={setUnit}
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>
          )}

          {/* Iconos */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Icono Temático</Text>
            <View style={styles.emojiList}>
              {EMOJI_LIST.map(e => (
                <TouchableOpacity 
                  key={e} 
                  style={[styles.emojiBtn, icon === e && styles.emojiBtnActive]}
                  onPress={() => setIcon(e)}
                >
                  <Text style={styles.emojiText}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Hora de Recordatorio (HH:MM)</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Ej: 15:00 o déjalo vacío"
              placeholderTextColor={colors.textSecondary}
              value={reminderTime}
              onChangeText={setReminderTime}
            />
          </View>

          <TouchableOpacity onPress={handleSubmit}>
            <LinearGradient
              colors={colors.primaryGradient}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.submitBtn}
            >
              <Text style={styles.submitText}>{editingHabit ? 'Guardar Cambios' : 'Crear Hábito'}</Text>
            </LinearGradient>
          </TouchableOpacity>
          <View style={{height: 40}} />
        </ScrollView>
      </View>
    </Modal>
  );
};

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  content: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    marginTop: 16,
  },
  typeGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  typeCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  typeCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryBg,
  },
  typeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginTop: 8,
  },
  typeDesc: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  formGroup: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  emojiList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  emojiBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emojiBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryBg,
  },
  emojiText: {
    fontSize: 20,
  },
  submitBtn: {
    // backgroundColor removed because of LinearGradient
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default HabitForm;
