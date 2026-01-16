import React, { useState, useEffect, useRef, useMemo, type ChangeEvent } from 'react';
import { createPortal } from 'react-dom';
import { ThemeProvider } from 'styled-components';
import {
  X, Trash2,
  RefreshCw, Loader2, MessageSquare, Inbox,
  Video,
  Search, FileCode, Layers, Monitor, Globe,
  Maximize2, Minimize2, Copy,
  Download, Upload
} from 'lucide-react';
import { getTheme } from './theme';
import { formatPath } from './utils';
import { SessionReplay } from './SessionReplay';
import { LogEntry } from './components/LogEntry';
import { StatusBadgeStyled, normalizeStatusKey } from './components/StatusBadge';
import { StatusDropdown } from './components/StatusDropdown';
import { STORAGE, DEFAULT_STATUSES } from './constants';
import {
  DashboardBackdrop,
  DashboardPanel,
  DashboardHeader,
  HeaderTop,
  TitleGroup,
  HeaderTitle,
  CountBadge,
  ActionsGroup,
  ActionButton,
  FilterBar,
  SearchInput,
  SearchIconWrapper,
  FilterSelect,
  Content,
  FeedbackListStyled as FeedbackList,
  Card,
  CardMain,
  Thumbnail,
  CardContent,
  CardHeader,
  DateText,
  FeedbackDescription,
  CardActions,
  ExpandedSection,
  MediaViewer,
  DetailGrid,
  DetailItem,
  DetailLabel,
  DetailValue,
  EmptyState,
  VideoModeBackdrop,
  VideoModeContainer,
  VideoModeHeader,
  VideoModeTitle,
  VideoModeCloseBtn,
  VideoModeContent,
  VideoModePlayer,
  VideoModeLogsPanel,
  VideoModeLogsHeader,
  VideoModeLogsTitle,
  VideoModeLogsList,
  ExpandButton,
} from './components/Dashboard/styled';
import { TypeIcon, formatRelativeDate } from './components/Dashboard/DashboardHelpers';
import type {
  ThemeMode,
  FeedbackData,
  StatusConfigs,
  StatusChangePayload,
  EventLog,
  IntegrationsConfig,
} from './types';
import { createPersistenceServices } from './services/persistence';

// ============================================
// TYPE DEFINITIONS
// ============================================

interface FeedbackDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  data?: FeedbackData[] | undefined;
  isDeveloper?: boolean | undefined;
  onStatusChange?: ((payload: StatusChangePayload) => void) | undefined;
  mode?: ThemeMode | undefined;
  isLoading?: boolean | undefined;
  onRefresh?: (() => void) | undefined;
  title?: string | undefined;
  statuses?: StatusConfigs | undefined;
  acceptableStatuses?: string[] | undefined;
  showAllStatuses?: boolean | undefined;
  error?: string | null | undefined;
  integrations?: IntegrationsConfig | null | undefined;
}

interface SessionReplayWrapperProps {
  item: FeedbackData;
  mode: ThemeMode;
  fullHeight?: boolean | undefined;
  showLogsButton?: boolean | undefined;
  onTimeUpdate?: ((time: number, logs: EventLog[]) => void) | null | undefined;
}

interface VideoDBRecord {
  id: string;
  blob: Blob;
  timestamp: number;
}

// ============================================
// INDEXEDDB HELPERS
// ============================================

const openVideoDatabase = (): Promise<IDBDatabase> => new Promise((resolve, reject) => {
  const request = indexedDB.open(STORAGE.VIDEO_DB_NAME, 1);
  request.onerror = () => reject(request.error);
  request.onsuccess = () => resolve(request.result);
  request.onupgradeneeded = (event) => {
    const db = (event.target as IDBOpenDBRequest).result;
    if (!db.objectStoreNames.contains(STORAGE.VIDEO_STORE_NAME)) {
      db.createObjectStore(STORAGE.VIDEO_STORE_NAME, { keyPath: 'id' });
    }
  };
});

const getVideoFromIndexedDB = async (id: string): Promise<Blob | null> => {
  try {
    console.log('Getting video from IndexedDB, id:', id);
    const db = await openVideoDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORAGE.VIDEO_STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORAGE.VIDEO_STORE_NAME);
      const request = store.get(id);
      request.onsuccess = () => {
        const result = request.result as VideoDBRecord | undefined;
        console.log('IndexedDB get result:', result ? 'found' : 'not found',
          result ? 'blob size: ' + result.blob?.size : '');
        resolve(result ? result.blob : null);
      };
      request.onerror = (e) => {
        console.error('IndexedDB get error:', e);
        reject(request.error);
      };
      transaction.oncomplete = () => db.close();
    });
  } catch (e) {
    console.error('getVideoFromIndexedDB error:', e);
    return null;
  }
};

