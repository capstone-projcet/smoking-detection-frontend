'use client';

import { useState } from 'react';
import { useSensorHistory } from '@/hooks/useSmoke';
import { useDeviceStore } from '@/store/deviceStore';
import { getPm25Level, getGasLevel } from '@/types/smoke';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Search } from 'lucide-react';

const METRIC_COLORS = {
  pm25: '#3b82f6',
  gas: '#f59e0b',
  temperature: '#ef4444',
  humidity: '#06b6d4',
};

function SensorChart({ macAddress }: { macAddress: string }) {
  const { data, isLoading, isError } = useSensorHistory(macAddress);

  const chartData = data
    ? [...data]
        .reverse()
        .slice(-50)
        .map((e) => ({
          time: new Date(e.detectedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
          pm25: e.pm25,
          gas: e.gas,
          temperature: e.temperature,
          humidity: e.humidity,
        }))
    : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
        데이터 로딩 중...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-48 text-red-400 text-sm">
        데이터를 불러올 수 없습니다. 서버를 확인해주세요.
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
        이력 데이터가 없습니다
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-medium text-slate-600 mb-2">미세먼지 PM2.5 / 가스</p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="time" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="pm25" name="PM2.5 (μg/m³)" stroke={METRIC_COLORS.pm25} dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="gas" name="가스" stroke={METRIC_COLORS.gas} dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div>
        <p className="text-sm font-medium text-slate-600 mb-2">온도 / 습도</p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="time" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="temperature" name="온도 (°C)" stroke={METRIC_COLORS.temperature} dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="humidity" name="습도 (%)" stroke={METRIC_COLORS.humidity} dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div>
        <p className="text-sm font-medium text-slate-600 mb-2">최근 {Math.min(data.length, 20)}건 데이터</p>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">시각</th>
                <th className="px-4 py-2.5 text-right font-medium">PM2.5</th>
                <th className="px-4 py-2.5 text-right font-medium">가스</th>
                <th className="px-4 py-2.5 text-right font-medium">온도</th>
                <th className="px-4 py-2.5 text-right font-medium">습도</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.slice(0, 20).map((e) => {
                const pm25Level = getPm25Level(e.pm25);
                const gasLevel = getGasLevel(e.gas);
                return (
                  <tr key={e.id} className="bg-white hover:bg-slate-50">
                    <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">
                      {new Date(e.detectedAt).toLocaleString('ko-KR')}
                    </td>
                    <td className={`px-4 py-2.5 text-right font-medium ${pm25Level === 'danger' ? 'text-red-600' : pm25Level === 'warning' ? 'text-amber-600' : 'text-slate-700'}`}>
                      {e.pm25}
                    </td>
                    <td className={`px-4 py-2.5 text-right font-medium ${gasLevel === 'danger' ? 'text-red-600' : gasLevel === 'warning' ? 'text-amber-600' : 'text-slate-700'}`}>
                      {e.gas}
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-700">{e.temperature.toFixed(1)}°C</td>
                    <td className="px-4 py-2.5 text-right text-slate-700">{e.humidity.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const { devices } = useDeviceStore();
  const [selected, setSelected] = useState<string>('');
  const [customInput, setCustomInput] = useState('');
  const [searchMac, setSearchMac] = useState('');

  const activeMac = searchMac || selected;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchMac(customInput.trim().toUpperCase());
  };

  return (
    <main className="max-w-7xl mx-auto px-6 py-8 flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">센서 이력 조회</h2>
        <p className="text-sm text-slate-500 mt-0.5">기기별 센서 데이터 변화를 그래프로 확인합니다</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4">
        {devices.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">등록된 기기 선택</label>
            <div className="flex flex-wrap gap-2">
              {devices.map((mac) => (
                <button
                  key={mac}
                  onClick={() => { setSelected(mac); setSearchMac(''); setCustomInput(''); }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    selected === mac && !searchMac
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-blue-400'
                  }`}
                >
                  {mac}
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="flex-1 flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">직접 입력</label>
            <input
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="MAC 주소 직접 입력 (예: NODE_302)"
              className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="self-end flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <Search className="w-4 h-4" />
            조회
          </button>
        </form>
      </div>

      {activeMac ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <p className="text-sm font-semibold text-slate-700 mb-4">
            기기: <span className="text-blue-600">{activeMac}</span>
          </p>
          <SensorChart macAddress={activeMac} />
        </div>
      ) : (
        <div className="flex items-center justify-center py-20 text-slate-400 text-sm">
          조회할 기기를 선택하거나 MAC 주소를 입력하세요
        </div>
      )}
    </main>
  );
}
