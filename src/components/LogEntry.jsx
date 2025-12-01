import React, { useState } from 'react';
import styled from 'styled-components';
import { Network, Copy, Check, Code, FileText } from 'lucide-react';

const LogEntryStyled = styled.div`
  padding: 6px 8px;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  border-left: 3px solid ${props => (props.$isHighlighted ? props.theme.colors.highlightBorder : 'transparent')};
  white-space: pre-wrap;
  word-break: break-all;
  background-color: ${props => (props.$isHighlighted ? props.theme.colors.highlightBg : 'transparent')};

  &:last-child {
    border-bottom: none;
  }
`;

const LogTime = styled.span`
  color: ${props => props.theme.colors.textTertiary};
  margin-right: 8px;
`;

const LogLevel = styled.span`
  font-weight: bold;
  color: ${props => {
    switch (props.$level) {
      case 'error': return '#ef4444';
      case 'warn': return '#f59e0b';
      case 'info': return '#3b82f6';
      default: return props.theme.colors.textSecondary;
    }
  }};
`;

const LogDetails = styled.details`
  margin-top: 8px;
  padding-left: 16px;
  border-left: 2px solid ${props => props.theme.colors.border};
`;

const LogSummary = styled.summary`
  cursor: pointer;
  font-weight: bold;
  user-select: none;
  display: flex;
  align-items: center;
  gap: 8px;
  &:focus {
    outline: 1px dotted ${props => props.theme.colors.borderFocus};
  }
`;

const PreContainer = styled.div`
  position: relative;
  margin-top: 4px;
`;

const Pre = styled.pre`
  background: ${props => props.theme.mode === 'dark' ? '#020617' : '#f8fafc'};
  border: 1px solid ${props => props.theme.colors.border};
  padding: 10px;
  padding-right: 40px;
  border-radius: 6px;
  font-size: 10px;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
  max-height: 200px;
  overflow-y: auto;
`;

const CopyButton = styled.button`
  position: absolute;
  top: 6px;
  right: 6px;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid ${props => props.theme.colors.border};
  background: ${props => props.theme.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'};
  color: ${props => props.theme.colors.textSecondary};
  cursor: pointer;
  font-size: 10px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.15s;
  z-index: 5;

  &:hover {
    background: ${props => props.theme.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'};
    color: ${props => props.theme.colors.textPrimary};
    border-color: ${props => props.theme.colors.borderFocus};
  }

  &.copied {
    background: rgba(16, 185, 129, 0.15);
    border-color: #10b981;
    color: #10b981;
  }
`;

const ViewToggle = styled.div`
  display: flex;
  gap: 4px;
  margin-left: auto;
`;

const ViewButton = styled.button`
  padding: 2px 6px;
  border-radius: 3px;
  border: 1px solid ${props => props.$active ? '#3b82f6' : props.theme.colors.border};
  background: ${props => props.$active
    ? (props.theme.mode === 'dark' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)')
    : 'transparent'};
  color: ${props => props.$active ? '#3b82f6' : props.theme.colors.textSecondary};
  cursor: pointer;
  font-size: 9px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 3px;
  transition: all 0.15s;

  &:hover {
    border-color: #3b82f6;
    color: #3b82f6;
  }
`;

const LogLine = styled.span`
  display: flex;
  align-items: center;
`;

const NetworkIcon = styled(Network)`
  margin-right: 6px;
  color: ${props => props.theme.colors.btnPrimaryBg};
`;

const Status = styled.span`
  color: ${props => props.$isError ? '#ef4444' : '#10b981'};
`;

const SectionTitle = styled.strong`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  font-size: 10px;
  color: ${props => props.theme.colors.textSecondary};
`;


