'use client'

import { useFeedback } from 'react-visual-feedback'

export default function Home() {
  return (
    <main style={{
      minHeight: '100vh',
      padding: '40px 20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: 40,
        color: 'white'
      }}>
        <h1 style={{
          fontSize: 48,
          fontWeight: 700,
          marginBottom: 16,
          textShadow: '0 2px 10px rgba(0,0,0,0.2)'
        }}>
          Feedback Integrations Demo
        </h1>
        <p style={{
          fontSize: 18,
          opacity: 0.9,
          maxWidth: 600,
          margin: '0 auto'
        }}>
          Test Jira and Google Sheets integrations with react-visual-feedback
        </p>
      </div>

      {/* Demo Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 24,
        maxWidth: 1200,
        width: '100%',
        marginBottom: 40
      }}>
        <DemoCard
          title="Bug Report"
          description="Click this card and select any element to report a bug"
          icon="🐛"
          color="#ef4444"
        />
        <DemoCard
          title="Feature Request"
          description="Have an idea? Share your feedback with the team"
          icon="💡"
          color="#f59e0b"
        />
        <DemoCard
          title="General Feedback"
          description="Any other feedback about this application"
          icon="💬"
          color="#3b82f6"
        />
      </div>

      {/* Control Buttons */}
      <ControlButtons />

      {/* Instructions */}
      <div style={{
        background: 'rgba(255,255,255,0.1)',
        borderRadius: 16,
        padding: 32,
        maxWidth: 800,
        width: '100%',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.2)'
      }}>
        <h2 style={{ color: 'white', marginBottom: 20, fontSize: 24 }}>
          How to Test
        </h2>
        <div style={{ color: 'rgba(255,255,255,0.9)', lineHeight: 1.8 }}>
          <p style={{ marginBottom: 16 }}>
            <strong>Keyboard Shortcuts:</strong>
          </p>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li style={{ marginBottom: 8 }}>
              <code style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 4 }}>Alt + Q</code>
              {' '}— Activate element selection mode
            </li>
            <li style={{ marginBottom: 8 }}>
              <code style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 4 }}>Alt + A</code>
              {' '}— Open manual feedback form
            </li>
            <li style={{ marginBottom: 8 }}>
              <code style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 4 }}>Alt + W</code>
              {' '}— Start screen recording
            </li>
            <li style={{ marginBottom: 8 }}>
              <code style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 4 }}>Alt + Shift + Q</code>
              {' '}— Open dashboard
            </li>
          </ul>
        </div>
      </div>

      {/* Setup Instructions */}
      <div style={{
        background: 'white',
        borderRadius: 16,
        padding: 32,
        maxWidth: 800,
        width: '100%',
        marginTop: 24,
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
      }}>
        <h2 style={{ marginBottom: 20, fontSize: 24 }}>
          Setup Instructions
        </h2>

        <SetupSection
          title="1. Server Integration (Jira + Sheets API)"
          steps={[
            'Copy .env.example to .env.local',
            'Add your Jira credentials (domain, email, API token)',
            'Add your Google Service Account JSON',
            'Run npm run dev',
            'Submit feedback - it will create Jira issues and add rows to Sheets'
          ]}
        />

        <SetupSection
          title="2. Google Apps Script (No Server Needed)"
          steps={[
            'Open your Google Sheet',
            'Go to Extensions → Apps Script',
            'Paste the template from getAppsScriptTemplate()',
            'Deploy as web app',
            'Copy the deployment URL to NEXT_PUBLIC_APPS_SCRIPT_URL',
            'Select "Google Apps Script" from the dropdown'
          ]}
        />

        <SetupSection
          title="3. Zapier Webhooks (No Server Needed)"
          steps={[
            'Create a Zapier account',
            'Create a Zap: Webhook → Create Jira Issue',
            'Create a Zap: Webhook → Add Row to Google Sheets',
            'Copy the webhook URLs to .env.local',
            'Select "Zapier Webhooks" from the dropdown'
          ]}
        />
      </div>
    </main>
  )
}

function DemoCard({ title, description, icon, color }: {
  title: string
  description: string
  icon: string
  color: string
}) {
  return (
    <div style={{
      background: 'white',
      borderRadius: 16,
      padding: 28,
      boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: 'pointer',
      borderTop: `4px solid ${color}`
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)'
      e.currentTarget.style.boxShadow = '0 20px 60px rgba(0,0,0,0.2)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.boxShadow = '0 10px 40px rgba(0,0,0,0.15)'
    }}
    >
      <div style={{ fontSize: 40, marginBottom: 16 }}>{icon}</div>
      <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8, color: '#1e293b' }}>
        {title}
      </h3>
      <p style={{ color: '#64748b', lineHeight: 1.6 }}>
        {description}
      </p>
    </div>
  )
}

function ControlButtons() {
  let feedback: any = null

  try {
    feedback = useFeedback()
  } catch (e) {
    // Context not available yet
  }

  if (!feedback) {
    return null
  }

  const { setIsActive, setIsDashboardOpen, startRecording } = feedback

  return (
    <div style={{
      display: 'flex',
      gap: 12,
      marginBottom: 40,
      flexWrap: 'wrap',
      justifyContent: 'center'
    }}>
      <button
        onClick={() => setIsActive(true)}
        style={{
          padding: '14px 28px',
          fontSize: 15,
          fontWeight: 600,
          background: 'white',
          border: 'none',
          borderRadius: 10,
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
          transition: 'transform 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        🎯 Select Element
      </button>

      <button
        onClick={() => startRecording()}
        style={{
          padding: '14px 28px',
          fontSize: 15,
          fontWeight: 600,
          background: '#ef4444',
          color: 'white',
          border: 'none',
          borderRadius: 10,
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(239,68,68,0.4)',
          transition: 'transform 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        🔴 Record Screen
      </button>

      <button
        onClick={() => setIsDashboardOpen(true)}
        style={{
          padding: '14px 28px',
          fontSize: 15,
          fontWeight: 600,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          border: 'none',
          borderRadius: 10,
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(102,126,234,0.4)',
          transition: 'transform 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        📊 Open Dashboard
      </button>
    </div>
  )
}

function SetupSection({ title, steps }: { title: string; steps: string[] }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#1e293b' }}>
        {title}
      </h3>
      <ol style={{ paddingLeft: 20, color: '#64748b', lineHeight: 1.8 }}>
        {steps.map((step, i) => (
          <li key={i} style={{ marginBottom: 4 }}>{step}</li>
        ))}
      </ol>
    </div>
  )
}