const saveVideoToIndexedDB = async (id: string, videoBlob: Blob): Promise<boolean> => {
  try {
    console.log('Opening IndexedDB for save, id:', id, 'blob size:', videoBlob?.size);
    const db = await openVideoDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORAGE.VIDEO_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORAGE.VIDEO_STORE_NAME);
      const record: VideoDBRecord = { id, blob: videoBlob, timestamp: Date.now() };
      const request = store.put(record);
      request.onsuccess = () => {
        console.log('IndexedDB save success for id:', id);
        resolve(true);
      };
      request.onerror = (e) => {
        console.error('IndexedDB save error:', e);
        reject(request.error);
      };
      transaction.oncomplete = () => db.close();
    });
  } catch (e) {
    console.error('saveVideoToIndexedDB error:', e);
    return false;
  }
};

// ============================================
// SESSION REPLAY WRAPPER
// ============================================

const SessionReplayWrapper: React.FC<SessionReplayWrapperProps> = ({
  item,
  mode,
  fullHeight = false,
  showLogsButton = true,
  onTimeUpdate = null
}) => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      // Cleanup previous URL
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }

      try {
        const videoRef = (item as unknown as { videoRef?: string }).videoRef;
        if (videoRef) {
          const blob = await getVideoFromIndexedDB(videoRef);
          if (cancelled) return;
          if (blob) {
            const url = URL.createObjectURL(blob);
            urlRef.current = url;
            setVideoUrl(url);
          } else {
            setError('Video not found');
          }
        } else if (item.video) {
          setVideoUrl(item.video);
        } else {
          setError('No video data');
        }
      } catch (e) {
        if (!cancelled) setError('Failed to load video');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
    };
  }, [item.id, item.video]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        color: '#94a3b8',
        height: fullHeight ? '100%' : 'auto'
      }}>
        <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ marginLeft: 8 }}>Loading video...</span>
      </div>
    );
  }

  if (error || !videoUrl) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        color: '#ef4444',
        fontSize: 13,
        height: fullHeight ? '100%' : 'auto'
      }}>
        {error || 'Video unavailable'}
      </div>
    );
  }

  return (
    <SessionReplay
      videoSrc={videoUrl}
      eventLogs={item.eventLogs ?? []}
      mode={mode}
      fullHeight={fullHeight}
      showLogsButton={showLogsButton}
      onTimeUpdate={onTimeUpdate ?? undefined}
    />
  );
};

// ============================================
// SAVE TO LOCAL STORAGE
// ============================================

export const saveFeedbackToLocalStorage = async (feedbackData: FeedbackData): Promise<{ success: boolean; data?: FeedbackData; error?: string }> => {
  try {
    const stored = localStorage.getItem(STORAGE.FEEDBACK_KEY);
    const existing: FeedbackData[] = stored ? JSON.parse(stored) : [];
    const feedbackId = Date.now().toString();
    const processedData: FeedbackData & { videoRef?: string | undefined } = { ...feedbackData };

    console.log('Saving feedback, has videoBlob:', !!feedbackData.videoBlob,
      'size:', feedbackData.videoBlob?.size,
      'type:', feedbackData.videoBlob?.type);

    if (feedbackData.videoBlob && feedbackData.videoBlob instanceof Blob) {
      const sizeMB = feedbackData.videoBlob.size / (1024 * 1024);
      console.log('Video size:', sizeMB.toFixed(2), 'MB');

      if (sizeMB <= STORAGE.MAX_VIDEO_SIZE_MB) {
        const saved = await saveVideoToIndexedDB(feedbackId, feedbackData.videoBlob);
        console.log('Video saved to IndexedDB:', saved);

        if (saved) {
          processedData.videoRef = feedbackId;
          processedData.videoSize = feedbackData.videoBlob.size;
          processedData.videoType = feedbackData.videoBlob.type;
        }
      } else {
        console.warn('Video too large:', sizeMB, 'MB, max:', STORAGE.MAX_VIDEO_SIZE_MB, 'MB');
      }
      delete processedData.videoBlob;
      delete processedData.video;
    }

    const newFeedback: FeedbackData = {
      ...processedData,
      id: feedbackId,
      status: 'new',
      timestamp: new Date().toISOString()
    };

    console.log('Saving feedback with videoRef:', (newFeedback as unknown as { videoRef?: string }).videoRef);
    localStorage.setItem(STORAGE.FEEDBACK_KEY, JSON.stringify([newFeedback, ...existing].slice(0, 50)));
    return { success: true, data: newFeedback };
  } catch (e) {
    console.error('Error saving feedback:', e);
    return { success: false, error: (e as Error).message };
  }
};

