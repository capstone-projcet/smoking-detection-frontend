'use client';

import { useState } from 'react';
import { useZones, useCreateZone } from '@/hooks/useSmoke';
import { Building2, Plus, MapPin, ChevronUp } from 'lucide-react';

function ZoneCard({ buildingName, floor, description }: { buildingName: string; floor: number; description: string | null }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-2 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-blue-500" />
        </div>
        <div>
          <p className="font-semibold text-slate-900">{buildingName}</p>
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <ChevronUp className="w-3 h-3" />
            {floor}층
          </p>
        </div>
      </div>
      {description && (
        <p className="text-sm text-slate-500 pl-12">{description}</p>
      )}
    </div>
  );
}

export default function ZonesPage() {
  const { data: zones, isLoading } = useZones();
  const createZone = useCreateZone();

  const [showForm, setShowForm] = useState(false);
  const [buildingName, setBuildingName] = useState('');
  const [floor, setFloor] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const floorNum = parseInt(floor, 10);
    if (!buildingName.trim() || isNaN(floorNum)) {
      setError('건물명과 층수를 올바르게 입력해주세요');
      return;
    }
    try {
      await createZone.mutateAsync({
        buildingName: buildingName.trim(),
        floor: floorNum,
        description: description.trim() || undefined,
      });
      setBuildingName('');
      setFloor('');
      setDescription('');
      setShowForm(false);
    } catch {
      setError('구역 등록에 실패했습니다. 서버 연결을 확인해주세요.');
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-6 py-8 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">구역 관리</h2>
          <p className="text-sm text-slate-500 mt-0.5">건물/층별 감지 구역을 등록하고 관리합니다</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          구역 추가
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-4">새 구역 등록</h3>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">건물명 *</label>
                <input
                  value={buildingName}
                  onChange={(e) => setBuildingName(e.target.value)}
                  placeholder="예: A동, 본관"
                  className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">층수 *</label>
                <input
                  type="number"
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  placeholder="예: 3"
                  className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">설명 (선택)</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="예: 남자 기숙사 3층 복도"
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={createZone.isPending}
                className="px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                {createZone.isPending ? '등록 중...' : '등록'}
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-16 text-slate-400 text-sm">
          구역 목록 로딩 중...
        </div>
      )}

      {!isLoading && (!zones || zones.length === 0) && (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
            <MapPin className="w-7 h-7 text-slate-400" />
          </div>
          <p className="font-semibold text-slate-700">등록된 구역이 없습니다</p>
          <p className="text-sm text-slate-400">구역 추가 버튼을 눌러 건물/층 정보를 등록하세요</p>
        </div>
      )}

      {zones && zones.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {zones.map((zone) => (
            <ZoneCard
              key={zone.id}
              buildingName={zone.buildingName}
              floor={zone.floor}
              description={zone.description}
            />
          ))}
        </div>
      )}
    </main>
  );
}
