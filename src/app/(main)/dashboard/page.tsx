'use client';

import { useState } from 'react';
import { useDeviceStore } from '@/store/deviceStore';
import { useLatestSensor } from '@/hooks/useSmoke';
// import { useAiAnalysis } from '@/hooks/useSmoke'; // AI 분석 기능 (비활성화)
import { getOverallLevel, getPm25Level, getGasLevel, type SmokeEventResponse, type AlertLevel } from '@/types/smoke';
import { Plus, X, Thermometer, Droplets, Wind, Flame, AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
// import { Brain, CloudRain } from 'lucide-react'; // AI 분석 기능 (비활성화)
// import type { AiAnalysisResult } from '@/app/api/ai-analysis/route'; // AI 분석 기능 (비활성화)

const LEVEL_COLORS: Record<AlertLevel, { bg: string; border: string; badge: string; text: string }> = {
  normal: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-700',
    text: 'text-emerald-600',
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    badge: 'bg-amber-100 text-amber-700',
    text: 'text-amber-600',
  },
  danger: {
    bg: 'bg-red-50',
    border: 'border-red-300',
    badge: 'bg-red-100 text-red-700',
    text: 'text-red-600',
  },
};

const LEVEL_LABELS: Record<AlertLevel, string> = {
  normal: '정상',
  warning: '주의',
  danger: '위험',
};

function MetricBadge({ label, value, unit, level }: { label: string; value: number | string; unit: string; level: AlertLevel }) {
  const color = LEVEL_COLORS[level];
  return (
    <div className={`flex flex-col gap-0.5 px-3 py-2 rounded-lg ${color.bg} border ${color.border}`}>
      <span className="text-xs text-slate-500">{label}</span>
      <span className={`text-lg font-bold ${color.text}`}>
        {value}
        <span className="text-xs font-normal ml-0.5">{unit}</span>
      </span>
    </div>
  );
}