// ============================================
// MAIN COMPONENT
// ============================================

export const FeedbackDashboard: React.FC<FeedbackDashboardProps> = ({
  isOpen,
  onClose,
  data,
  isDeveloper = false,
  onStatusChange,
  mode = 'light',
  isLoading = false,
  onRefresh,
  title = 'Feedback',
  statuses,
  acceptableStatuses,
  showAllStatuses: _showAllStatuses = true,
  error: _error = null,
  integrations: _integrations
}) => {
  const [feedbackList, setFeedbackList] = useState<FeedbackData[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [videoModeItem, setVideoModeItem] = useState<FeedbackData | null>(null);
  const [videoModeVisibleLogs, setVideoModeVisibleLogs] = useState<EventLog[]>([]);
  const videoModeLogsRef = useRef<HTMLDivElement>(null);

  const useLocalStorage = data === undefined;
  const theme = getTheme(mode);

  // Merge statuses
  const mergedStatuses = useMemo((): StatusConfigs => {
    if (acceptableStatuses && acceptableStatuses.length > 0) {
      const result: StatusConfigs = {};
      acceptableStatuses.forEach(key => {
        result[key] = statuses?.[key] ?? DEFAULT_STATUSES[key] ?? {
          key, label: key, color: '#6b7280', bgColor: '#f3f4f6', textColor: '#374151', icon: 'AlertCircle'
        };
      });
      return result;
    }
    return statuses ?? DEFAULT_STATUSES;
  }, [statuses, acceptableStatuses]);

  useEffect(() => {
    const loadData = () => {
      if (useLocalStorage) {
        try {
          const stored = localStorage.getItem(STORAGE.FEEDBACK_KEY);
          setFeedbackList(stored ? JSON.parse(stored) : []);
        } catch (e) { console.error(e); }
      } else {
        setFeedbackList(data ?? []);
      }
    };
    if (isOpen) loadData();
  }, [isOpen, data, useLocalStorage]);

  const handleRefresh = (): void => {
    if (onRefresh) {
      onRefresh();
    } else if (useLocalStorage) {
      const stored = localStorage.getItem(STORAGE.FEEDBACK_KEY);
      setFeedbackList(stored ? JSON.parse(stored) : []);
    }
  };

  const handleExport = async (): Promise<void> => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const persistence = createPersistenceServices();
      await persistence.exportService.exportToFile({ includeVideos: true });
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportClick = (): void => {
    importInputRef.current?.click();
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file || isImporting) return;

    setIsImporting(true);
    try {
      const persistence = createPersistenceServices();
      const result = await persistence.importService.importFromFile(file, {
        duplicateHandling: 'skip',
        includeVideos: true,
      });

      if (result.success) {
        // Refresh the feedback list after import
        handleRefresh();
        if (result.warnings.length > 0) {
          console.warn('Import warnings:', result.warnings);
        }
      } else {
        console.error('Import failed:', result.errors);
      }
    } catch (error) {
      console.error('Import error:', error);
    } finally {
      setIsImporting(false);
      // Reset file input so the same file can be imported again
      if (importInputRef.current) {
        importInputRef.current.value = '';
      }
    }
  };

  const handleDelete = (id: string): void => {
    if (!window.confirm("Delete this feedback?")) return;
    const updated = feedbackList.filter(item => item.id !== id);
    if (useLocalStorage) {
      localStorage.setItem(STORAGE.FEEDBACK_KEY, JSON.stringify(updated));
    }
    setFeedbackList(updated);
  };

  const filteredItems = useMemo((): FeedbackData[] => {
    return feedbackList.filter(item => {
      const statusKey = normalizeStatusKey(item.status ?? 'new', mergedStatuses);
      const matchesStatus = filterStatus === 'all' || statusKey === filterStatus;

      if (!matchesStatus) return false;
      if (!searchQuery) return true;

      const q = searchQuery.toLowerCase();
      const feedbackText = (item.feedback ?? '').toLowerCase();
      const id = (item.id ?? '').toLowerCase();
      const type = (item.type ?? '').toLowerCase();
      const user = (item.userName ?? '').toLowerCase();

      return feedbackText.includes(q) || id.includes(q) || type.includes(q) || user.includes(q);
    });
  }, [feedbackList, filterStatus, searchQuery, mergedStatuses]);

  if (!isOpen) return null;

  return createPortal(
    <ThemeProvider theme={theme}>
      <DashboardBackdrop onClick={onClose} />
      <DashboardPanel>
        <DashboardHeader>
          <HeaderTop>
            <TitleGroup>
              <HeaderTitle>{title}</HeaderTitle>
              <CountBadge>{feedbackList.length}</CountBadge>
            </TitleGroup>
            <ActionsGroup>
              <ActionButton onClick={handleExport} title="Export feedback" disabled={isExporting}>
                {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              </ActionButton>
              <ActionButton onClick={handleImportClick} title="Import feedback" disabled={isImporting}>
                {isImporting ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              </ActionButton>
              <input
                ref={importInputRef}
                type="file"
                accept=".json"
                onChange={handleImportFile}
                style={{ display: 'none' }}
                aria-label="Import feedback file"
              />
              <ActionButton onClick={handleRefresh} title="Refresh">
                <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              </ActionButton>
              <ActionButton onClick={onClose} title="Close">
                <X size={20} />
              </ActionButton>
            </ActionsGroup>
          </HeaderTop>

          <FilterBar>
            <div style={{ position: 'relative', flex: 1 }}>
              <SearchIconWrapper><Search size={14} /></SearchIconWrapper>
              <SearchInput
                placeholder="Search feedback, ID, type..."
                value={searchQuery}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              />
            </div>
            <FilterSelect
              value={filterStatus}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              {Object.entries(mergedStatuses).map(([statusKey, status]) => (
                <option key={statusKey} value={statusKey}>{status.label}</option>
              ))}
            </FilterSelect>
          </FilterBar>
        </DashboardHeader>

        <Content>
          {filteredItems.length === 0 ? (
            <EmptyState>
              <Inbox size={48} strokeWidth={1} />
              <span>No feedback found</span>
            </EmptyState>
          ) : (
            <FeedbackList>
              {filteredItems.map(item => {
                const isExpanded = expandedId === item.id;
                const statusKey = normalizeStatusKey(item.status ?? 'new', mergedStatuses);
                const statusData = mergedStatuses[statusKey];
                const hasVideo = !!(item.video || (item as unknown as { videoRef?: string }).videoRef);

                return (
                  <Card
                    key={item.id}
                    $expanded={isExpanded}
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  >
                    <CardMain>
                      <Thumbnail>
                        {hasVideo ? (
                          <Video size={24} />
                        ) : item.screenshot ? (
                          <img src={item.screenshot} alt="" />
                        ) : (
                          <MessageSquare size={24} />
                        )}
                      </Thumbnail>

                      <CardContent>
                        <CardHeader>
                          <TypeIcon type={item.type} />
                          <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'capitalize', color: theme.colors.textPrimary }}>
                            {item.type || 'Feedback'}
                          </span>
                          <span style={{ fontSize: 12, color: theme.colors.textTertiary }}>•</span>
                          <DateText>{formatRelativeDate(item.timestamp)}</DateText>
                        </CardHeader>
                        <FeedbackDescription $expanded={isExpanded}>
                          {item.feedback || 'No description'}
                        </FeedbackDescription>
                      </CardContent>

                      <CardActions onClick={e => e.stopPropagation()}>
                        {isDeveloper ? (
                          <StatusDropdown
                            currentStatus={item.status ?? 'new'}
                            onStatusChange={(_id, s) => onStatusChange ? onStatusChange({ id: item.id, status: s }) : null}
                            itemId={item.id}
                            statuses={mergedStatuses}
                            theme={theme}
                          />
                        ) : (
                          <StatusBadgeStyled
                            $statusColor={statusData?.color}
                            $textColor={statusData?.textColor}
                            $statusBg={statusData?.bgColor}
                          >
                            {statusData?.label}
                          </StatusBadgeStyled>
                        )}
                        {isExpanded && isDeveloper && (
                          <ActionButton onClick={() => handleDelete(item.id)} title="Delete">
                            <Trash2 size={14} color="#ef4444" />
                          </ActionButton>
                        )}
                      </CardActions>
                    </CardMain>

                    {isExpanded && (
                      <ExpandedSection onClick={e => e.stopPropagation()}>
                        {(item.screenshot || hasVideo) && (
                          <MediaViewer style={{ position: 'relative' }}>
                            {hasVideo ? (
                              <>
                                <SessionReplayWrapper item={item} mode={mode} />
                                <ExpandButton
                                  onClick={() => setVideoModeItem(item)}
                                  title="Open in Video Mode"
                                  style={{
                                    position: 'absolute',
                                    top: 8,
                                    right: 8,
                                    background: 'rgba(0,0,0,0.6)',
                                    color: 'white',
                                    padding: 6,
                                    borderRadius: 6
                                  }}
                                >
                                  <Maximize2 size={16} />
                                </ExpandButton>
                              </>
                            ) : (
                              <img src={item.screenshot} alt="Evidence" />
                            )}
                          </MediaViewer>
                        )}

                        {isDeveloper && (
                          <DetailGrid>
                            <DetailItem>
                              <DetailLabel>Page</DetailLabel>
                              <DetailValue>
                                <Globe size={12} /> {item.url ? new URL(item.url).pathname : '/'}
                              </DetailValue>
                            </DetailItem>
                            <DetailItem>
                              <DetailLabel>Component</DetailLabel>
                              <DetailValue>
                                <Layers size={12} /> {item.elementInfo?.reactComponent?.componentName ?? 'Unknown'}
                              </DetailValue>
                            </DetailItem>
                            <DetailItem>
                              <DetailLabel>Browser</DetailLabel>
                              <DetailValue>
                                <Monitor size={12} /> {item.userAgent?.split(') ')[0]?.slice(-30) || 'Unknown'}...
                              </DetailValue>
                            </DetailItem>
                            {item.elementInfo?.reactComponent?.sourceFile?.fileName && (
                              <DetailItem>
                                <DetailLabel>Source</DetailLabel>
                                <DetailValue
                                  style={{ cursor: 'pointer' }}
                                  onClick={() => navigator.clipboard.writeText(item.elementInfo?.reactComponent?.sourceFile?.fileName ?? '')}
                                >
                                  <FileCode size={12} />
                                  {formatPath(item.elementInfo?.reactComponent?.sourceFile?.fileName ?? '')}
                                  <Copy size={10} style={{ marginLeft: 'auto' }} />
                                </DetailValue>
                              </DetailItem>
                            )}
                          </DetailGrid>
                        )}
                      </ExpandedSection>
                    )}
                  </Card>
                );
              })}
            </FeedbackList>
          )}
        </Content>
      </DashboardPanel>

      {/* Video Mode - Fullscreen video with logs */}
      {videoModeItem && createPortal(
        <ThemeProvider theme={theme}>
          <VideoModeBackdrop onClick={() => setVideoModeItem(null)} />
          <VideoModeContainer>
            <VideoModeHeader>
              <VideoModeTitle>
                <Video size={20} />
                {videoModeItem.feedback?.slice(0, 50) || 'Video Recording'}
                {(videoModeItem.feedback?.length ?? 0) > 50 && '...'}
              </VideoModeTitle>
              <VideoModeCloseBtn onClick={() => setVideoModeItem(null)}>
                <Minimize2 size={16} />
                Exit Video Mode
              </VideoModeCloseBtn>
            </VideoModeHeader>

            <VideoModeContent>
              <VideoModePlayer>
                <SessionReplayWrapper
                  item={videoModeItem}
                  mode="dark"
                  fullHeight={true}
                  showLogsButton={false}
                  onTimeUpdate={(_time: number, logs: EventLog[]) => {
                    setVideoModeVisibleLogs(logs);
                    if (videoModeLogsRef.current) {
                      videoModeLogsRef.current.scrollTop = videoModeLogsRef.current.scrollHeight;
                    }
                  }}
                />
              </VideoModePlayer>

              <VideoModeLogsPanel>
                <VideoModeLogsHeader>
                  <VideoModeLogsTitle>
                    <span style={{ color: '#3fb950' }}>❯</span>
                    Console & Network Logs
                  </VideoModeLogsTitle>
                  <span style={{
                    background: '#238636',
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: 10,
                    fontSize: 11,
                    fontWeight: 600
                  }}>
                    {videoModeVisibleLogs.length} / {videoModeItem.eventLogs?.length || 0}
                  </span>
                </VideoModeLogsHeader>

                <VideoModeLogsList ref={videoModeLogsRef}>
                  {videoModeVisibleLogs.length === 0 ? (
                    <div style={{
                      padding: 40,
                      textAlign: 'center',
                      color: '#484f58'
                    }}>
                      <div style={{ fontSize: 24, marginBottom: 8 }}>❯_</div>
                      <div>No logs yet - play the video to see logs</div>
                    </div>
                  ) : (
                    videoModeVisibleLogs.map((log, idx) => (
                      <LogEntry key={idx} log={log} theme={theme} />
                    ))
                  )}
                </VideoModeLogsList>
              </VideoModeLogsPanel>
            </VideoModeContent>
          </VideoModeContainer>
        </ThemeProvider>,
        document.body
      )}
    </ThemeProvider>,
    document.body
  );
};

export { DEFAULT_STATUSES };
