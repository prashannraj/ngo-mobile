import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiClient } from '../../api/client';
import { formatDateTimeYmdHms } from '../../lib/date';
import { useNavigation } from '@react-navigation/native';

const monthSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
});

type MonthValues = z.infer<typeof monthSchema>;

async function fetchPayrolls(month: string) {
  const res = await apiClient.get('/payrolls', { params: { month } });
  return res.data?.data ?? [];
}

async function fetchPayrollDetails(id: number) {
  const res = await apiClient.get(`/payrolls/${id}`);
  return res.data?.data ?? null;
}

export default function PayrollScreen() {
  const navigation = useNavigation<any>();

  const month = useMemo(() => new Date().toISOString().slice(0, 7), []);
  const form = useForm<MonthValues>({
    resolver: zodResolver(monthSchema),
    defaultValues: { month },
  });

  const selectedMonth = form.watch('month');

  const [selectedPayrollId, setSelectedPayrollId] = useState<number | null>(null);
  const [details, setDetails] = useState<any | null>(null);

  const payrollQuery = useQuery({
    queryKey: ['payrolls', selectedMonth],
    queryFn: () => fetchPayrolls(selectedMonth),
  });

  const openDetails = async (id: number) => {
    setSelectedPayrollId(id);
    setDetails(null);
    try {
      const d = await fetchPayrollDetails(id);
      setDetails(d);
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to load payslip');
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <View style={{ padding: 16, marginTop: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Pressable onPress={() => navigation.goBack()}>
            <Text style={{ color: '#2563EB', fontWeight: '800' }}>Back</Text>
          </Pressable>
          <Text style={{ flex: 1, textAlign: 'center', fontSize: 22, fontWeight: '900' }}>Payroll</Text>
        </View>

        <View style={{ marginTop: 12, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9', padding: 14 }}>
          <Text style={{ fontWeight: '900' }}>Month (YYYY-MM)</Text>
          <Text style={{ marginTop: 6, color: '#64748B' }}>
            Current month prefilled: {month}
          </Text>
          {/* Keep simple on mobile: user can still edit the field if needed */}
          <Text
            style={{
              marginTop: 10,
              backgroundColor: '#EEF2FF',
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 12,
              fontWeight: '900',
            }}
          >
            {selectedMonth}
          </Text>
        </View>

        <View style={{ marginTop: 16 }}>
          <Text style={{ fontWeight: '900', fontSize: 16 }}>Payslip Cycles</Text>
          {payrollQuery.isLoading ? (
            <View style={{ marginTop: 12 }}>
              <ActivityIndicator color="#2563EB" />
            </View>
          ) : payrollQuery.data?.length ? (
            <View style={{ marginTop: 12 }}>
              {payrollQuery.data.map((p: any) => (
                <Pressable
                  key={p.id}
                  onPress={() => openDetails(p.id)}
                  style={{ backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 10 }}
                >
                  <Text style={{ fontWeight: '900' }}>Employee: {p.employee?.designation?.name ?? ''}</Text>
                  <Text style={{ marginTop: 6, color: '#64748B' }}>Month: {p.month}</Text>
                  <Text style={{ marginTop: 6, color: '#64748B' }}>Status: {String(p.status).toUpperCase()}</Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <Text style={{ marginTop: 12, color: '#6B7280', fontWeight: '700' }}>No payrolls found.</Text>
          )}
        </View>

        {selectedPayrollId && details ? (
          <View style={{ marginTop: 16, backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#F1F5F9' }}>
            <Text style={{ fontWeight: '900', fontSize: 16 }}>Payslip Details (ID {details.id})</Text>
            <Text style={{ marginTop: 8, color: '#334155' }}>
              Month: {details.month} | Status: {String(details.status).toUpperCase()}
            </Text>
            <Text style={{ marginTop: 6, color: '#334155' }}>Basic Salary: {details.basic_salary ?? 0}</Text>
            <Text style={{ marginTop: 6, color: '#334155' }}>Allowances: {details.allowances ?? 0}</Text>
            <Text style={{ marginTop: 6, color: '#334155' }}>Deductions: {details.deductions ?? 0}</Text>
            <Text style={{ marginTop: 6, color: '#334155', fontWeight: '900' }}>Net Salary: {details.net_salary ?? 0}</Text>
            {details.payment_date ? (
              <Text style={{ marginTop: 6, color: '#64748B' }}>
                Payment Date: {formatDateTimeYmdHms(details.payment_date)}
              </Text>
            ) : null}
            <Pressable onPress={() => { setSelectedPayrollId(null); setDetails(null); }} style={{ marginTop: 14, backgroundColor: '#2563EB', borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '900' }}>Close</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