// Helper to parse and format JSON strings
const formatJsonContent = (content, viewMode = 'formatted') => {
  if (!content) return '';

  try {
    // If content is already a string, try to parse it
    let parsed;
    if (typeof content === 'string') {
      // Handle escaped JSON strings
      const unescaped = content.replace(/\\"/g, '"').replace(/^"|"$/g, '');
      try {
        parsed = JSON.parse(unescaped);
      } catch {
        try {
          parsed = JSON.parse(content);
        } catch {
          // Not JSON, return as is
          return content;
        }
      }
    } else {
      parsed = content;
    }

    if (viewMode === 'json') {
      return JSON.stringify(parsed, null, 2);
    }
    return JSON.stringify(parsed, null, 2);
  } catch {
    return content;
  }
};

// Copiable Pre component with JSON toggle
const CopyablePre = ({ content, label, theme }) => {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState('formatted'); // 'formatted' or 'raw'

  const handleCopy = async () => {
    try {
      const textToCopy = viewMode === 'formatted' ? formatJsonContent(content, 'json') : content;
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = viewMode === 'formatted' ? formatJsonContent(content, 'json') : content;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const displayContent = viewMode === 'formatted' ? formatJsonContent(content, 'json') : content;

  return (
    <div style={{ marginBottom: 8 }}>
      <SectionTitle>
        {label}
        <ViewToggle>
          <ViewButton
            $active={viewMode === 'formatted'}
            onClick={() => setViewMode('formatted')}
            title="Formatted JSON"
          >
            <Code size={10} />
            JSON
          </ViewButton>
          <ViewButton
            $active={viewMode === 'raw'}
            onClick={() => setViewMode('raw')}
            title="Raw text"
          >
            <FileText size={10} />
            Raw
          </ViewButton>
        </ViewToggle>
      </SectionTitle>
      <PreContainer>
        <Pre>{displayContent}</Pre>
        <CopyButton
          onClick={handleCopy}
          className={copied ? 'copied' : ''}
          title="Copy to clipboard"
        >
          {copied ? <Check size={10} /> : <Copy size={10} />}
          {copied ? 'Copied!' : 'Copy'}
        </CopyButton>
      </PreContainer>
    </div>
  );
};

export const LogEntry = ({ log, theme }) => {
  return (
    <LogEntryStyled $isHighlighted={log.type === 'storage' || log.type === 'indexedDB'}>
      <LogTime>{(log.timestamp / 1000).toFixed(2)}s</LogTime>

      {log.type === 'console' && (
        <>
          <LogLevel $level={log.level}>[{log.level.toUpperCase()}]</LogLevel>
          <span>: {log.message}</span>
        </>
      )}

      {log.type === 'network' && (
        <div>
          <LogLine>
            <NetworkIcon size={14} />
            <LogLevel $level='info'>[API]</LogLevel>
            <span>: {log.method} {log.url} - <Status $isError={log.status >= 400}>{log.status}</Status></span>
          </LogLine>
          {(log.request || log.response) && (
            <LogDetails>
              <LogSummary>Request / Response Details</LogSummary>
              <div style={{ marginTop: 8 }}>
                {log.request && (
                  <>
                    <CopyablePre content={log.request.headers} label="Request Headers" theme={theme} />
                    {log.request.body && <CopyablePre content={log.request.body} label="Request Body" theme={theme} />}
                  </>
                )}
                {log.response && (
                  <>
                    <CopyablePre content={log.response.headers} label="Response Headers" theme={theme} />
                    {log.response.body && <CopyablePre content={log.response.body} label="Response Body" theme={theme} />}
                  </>
                )}
              </div>
            </LogDetails>
          )}
        </div>
      )}

      {log.type === 'storage' && (
        <div>
          <span>
            <LogLevel $level='warn'>[STORAGE]</LogLevel>
            <span>: {log.action === 'setItem' ? 'Set/Updated item' : log.action === 'removeItem' ? 'Removed item' : log.action === 'clear' ? 'Cleared storage' : log.action} on {log.storageType} - Key: {log.key}</span>
          </span>
          {log.value && (
            <LogDetails>
              <LogSummary>Value</LogSummary>
              <div style={{ marginTop: 8 }}>
                <CopyablePre content={log.value} label="Stored Value" theme={theme} />
              </div>
            </LogDetails>
          )}
        </div>
      )}

      {log.type === 'indexedDB' && (
        <div>
          <span>
            <LogLevel $level='warn'>[INDEXEDDB]</LogLevel>
            <span>: {log.action === 'add' ? 'Added' : log.action === 'put' ? 'Put/Updated' : log.action === 'delete' ? 'Deleted' : log.action === 'clear' ? 'Cleared' : log.action} on {log.dbName}/{log.storeName}</span>
          </span>
          {log.data && (
            <LogDetails>
              <LogSummary>Data</LogSummary>
              <div style={{ marginTop: 8 }}>
                <CopyablePre content={log.data} label="IndexedDB Data" theme={theme} />
              </div>
            </LogDetails>
          )}
        </div>
      )}

    </LogEntryStyled>
  );
};