function SensorCard({ macAddress, onRemove }: { macAddress: string; onRemove: () => void }) {
  const { data, isLoading, isError, dataUpdatedAt } = useLatestSensor(macAddress);

  const level = data ? getOverallLevel(data) : 'normal';
  const colors = LEVEL_COLORS[level];

  const updatedAt = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString('ko-KR')
    : null;

  return (
    <div className={`rounded-2xl border-2 ${colors.border} ${colors.bg} p-5 flex flex-col gap-4 relative`}>
      <button
        onClick={onRemove}
        className="absolute top-3 right-3 p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-white/70 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-white shadow-sm flex items-center justify-center">
          <Wind className="w-5 h-5 text-slate-500" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900">{macAddress}</p>
          {updatedAt && (
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> {updatedAt}
            </p>
          )}
        </div>
        {!isLoading && !isError && data && (
          <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${colors.badge}`}>
            {LEVEL_LABELS[level]}
          </span>
        )}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center h-20 text-sm text-slate-400">
          데이터 로딩 중...
        </div>
      )}

      {isError && (
        <div className="flex items-center justify-center gap-2 h-20 text-sm text-red-500">
          <XCircle className="w-4 h-4" />
          데이터를 불러올 수 없습니다
        </div>
      )}

      {data && (
        <div className="grid grid-cols-2 gap-2">
          <MetricBadge label="미세먼지 PM2.5" value={data.pm25} unit="μg/m³" level={getPm25Level(data.pm25)} />
          <MetricBadge label="가스" value={data.gas} unit="" level={getGasLevel(data.gas)} />
          <MetricBadge label="온도" value={data.temperature.toFixed(1)} unit="°C" level="normal" />
          <MetricBadge label="습도" value={data.humidity.toFixed(1)} unit="%" level="normal" />
        </div>
      )}
    </div>
  );
}

function AlertBanner({ devices }: { devices: string[] }) {
  const results = devices.map((mac) => useLatestSensor(mac));
  const dangerDevices = results
    .map((r, i) => ({ mac: devices[i], data: r.data }))
    .filter((r) => r.data && getOverallLevel(r.data) === 'danger');

  const warningDevices = results
    .map((r, i) => ({ mac: devices[i], data: r.data }))
    .filter((r) => r.data && getOverallLevel(r.data) === 'warning');

  if (dangerDevices.length === 0 && warningDevices.length === 0) return null;

  const isDanger = dangerDevices.length > 0;
  const alertDevices = isDanger ? dangerDevices : warningDevices;

  return (
    <div
      className={`flex items-start gap-3 px-5 py-4 rounded-xl border ${
        isDanger
          ? 'bg-red-50 border-red-300 text-red-800'
          : 'bg-amber-50 border-amber-300 text-amber-800'
      }`}
    >
      <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
      <div>
        <p className="font-semibold text-sm">
          {isDanger ? '위험 감지' : '주의 수준 감지'} — {alertDevices.length}개 기기
        </p>
        <p className="text-xs mt-0.5 opacity-80">
          {alertDevices.map((d) => d.mac).join(', ')}
        </p>
      </div>
    </div>
  );
}

// AI 분석 기능 (비활성화)
// const AI_MODE_STYLES = {
//   Normal: { bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-400' },
//   Warning: { bg: 'bg-amber-50', border: 'border-amber-300', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400' },
//   Critical: { bg: 'bg-red-50', border: 'border-red-300', badge: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
// };
//
// type DemoScenario = 'normal' | 'warning' | 'critical' | null;
//
// function AiAnalysisCard({ macAddress, demoScenario }: { macAddress: string; demoScenario: DemoScenario }) {
//   const { data, isLoading, isError, dataUpdatedAt } = useAiAnalysis(macAddress, demoScenario);
//   const style = AI_MODE_STYLES[data?.mode ?? 'Normal'];
//   const updatedAt = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString('ko-KR') : null;
//
//   return (
//     <div className={`rounded-2xl border-2 ${style.border} ${style.bg} p-5 flex flex-col gap-4`}>
//       <div className="flex items-center justify-between">
//         <div className="flex items-center gap-2">
//           <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center">
//             <Brain className="w-4 h-4 text-slate-500" />
//           </div>
//           <div>
//             <p className="text-sm font-bold text-slate-900">AI 분석 결과</p>
//             {updatedAt && (
//               <p className="text-xs text-slate-400 flex items-center gap-1">
//                 <RefreshCw className="w-3 h-3" /> {updatedAt} · 30초마다 갱신
//               </p>
//             )}
//           </div>
//         </div>
//         {data && (
//           <div className="flex items-center gap-2">
//             {data.weatherHumidity !== null && (
//               <span className="flex items-center gap-1 text-xs text-slate-500 bg-white/70 px-2 py-1 rounded-lg border border-slate-200">
//                 <CloudRain className="w-3 h-3" /> 외부습도 {data.weatherHumidity}%
//               </span>
//             )}
//             <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${style.badge}`}>
//               <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
//               {data.mode}
//             </span>
//           </div>
//         )}
//       </div>
//       {isLoading && (
//         <div className="flex items-center justify-center gap-2 h-16 text-sm text-slate-400">
//           <Brain className="w-4 h-4 animate-pulse" /> AI 분석 중...
//         </div>
//       )}
//       {isError && (
//         <div className="flex items-center justify-center gap-2 h-16 text-sm text-red-400">
//           <XCircle className="w-4 h-4" /> AI 분석을 불러올 수 없습니다
//         </div>
//       )}
//       {data && (
//         <div className="flex flex-col gap-3">
//           <div className="flex items-start gap-3 bg-white/60 rounded-xl p-4 border border-white">
//             <span className="text-2xl">{data.icon}</span>
//             <div className="flex flex-col gap-1">
//               <p className="text-sm font-semibold text-slate-800">{data.title}</p>
//               <p className="text-sm text-slate-600 leading-relaxed">{data.description}</p>
//             </div>
//           </div>
//           <div className="flex items-start gap-2 px-3 py-2 bg-white/40 rounded-lg">
//             <AlertTriangle className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
//             <p className="text-xs text-slate-600"><span className="font-semibold">권장 조치:</span> {data.action}</p>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
//
// const DEMO_LABELS: Record<string, { label: string; color: string }> = {
//   normal:   { label: '정상', color: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' },
//   warning:  { label: '주의', color: 'bg-amber-100 text-amber-700 hover:bg-amber-200' },
//   critical: { label: '위험', color: 'bg-red-100 text-red-700 hover:bg-red-200' },
// };

function AddDeviceModal({ onAdd, onClose }: { onAdd: (mac: string) => void; onClose: () => void }) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim().toUpperCase();
    if (!trimmed) return;
    onAdd(trimmed);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 w-full max-w-sm p-6 mx-4">
        <h3 className="text-base font-semibold text-slate-900 mb-4">기기 추가</h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">MAC 주소</label>
            <input
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="예: NODE_302"
              className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-400">아두이노 기기에 설정된 MAC 주소 또는 이름을 입력하세요</p>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              추가
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { devices, addDevice, removeDevice } = useDeviceStore();
  const [showModal, setShowModal] = useState(false);
  // AI 분석 기능 (비활성화)
  // const [selectedAiMac, setSelectedAiMac] = useState<string | null>(null);
  // const [demoScenario, setDemoScenario] = useState<DemoScenario>(null);
  // const aiMac = selectedAiMac ?? devices[0] ?? 'NODE_302';

  return (
    <main className="max-w-7xl mx-auto px-6 py-8 flex flex-col gap-6">
      {devices.length > 0 && <AlertBanner devices={devices} />}

      {/* AI 분석 기능 (비활성화)
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Brain className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-semibold text-slate-700">AI 실시간 분석</span>
          <div className="flex items-center gap-1 ml-auto">
            <span className="text-xs text-slate-400 mr-1">데모:</span>
            {(Object.keys(DEMO_LABELS) as DemoScenario[]).map((scenario) => (
              <button
                key={scenario}
                onClick={() => setDemoScenario(demoScenario === scenario ? null : scenario)}
                className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors border ${
                  demoScenario === scenario
                    ? DEMO_LABELS[scenario!].color + ' border-current'
                    : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                }`}
              >
                {DEMO_LABELS[scenario!].label}
              </button>
            ))}
            {demoScenario && (
              <button
                onClick={() => setDemoScenario(null)}
                className="text-xs px-2 py-1 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                실제 데이터
              </button>
            )}
          </div>
        </div>
        <AiAnalysisCard macAddress={aiMac} demoScenario={demoScenario} />
      </div>
      */}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">실시간 센서 현황</h2>
          <p className="text-sm text-slate-500 mt-0.5">5초마다 자동 갱신됩니다</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          기기 추가
        </button>
      </div>

      {devices.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
            <Wind className="w-8 h-8 text-slate-400" />
          </div>
          <div>
            <p className="font-semibold text-slate-700">모니터링 중인 기기가 없습니다</p>
            <p className="text-sm text-slate-400 mt-1">기기 추가 버튼을 눌러 아두이노 MAC 주소를 등록하세요</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            첫 번째 기기 추가
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map((mac) => (
            <SensorCard key={mac} macAddress={mac} onRemove={() => removeDevice(mac)} />
          ))}
        </div>
      )}

      {showModal && (
        <AddDeviceModal onAdd={addDevice} onClose={() => setShowModal(false)} />
      )}
    </main>
  );
}
