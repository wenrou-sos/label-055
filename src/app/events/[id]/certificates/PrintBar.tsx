'use client'

export function PrintBar({
  athleteName,
  eventName,
  medalEmoji,
  eventId,
}: {
  athleteName: string
  eventName: string
  medalEmoji: string
  eventId: string
}) {
  return (
    <div className="print-bar">
      <div className="print-bar-inner">
        <span className="print-bar-title">
          {medalEmoji} {athleteName} · {eventName} 证书
        </span>
        <div className="print-bar-actions">
          <a className="back-btn" href={`/events/${eventId}/results`}>
            ← 返回成绩页
          </a>
          <button
            className="print-btn"
            onClick={() => {
              if (typeof window !== 'undefined') window.print()
            }}
          >
            🖨️ 打印 / 导出 PDF
          </button>
        </div>
      </div>
      <style>{`
        .print-bar {
          position: sticky;
          top: 0;
          z-index: 100;
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          color: white;
          padding: 12px 24px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.1);
        }
        .print-bar-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .print-bar-title {
          font-weight: 600;
          font-size: 14px;
        }
        .print-bar-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .print-btn, .back-btn {
          background: white;
          color: #4f46e5;
          border: none;
          padding: 8px 18px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          font-size: 14px;
          text-decoration: none;
          transition: all 0.2s;
          font-family: inherit;
        }
        .print-btn:hover, .back-btn:hover {
          background: #eef2ff;
          transform: translateY(-1px);
        }
        .back-btn {
          background: rgba(255,255,255,0.15);
          color: white;
        }
        .back-btn:hover {
          background: rgba(255,255,255,0.25);
        }
        @media print {
          .print-bar { display: none !important; }
        }
      `}</style>
    </div>
  )
}
