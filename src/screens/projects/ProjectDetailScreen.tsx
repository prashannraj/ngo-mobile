import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation, useRoute } from '@react-navigation/native';
import { apiClient } from '../../api/client';
import { formatDateTimeYmdHms } from '../../lib/date';
import { useAuth } from '../../context/AuthContext';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

async function fetchProject(id: string | number) {
  const res = await apiClient.get(`/projects/${id}`);
  return res.data?.data ?? res.data ?? null;
}

async function fetchTask(taskId: number) {
  const res = await apiClient.get(`/tasks/${taskId}`);
  return res.data?.data ?? res.data ?? null;
}

function canCompleteTask(roles: string[], userEmployeeId: number | null, taskAssignedToId: number | null) {
  const approverRoles = ['Admin', 'HR', 'Project Manager', 'Line Manager'];
  const isApprover = roles.some((r) => approverRoles.includes(r));
  const isAssigned = userEmployeeId != null && taskAssignedToId != null && userEmployeeId === taskAssignedToId;
  return isApprover || isAssigned;
}

export default function ProjectDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { id } = route.params as { id: string | number };

  const { user, token } = useAuth();
  const roles = (user?.roles ?? []) as string[];
  const userEmployeeId = user?.employee?.id ? Number(user.employee.id) : null;

  const projectQuery = useQuery({
    queryKey: ['projectDetail', id],
    queryFn: () => fetchProject(id),
  });

  const project = projectQuery.data;
  const tasks = (project?.tasks ?? []) as any[];

  const [completeTaskId, setCompleteTaskId] = useState<number | null>(null);
  const [progress, setProgress] = useState<string>('100');
  const [attachment, setAttachment] = useState<{ uri: string; name: string; mimeType?: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const [attachmentsTaskId, setAttachmentsTaskId] = useState<number | null>(null);
  const [taskAttachments, setTaskAttachments] = useState<any[]>([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);

  const downloadAttachment = async (taskId: number, attachmentId: number, originalName?: string) => {
    if (!token) {
      alert('Not authenticated.');
      return;
    }

    const base = apiClient.defaults.baseURL || '';
    const url = `${base}/tasks/${taskId}/attachments/${attachmentId}/download`;
    const safeName = String(originalName || `attachment-${attachmentId}`).split('/').pop() || `attachment-${attachmentId}`;
    const finalName = safeName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const baseDir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory ?? null;
    if (!baseDir) {
      alert('Storage is not available for downloads.');
      return;
    }
    const fileUri = `${baseDir}${finalName}`;

    try {
      const result = await FileSystem.downloadAsync(url, fileUri, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (result?.uri) await Sharing.shareAsync(result.uri);
    } catch (e: any) {
      alert(e?.message || 'Failed to download attachment');
    }
  };

  const openAttachments = async (taskId: number) => {
    setAttachmentsTaskId(taskId);
    setAttachmentsLoading(true);
    try {
      const task = await fetchTask(taskId);
      const atts = (task?.attachments ?? []) as any[];
      setTaskAttachments(atts);
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || 'Failed to load attachments');
    } finally {
      setAttachmentsLoading(false);
    }
  };

  const pickEvidence = async () => {
    const res = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
    });

    if (!res.canceled && res.assets?.length) {
      const asset = res.assets[0];
      setAttachment({
        uri: asset.uri,
        name: asset.name || 'evidence',
        mimeType: asset.mimeType || undefined,
      });
    }
  };

  const submitComplete = async () => {
    if (!completeTaskId) return;
    setBusy(true);
    try {
      const form = new FormData();
      form.append('progress', progress);

      if (attachment) {
        form.append('attachment', {
          uri: attachment.uri,
          type: attachment.mimeType || 'application/octet-stream',
          name: attachment.name,
        } as any);
      }

      await apiClient.post(`/tasks/${completeTaskId}/complete`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setCompleteTaskId(null);
      setProgress('100');
      setAttachment(null);
      await projectQuery.refetch();
    } catch (e: any) {
      alert(e.response?.data?.message || e.message || 'Failed to complete task');
    } finally {
      setBusy(false);
    }
  };

  const closeAttachments = () => {
    setAttachmentsTaskId(null);
    setTaskAttachments([]);
  };

  const isProjectLoading = projectQuery.isLoading;

  const back = () => navigation.goBack();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <View style={{ padding: 16, marginTop: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Pressable onPress={back}>
            <Text style={{ color: '#2563EB', fontWeight: '800' }}>Back</Text>
          </Pressable>
          <Text style={{ flex: 1, textAlign: 'center', fontSize: 22, fontWeight: '900' }}>
            {project?.name ?? 'Project'}
          </Text>
        </View>

        {projectQuery.isLoading ? (
          <View style={{ marginTop: 16 }}>
            <ActivityIndicator color="#2563EB" />
          </View>
        ) : null}

        <Text style={{ marginTop: 8, color: '#64748B', fontWeight: '700' }}>
          Code: {project?.code ?? '-'} | Status: {String(project?.status ?? '-').toUpperCase()}
        </Text>

        <View style={{ marginTop: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '900' }}>Tasks</Text>
          {tasks.length === 0 ? (
            <Text style={{ marginTop: 10, color: '#6B7280', fontWeight: '700' }}>No tasks found.</Text>
          ) : (
            <View style={{ marginTop: 10 }}>
              {tasks.map((t: any) => {
                const taskAssignedToId = t?.assignedTo?.id ? Number(t.assignedTo.id) : null;
                const assignedToMe = userEmployeeId != null && taskAssignedToId != null && userEmployeeId === taskAssignedToId;
                const canComplete = canCompleteTask(roles, userEmployeeId, taskAssignedToId);

                return (
                  <View
                    key={t.id}
                    style={{ backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 10 }}
                  >
                    <Text style={{ fontWeight: '900', color: '#0F172A' }}>{t.title ?? 'Task'}</Text>
                    <Text style={{ marginTop: 6, color: '#64748B', fontWeight: '700' }}>
                      Assigned: {t.assignedTo ? t.assignedTo.name ?? `${t.assignedTo.first_name ?? ''} ${t.assignedTo.last_name ?? ''}` : '-'}
                    </Text>
                    <Text style={{ marginTop: 6, color: '#64748B' }}>Due: {t.due_date ? formatDateTimeYmdHms(t.due_date) : '-'}</Text>
                    <Text style={{ marginTop: 6, color: '#64748B' }}>
                      Status: {String(t.status ?? '-').toUpperCase()} | Progress: {t.progress ?? '-'}
                    </Text>

                    <View style={{ flexDirection: 'row', marginTop: 12 }}>
                      {assignedToMe ? (
                        <Pressable
                          onPress={() => openAttachments(Number(t.id))}
                          style={{ flex: 1, backgroundColor: '#EEF2FF', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginRight: 8 }}
                        >
                          <Text style={{ color: '#3730A3', fontWeight: '900' }}>Files</Text>
                        </Pressable>
                      ) : null}

                      {canComplete && t.status !== 'completed' ? (
                        <Pressable
                          onPress={() => {
                            setCompleteTaskId(Number(t.id));
                            setProgress(String(t.progress ?? 100));
                            setAttachment(null);
                          }}
                          style={{ flex: 1, backgroundColor: '#2563EB', borderRadius: 12, paddingVertical: 12, alignItems: 'center', opacity: 1 }}
                        >
                          <Text style={{ color: '#fff', fontWeight: '900' }}>Complete</Text>
                        </Pressable>
                      ) : (
                        <View style={{ flex: 1 }} />
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Complete Task Modal (simple inline block) */}
        {completeTaskId ? (
          <View style={{ marginTop: 16, backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#F1F5F9' }}>
            <Text style={{ fontWeight: '900', fontSize: 16 }}>Complete Task #{completeTaskId}</Text>

            <Text style={{ marginTop: 10, fontWeight: '900' }}>Progress (0-100)</Text>
            <TextInput
              value={progress}
              onChangeText={(t) => setProgress(t)}
              keyboardType="numeric"
              style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, marginTop: 8 }}
            />

            <Pressable
              onPress={pickEvidence}
              disabled={busy}
              style={{ marginTop: 14, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}
            >
              <Text style={{ color: '#2563EB', fontWeight: '900' }}>{attachment ? `Selected: ${attachment.name}` : 'Pick evidence file (optional)'}</Text>
            </Pressable>

            <Pressable
              onPress={submitComplete}
              disabled={busy}
              style={{ marginTop: 14, backgroundColor: '#16A34A', borderRadius: 12, paddingVertical: 12, alignItems: 'center', opacity: busy ? 0.7 : 1 }}
            >
              <Text style={{ color: '#fff', fontWeight: '900' }}>{busy ? 'Submitting...' : 'Submit completion'}</Text>
            </Pressable>

            <Pressable onPress={() => setCompleteTaskId(null)} disabled={busy} style={{ marginTop: 10, alignItems: 'center' }}>
              <Text style={{ color: '#2563EB', fontWeight: '800' }}>Cancel</Text>
            </Pressable>
          </View>
        ) : null}

        {/* Attachments Modal (simple inline block) */}
        {attachmentsTaskId ? (
          <View style={{ marginTop: 16, backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#F1F5F9' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontWeight: '900', fontSize: 16, flex: 1 }}>Files for Task #{attachmentsTaskId}</Text>
              <Pressable onPress={closeAttachments}>
                <Text style={{ color: '#2563EB', fontWeight: '900' }}>Close</Text>
              </Pressable>
            </View>

            {attachmentsLoading ? (
              <View style={{ marginTop: 10 }}>
                <ActivityIndicator color="#2563EB" />
              </View>
            ) : taskAttachments.length === 0 ? (
              <Text style={{ marginTop: 12, color: '#6B7280', fontWeight: '700' }}>No attachments found.</Text>
            ) : (
              <View style={{ marginTop: 10 }}>
                {taskAttachments.map((a: any) => (
                  <View
                    key={a.id}
                    style={{ borderWidth: 1, borderColor: '#F1F5F9', borderRadius: 12, padding: 12, marginBottom: 10, backgroundColor: '#F9FAFB' }}
                  >
                    <Text style={{ fontWeight: '900', color: '#0F172A' }} numberOfLines={1}>
                      {a.original_name || `Attachment ${a.id}`}
                    </Text>
                    <Text style={{ marginTop: 6, color: '#64748B' }}>
                      Size: {a.size_bytes ? `${a.size_bytes} bytes` : '-'} | MIME: {a.mime_type ?? '-'}
                    </Text>

                    <Pressable
                      onPress={() => downloadAttachment(Number(attachmentsTaskId), Number(a.id), a.original_name)}
                      style={{ marginTop: 10, backgroundColor: '#2563EB', borderRadius: 12, paddingVertical: 10, alignItems: 'center' }}
                    >
                      <Text style={{ color: '#fff', fontWeight: '900' }}>Download</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

