import prisma from '@/lib/prisma'
import { calculateRaceResults } from '@/lib/raceService'
import { formatTime, formatDate } from '@/lib/utils'
import { notFound } from 'next/navigation'
import { PrintBar } from '../PrintBar'

export default async function CertificatePage({
  params,
}: {
  params: Promise<{ id: string; registrationId: string }>
}) {
  const { id, registrationId } = await params
  const eventId = id

  const results = await calculateRaceResults(eventId)
  const result = results.find((r) => r.registrationId === registrationId)

  if (!result || !result.finished || result.chipTime === null) {
    notFound()
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { name: true, date: true, location: true },
  })

  if (!event) {
    notFound()
  }

  const overallRank = result.overallRank || 0
  const categoryRank = result.categoryRank || 0

  const rankClass =
    overallRank === 1
      ? 'champion'
      : overallRank === 2
      ? 'runner-up'
      : overallRank === 3
      ? 'third'
      : 'normal'

  const rankTitle =
    overallRank === 1
      ? '冠军证书'
      : overallRank === 2
      ? '亚军证书'
      : overallRank === 3
      ? '季军证书'
      : '完赛证书'

  const medalEmoji = overallRank <= 3 ? ['🥇', '🥈', '🥉'][overallRank - 1] : ''

  return (
    <>
      <PrintBar
        athleteName={result.athleteName}
        eventName={event.name}
        medalEmoji={medalEmoji}
        eventId={eventId}
      />

      <div className={`certificate ${rankClass}`}>
        <div className="certificate-inner">
          <div className="corner corner-tl"></div>
          <div className="corner corner-tr"></div>
          <div className="corner corner-bl"></div>
          <div className="corner corner-br"></div>

          {overallRank <= 3 && (
            <div className="medal-display">
              <div className={`medal-badge medal-${overallRank}`}>
                <span className="medal-emoji">{medalEmoji}</span>
              </div>
            </div>
          )}

          <div className="ribbon ribbon-top">
            <span className="ribbon-text">{rankTitle}</span>
          </div>

          <div className="content">
            <p className="award-line">兹证明</p>

            <h2 className="athlete-name">{result.athleteName}</h2>

            <div className="bib-line">
              <span className="bib-tag">#{String(result.bibNumber).padStart(3, '0')}</span>
            </div>

            <p className="desc">
              参加了 <span className="event-name">{event.name}</span>
              <br />
              <span className="category-name">{result.categoryName}</span> 项目
            </p>

            <div className="result-grid">
              <div className="result-block">
                <div className="result-label">完赛时间（净成绩）</div>
                <div className="result-value time">{formatTime(result.chipTime)}</div>
              </div>
              <div className="result-block">
                <div className="result-label">总排名</div>
                <div className="result-value rank">
                  第 {overallRank} 名
                  {overallRank <= 3 && <span className="rank-medal">{medalEmoji}</span>}
                </div>
              </div>
              <div className="result-block">
                <div className="result-label">组别排名</div>
                <div className="result-value rank">第 {categoryRank} 名</div>
              </div>
            </div>

            <div className="info-footer">
              <div className="info-item">
                <span className="info-label">赛事地点</span>
                <span className="info-value">{event.location}</span>
              </div>
              <div className="info-item">
                <span className="info-label">比赛日期</span>
                <span className="info-value">{formatDate(event.date)}</span>
              </div>
            </div>
          </div>

          <div className="sign-area">
            <div className="sign-line">
              <span className="sign-label">赛事组委会</span>
              <span className="sign-mark">{event.name}</span>
            </div>
            <div className="sign-line">
              <span className="sign-label">签发日期</span>
              <span className="sign-mark">{formatDate(new Date())}</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @page {
          size: A4 landscape;
          margin: 0;
        }
        * {
          box-sizing: border-box;
        }
        body {
          margin: 0;
          font-family: "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif;
          background: #f1f5f9;
        }
        .certificate {
          width: 1123px;
          height: 794px;
          margin: 40px auto;
          position: relative;
          padding: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .certificate.champion {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 25%, #fbbf24 50%, #f59e0b 75%, #d97706 100%);
        }
        .certificate.runner-up {
          background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 25%, #cbd5e1 50%, #94a3b8 75%, #64748b 100%);
        }
        .certificate.third {
          background: linear-gradient(135deg, #fef3e2 0%, #fed7aa 25%, #fb923c 50%, #ea580c 75%, #c2410c 100%);
        }
        .certificate.normal {
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 25%, #bfdbfe 50%, #93c5fd 75%, #3b82f6 100%);
        }
        .certificate-inner {
          width: 100%;
          height: 100%;
          background: rgba(255, 255, 255, 0.95);
          position: relative;
          border-radius: 12px;
          padding: 60px 80px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.08);
          overflow: hidden;
        }
        .certificate.champion .certificate-inner { border: 4px double #b45309; }
        .certificate.runner-up .certificate-inner { border: 4px double #475569; }
        .certificate.third .certificate-inner { border: 4px double #9a3412; }
        .certificate.normal .certificate-inner { border: 4px double #1d4ed8; }
        .corner {
          position: absolute;
          width: 80px;
          height: 80px;
          pointer-events: none;
        }
        .certificate.champion .corner { border: 3px solid #b45309; }
        .certificate.runner-up .corner { border: 3px solid #475569; }
        .certificate.third .corner { border: 3px solid #9a3412; }
        .certificate.normal .corner { border: 3px solid #1d4ed8; }
        .corner-tl { top: 20px; left: 20px; border-right: none !important; border-bottom: none !important; border-top-left-radius: 8px; }
        .corner-tr { top: 20px; right: 20px; border-left: none !important; border-bottom: none !important; border-top-right-radius: 8px; }
        .corner-bl { bottom: 20px; left: 20px; border-right: none !important; border-top: none !important; border-bottom-left-radius: 8px; }
        .corner-br { bottom: 20px; right: 20px; border-left: none !important; border-top: none !important; border-bottom-right-radius: 8px; }
        .medal-display {
          position: absolute;
          top: 40px;
          right: 60px;
          z-index: 2;
        }
        .medal-badge {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 6px 24px rgba(0,0,0,0.2);
          animation: shine 3s ease-in-out infinite;
        }
        .medal-1 { background: radial-gradient(circle at 30% 30%, #fef3c7, #fbbf24 60%, #b45309); border: 4px solid #92400e; }
        .medal-2 { background: radial-gradient(circle at 30% 30%, #f8fafc, #cbd5e1 60%, #475569); border: 4px solid #334155; }
        .medal-3 { background: radial-gradient(circle at 30% 30%, #fef3e2, #fb923c 60%, #9a3412); border: 4px solid #7c2d12; }
        .medal-emoji { font-size: 56px; }
        @keyframes shine {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .ribbon {
          text-align: center;
          margin-bottom: 36px;
        }
        .ribbon-top .ribbon-text {
          display: inline-block;
          padding: 10px 48px;
          font-size: 28px;
          font-weight: 800;
          letter-spacing: 8px;
          border-radius: 4px;
        }
        .certificate.champion .ribbon-text { background: linear-gradient(135deg, #b45309, #d97706); color: #fef3c7; box-shadow: 0 4px 16px rgba(180,83,9,0.3); }
        .certificate.runner-up .ribbon-text { background: linear-gradient(135deg, #334155, #64748b); color: #f1f5f9; box-shadow: 0 4px 16px rgba(51,65,85,0.3); }
        .certificate.third .ribbon-text { background: linear-gradient(135deg, #7c2d12, #ea580c); color: #fff7ed; box-shadow: 0 4px 16px rgba(124,45,18,0.3); }
        .certificate.normal .ribbon-text { background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: #eff6ff; box-shadow: 0 4px 16px rgba(30,58,138,0.3); }
        .content {
          text-align: center;
          position: relative;
          z-index: 1;
        }
        .award-line {
          font-size: 18px;
          color: #64748b;
          margin: 0 0 16px 0;
          letter-spacing: 4px;
        }
        .athlete-name {
          font-size: 48px;
          font-weight: 800;
          margin: 0 0 12px 0;
          letter-spacing: 4px;
        }
        .certificate.champion .athlete-name { background: linear-gradient(135deg, #92400e, #b45309); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .certificate.runner-up .athlete-name { background: linear-gradient(135deg, #1e293b, #475569); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .certificate.third .athlete-name { background: linear-gradient(135deg, #7c2d12, #9a3412); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .certificate.normal .athlete-name { background: linear-gradient(135deg, #1e3a8a, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .bib-line {
          margin-bottom: 28px;
        }
        .bib-tag {
          display: inline-block;
          background: #0f172a;
          color: #f8fafc;
          font-family: ui-monospace, monospace;
          font-weight: 700;
          font-size: 18px;
          padding: 6px 16px;
          border-radius: 6px;
          letter-spacing: 1px;
        }
        .desc {
          font-size: 17px;
          color: #475569;
          line-height: 1.8;
          margin: 0 0 36px 0;
        }
        .event-name {
          font-weight: 700;
          color: #0f172a;
          font-size: 20px;
        }
        .category-name {
          font-weight: 600;
          color: #1e293b;
          background: #e0e7ff;
          padding: 2px 10px;
          border-radius: 4px;
          margin-left: 4px;
        }
        .result-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          max-width: 800px;
          margin: 0 auto 32px auto;
        }
        .result-block {
          background: rgba(255,255,255,0.7);
          border-radius: 12px;
          padding: 18px 12px;
          backdrop-filter: blur(4px);
        }
        .certificate.champion .result-block { border: 2px solid #fcd34d; }
        .certificate.runner-up .result-block { border: 2px solid #cbd5e1; }
        .certificate.third .result-block { border: 2px solid #fdba74; }
        .certificate.normal .result-block { border: 2px solid #bfdbfe; }
        .result-label {
          font-size: 13px;
          color: #64748b;
          margin-bottom: 6px;
          letter-spacing: 1px;
        }
        .result-value {
          font-size: 26px;
          font-weight: 800;
        }
        .result-value.time {
          font-family: ui-monospace, monospace;
          color: #0f172a;
        }
        .certificate.champion .result-value.rank { color: #b45309; }
        .certificate.runner-up .result-value.rank { color: #334155; }
        .certificate.third .result-value.rank { color: #9a3412; }
        .certificate.normal .result-value.rank { color: #1d4ed8; }
        .rank-medal {
          margin-left: 6px;
          font-size: 22px;
          animation: shine 3s ease-in-out infinite;
          display: inline-block;
        }
        .info-footer {
          display: flex;
          justify-content: center;
          gap: 60px;
          margin-bottom: 40px;
        }
        .info-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
          align-items: center;
        }
        .info-label {
          font-size: 12px;
          color: #94a3b8;
          letter-spacing: 2px;
        }
        .info-value {
          font-size: 15px;
          font-weight: 600;
          color: #334155;
        }
        .sign-area {
          position: absolute;
          bottom: 60px;
          left: 80px;
          right: 80px;
          display: flex;
          justify-content: space-between;
        }
        .sign-line {
          text-align: left;
        }
        .sign-label {
          display: block;
          font-size: 12px;
          color: #94a3b8;
          margin-bottom: 4px;
          letter-spacing: 2px;
        }
        .sign-mark {
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
          border-top: 1px solid #cbd5e1;
          padding-top: 8px;
          min-width: 240px;
          display: inline-block;
        }
        @media print {
          .print-bar { display: none !important; }
          .certificate {
            margin: 0;
            width: 1123px;
            height: 794px;
            padding: 0;
            transform: none !important;
          }
          body { background: white; }
        }
      `}</style>
    </>
  )
}
