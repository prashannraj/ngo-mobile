import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRoute } from '@react-navigation/native';
import { apiClient } from '../../api/client';
import { formatDateTimeYmdHms } from '../../lib/date';
import { useAuth } from '../../context/AuthContext';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { AppButton, AppCard, AppHeader, AppInput, EmptyState, LoadingState } from '../../components';
import { colors } from '../../theme/colors';
import { radius, spacing, typography } from '../../theme/tokens';

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
  const qc = useQueryClient();
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
  const [attachmentsTaskId, setAttachmentsTaskId] = useState<number | null>(null);
  const [downloadBusyId, setDownloadBusyId] = useState<number | null>(null);

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
  };

  const taskQuery = useQuery({
    queryKey: ['taskDetail', attachmentsTaskId],
    queryFn: () => fetchTask(Number(attachmentsTaskId)),
    enabled: !!attachmentsTaskId,
  });

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

  const completeTask = useMutation({
    mutationFn: async () => {
      if (!completeTaskId) return;
      const p = Math.max(0, Math.min(100, Number(progress || 0)));
      const form = new FormData();
      form.append('progress', String(p));

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
    },
    onSuccess: async () => {
      setCompleteTaskId(null);
      setProgress('100');
      setAttachment(null);
      await qc.invalidateQueries({ queryKey: ['projectDetail', id] });
    },
    onError: (e: any) => alert(e.response?.data?.message || e.message || 'Failed to complete task'),
  });

  const closeAttachments = () => {
    setAttachmentsTaskId(null);
  };

  const isProjectLoading = projectQuery.isLoading;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader title={project?.name ?? 'Project'} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        {projectQuery.isLoading ? (
          <LoadingState />
        ) : !project ? (
          <EmptyState title="Project not found" subtitle="Please go back and try again." />
        ) : (
          <>
            <Text style={[typography.muted]}>
              Code: {project?.code ?? '-'} | Status: {String(project?.status ?? '-').toUpperCase()}
            </Text>

            <View style={{ marginTop: spacing.lg }}>
              <Text style={[typography.h2]}>Tasks</Text>
              {tasks.length === 0 ? (
                <EmptyState title="No tasks found" subtitle="This project has no tasks yet." />
              ) : (
                <View style={{ marginTop: spacing.sm }}>
                  {tasks.map((t: any) => {
                    const taskAssignedToId = t?.assignedTo?.id ? Number(t.assignedTo.id) : null;
                    const assignedToMe = userEmployeeId != null && taskAssignedToId != null && userEmployeeId === taskAssignedToId;
                    const canComplete = canCompleteTask(roles, userEmployeeId, taskAssignedToId);

                    return (
                      <AppCard key={t.id} style={{ marginBottom: spacing.sm }}>
                        <Text style={{ fontWeight: '900', color: colors.text }}>{t.title ?? 'Task'}</Text>
                        <Text style={[typography.muted, { marginTop: spacing.xs }]}>
                          Assigned:{' '}
                          {t.assignedTo ? t.assignedTo.name ?? `${t.assignedTo.first_name ?? ''} ${t.assignedTo.last_name ?? ''}` : '-'}
                        </Text>
                        <Text style={[typography.muted, { marginTop: spacing.xs }]}>
                          Due: {t.due_date ? formatDateTimeYmdHms(t.due_date) : '-'}
                        </Text>
                        <Text style={[typography.muted, { marginTop: spacing.xs }]}>
                          Status: {String(t.status ?? '-').toUpperCase()} | Progress: {t.progress ?? '-'}
                        </Text>

                        <View style={{ flexDirection: 'row', gap: 10, marginTop: spacing.md }}>
                          {assignedToMe ? (
                            <AppButton title="Files" variant="soft" onPress={() => openAttachments(Number(t.id))} style={{ flex: 1 }} />
                          ) : (
                            <View style={{ flex: 1 }} />
                          )}

                          {canComplete && t.status !== 'completed' ? (
                            <AppButton
                              title="Complete"
                              onPress={() => {
                                setCompleteTaskId(Number(t.id));
                                setProgress(String(t.progress ?? 100));
                                setAttachment(null);
                              }}
                              style={{ flex: 1 }}
                            />
                          ) : (
                            <View style={{ flex: 1 }} />
                          )}
                        </View>
                      </AppCard>
                    );
                  })}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      <Modal transparent visible={!!completeTaskId} animationType="fade" onRequestClose={() => setCompleteTaskId(null)}>
        <Pressable
          onPress={() => setCompleteTaskId(null)}
          style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', padding: spacing.lg, justifyContent: 'center' }}
        >
          <Pressable
            onPress={() => undefined}
            style={{ backgroundColor: '#fff', borderRadius: radius.xl, overflow: 'hidden' }}
          >
            <View style={{ padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
              <Text style={[typography.h2]}>Complete Task #{completeTaskId ?? ''}</Text>
              <Text style={[typography.muted, { marginTop: spacing.xs }]}>Update progress and optionally attach evidence.</Text>
            </View>
            <View style={{ padding: spacing.lg }}>
              <AppInput
                label="Progress (0-100)"
                value={progress}
                onChangeText={setProgress}
                keyboardType="numeric"
                placeholder="100"
              />

              <AppButton
                title={attachment ? `Selected: ${attachment.name}` : 'Pick evidence file (optional)'}
                variant="outline"
                onPress={pickEvidence}
                disabled={completeTask.isPending}
                style={{ marginTop: spacing.md }}
              />

              <AppButton
                title={completeTask.isPending ? 'Submitting...' : 'Submit completion'}
                variant="primary"
                onPress={() => completeTask.mutate()}
                loading={completeTask.isPending}
                style={{ marginTop: spacing.md }}
              />
              <AppButton
                title="Cancel"
                variant="outline"
                onPress={() => setCompleteTaskId(null)}
                disabled={completeTask.isPending}
                style={{ marginTop: spacing.md }}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal transparent visible={!!attachmentsTaskId} animationType="fade" onRequestClose={closeAttachments}>
        <Pressable
          onPress={closeAttachments}
          style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', padding: spacing.lg, justifyContent: 'center' }}
        >
          <Pressable
            onPress={() => undefined}
            style={{ backgroundColor: '#fff', borderRadius: radius.xl, overflow: 'hidden', maxHeight: '80%' }}
          >
            <View style={{ padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[typography.h2, { flex: 1 }]}>Files</Text>
              <AppButton title="Close" variant="outline" onPress={closeAttachments} />
            </View>

            {taskQuery.isLoading ? (
              <LoadingState />
            ) : (
              <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
                {((taskQuery.data?.attachments ?? []) as any[]).length === 0 ? (
                  <EmptyState title="No attachments" subtitle="No files were uploaded for this task." />
                ) : (
                  ((taskQuery.data?.attachments ?? []) as any[]).map((a: any) => (
                    <AppCard key={a.id} style={{ marginBottom: spacing.sm, backgroundColor: '#F8FAFC' }}>
                      <Text style={{ fontWeight: '900', color: colors.text }} numberOfLines={1}>
                        {a.original_name || `Attachment ${a.id}`}
                      </Text>
                      <Text style={[typography.muted, { marginTop: spacing.xs }]}>
                        Size: {a.size_bytes ? `${a.size_bytes} bytes` : '-'} | MIME: {a.mime_type ?? '-'}
                      </Text>

                      <AppButton
                        title={downloadBusyId === a.id ? 'Downloading...' : 'Download'}
                        onPress={async () => {
                          setDownloadBusyId(a.id);
                          try {
                            await downloadAttachment(Number(attachmentsTaskId), Number(a.id), a.original_name);
                          } finally {
                            setDownloadBusyId(null);
                          }
                        }}
                        loading={downloadBusyId === a.id}
                        style={{ marginTop: spacing.md }}
                      />
                    </AppCard>
                  ))
                )}
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

