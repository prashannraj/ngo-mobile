import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { radius, spacing, typography } from '../theme/tokens';

export type SelectOption = { label: string; value: string };

export function AppSelect({
  label,
  value,
  placeholder = 'Select...',
  options,
  onChange,
  error,
}: {
  label: string;
  value?: string;
  placeholder?: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  error?: string | null;
}) {
  const [open, setOpen] = useState(false);

  const selectedLabel = useMemo(() => {
    const hit = options.find((o) => o.value === value);
    return hit?.label ?? '';
  }, [options, value]);

  return (
    <View style={{ marginTop: spacing.md }}>
      <Text style={[typography.body, { fontWeight: '900' }]}>{label}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        style={{
          marginTop: spacing.xs,
          borderWidth: 1,
          borderColor: error ? colors.danger : '#E5E7EB',
          borderRadius: radius.sm,
          padding: 12,
          backgroundColor: '#fff',
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Text style={{ flex: 1, fontWeight: '700', color: selectedLabel ? colors.text : '#94A3B8' }}>
          {selectedLabel || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#64748B" />
      </Pressable>
      {!!error ? <Text style={{ color: colors.danger, marginTop: spacing.xs, fontWeight: '700' }}>{error}</Text> : null}

      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          onPress={() => setOpen(false)}
          style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', padding: spacing.lg, justifyContent: 'center' }}
        >
          <Pressable
            onPress={() => undefined}
            style={{ backgroundColor: '#fff', borderRadius: radius.xl, overflow: 'hidden', maxHeight: '75%' }}
          >
            <View style={{ padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
              <Text style={[typography.h2]}>{label}</Text>
              <Text style={[typography.muted, { marginTop: spacing.xs }]}>Tap to select</Text>
            </View>
            <ScrollView>
              {options.map((o) => {
                const active = o.value === value;
                return (
                  <Pressable
                    key={o.value}
                    onPress={() => {
                      onChange(o.value);
                      setOpen(false);
                    }}
                    style={{
                      paddingHorizontal: spacing.lg,
                      paddingVertical: spacing.md,
                      flexDirection: 'row',
                      alignItems: 'center',
                      borderBottomWidth: 1,
                      borderBottomColor: '#F1F5F9',
                      backgroundColor: active ? '#EEF2FF' : '#fff',
                    }}
                  >
                    <Text style={{ flex: 1, fontWeight: '800', color: colors.text }}>{o.label}</Text>
                    {active ? <Ionicons name="checkmark" size={18} color={colors.primary} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

