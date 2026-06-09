// AI 분석 기능 (비활성화)
/*
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = 'http://3.35.190.115:8080';
const NX = 60;
const NY = 127;

interface SmokeEvent {
  pm25: number;
  gas: number;
  temperature: number;
  humidity: number;
  detectedAt: string;
}

export interface AiAnalysisResult {
  mode: 'Normal' | 'Warning' | 'Critical';
  weatherHumidity: number | null;
  recentLogsCount: number;
  status: string;
  icon: string;
  title: string;
  description: string;
  action: string;
  isDemo?: boolean;
}

const DEMO_SCENARIOS: Record<string, { latest: SmokeEvent; history: SmokeEvent[] }> = {
  normal: {
    latest: { pm25: 42, gas: 210, temperature: 23.5, humidity: 54.0, detectedAt: new Date().toISOString() },
    history: Array.from({ length: 10 }, (_, i) => ({
      pm25: 38 + i, gas: 200 + i * 2, temperature: 23.0 + i * 0.05, humidity: 54.0,
      detectedAt: new Date(Date.now() - (10 - i) * 60000).toISOString(),
    })),
  },
  warning: {
    latest: { pm25: 145, gas: 380, temperature: 39.5, humidity: 72.0, detectedAt: new Date().toISOString() },
    history: Array.from({ length: 10 }, (_, i) => ({
      pm25: 100 + i * 5, gas: 300 + i * 9, temperature: 35.0 + i * 0.5, humidity: 70.0,
      detectedAt: new Date(Date.now() - (10 - i) * 60000).toISOString(),
    })),
  },
  critical: {
    latest: { pm25: 290, gas: 680, temperature: 53.0, humidity: 61.0, detectedAt: new Date().toISOString() },
    history: Array.from({ length: 10 }, (_, i) => ({
      pm25: 200 + i * 10, gas: 550 + i * 15, temperature: 44.0 + i * 1.0, humidity: 61.0,
      detectedAt: new Date(Date.now() - (10 - i) * 60000).toISOString(),
    })),
  },
};

function filterRecent30Minutes(logs: SmokeEvent[]): SmokeEvent[] {
  if (!logs.length) return [];

  let latestTime: Date | null = null;
  for (const log of logs) {
    if (log.detectedAt) {
      const t = new Date(log.detectedAt);
      if (!latestTime || t > latestTime) latestTime = t;
    }
  }

  if (!latestTime) return [];
  const startTime = new Date(latestTime.getTime() - 30 * 60 * 1000);
  return logs.filter((log) => log.detectedAt && new Date(log.detectedAt) >= startTime);
}

function isContinuouslyRising(logs: SmokeEvent[]): boolean {
  if (logs.length < 3) return false;
  const recent = logs.slice(-3);
  return (
    (recent[0].pm25 < recent[1].pm25 && recent[1].pm25 < recent[2].pm25) ||
    (recent[0].gas < recent[1].gas && recent[1].gas < recent[2].gas) ||
    (recent[0].temperature < recent[1].temperature && recent[1].temperature < recent[2].temperature)
  );
}

function getKmaBaseDateTime(): { baseDate: string; baseTime: string } {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const hhmm = kst.toISOString().slice(11, 13) + kst.toISOString().slice(14, 16);
  const baseTimes = ['0200', '0500', '0800', '1100', '1400', '1700', '2000', '2300'];
  const available = baseTimes.filter((t) => t <= hhmm);

  if (available.length > 0) {
    return {
      baseDate: kst.toISOString().slice(0, 10).replace(/-/g, ''),
      baseTime: available[available.length - 1],
    };
  }
  const yesterday = new Date(kst.getTime() - 24 * 60 * 60 * 1000);
  return {
    baseDate: yesterday.toISOString().slice(0, 10).replace(/-/g, ''),
    baseTime: '2300',
  };
}

async function getWeatherHumidity(): Promise<number | null> {
  const apiKey = process.env.WEATHER_API_KEY;
  if (!apiKey) return null;

  const { baseDate, baseTime } = getKmaBaseDateTime();
  try {
    const url = `http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst?serviceKey=${apiKey}&pageNo=1&numOfRows=1000&dataType=JSON&base_date=${baseDate}&base_time=${baseTime}&nx=${NX}&ny=${NY}`;
    const res = await fetch(url);
    const data = await res.json();
    const items: Array<{ category: string; fcstValue: string }> =
      data?.response?.body?.items?.item ?? [];
    const reh = items.find((i) => i.category === 'REH');
    if (reh) return parseInt(reh.fcstValue);
  } catch {
    // 湲곗긽泥?API ?ㅽ뙣 ??null 諛섑솚
  }
  return null;
}

function getAdjustedThresholds(weatherHumidity: number | null) {
  const base = {
    warning_gas: 350, warning_pm25: 130, warning_temp: 38, warning_humidity: 90,
    critical_gas: 650, critical_pm25: 260, critical_temp: 50,
    rising_gas: 380, rising_pm25: 180, rising_temp: 38,
  };
  if (weatherHumidity === null) return base;

  let m = 1.0;
  if (weatherHumidity >= 90) m = 1.15;
  else if (weatherHumidity >= 80) m = 1.10;
  else if (weatherHumidity >= 70) m = 1.05;
  else if (weatherHumidity < 50) m = 0.95;

  return Object.fromEntries(Object.entries(base).map(([k, v]) => [k, Math.floor(v * m)])) as typeof base;
}

function checkMode(
  latest: SmokeEvent,
  recentLogs: SmokeEvent[],
  weatherHumidity: number | null
): 'Normal' | 'Warning' | 'Critical' {
  const t = getAdjustedThresholds(weatherHumidity);
  const rising = isContinuouslyRising(recentLogs);

  if (latest.gas >= t.critical_gas || latest.pm25 >= t.critical_pm25 || latest.temperature >= t.critical_temp)
    return 'Critical';
  if (rising && (latest.gas >= t.rising_gas || latest.pm25 >= t.rising_pm25 || latest.temperature >= t.rising_temp))
    return 'Critical';
  if (
    latest.gas >= t.warning_gas ||
    latest.pm25 >= t.warning_pm25 ||
    latest.temperature >= t.warning_temp ||
    latest.humidity >= t.warning_humidity
  )
    return 'Warning';

  return 'Normal';
}

async function analyzeWithOpenAI(
  latest: SmokeEvent,
  recentLogs: SmokeEvent[],
  mode: string,
  weatherHumidity: number | null
): Promise<Omit<AiAnalysisResult, 'mode' | 'weatherHumidity' | 'recentLogsCount'>> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY ?놁쓬');

  const prompt = `?덈뒗 ?꾨몢?대끂 ?붿옱/怨듦린吏?媛먯? ?쇱꽌 ?곗씠?곕? 遺꾩꽍?섎뒗 AI??

?꾩옱 紐⑤뱶: ${mode}
?꾩옱 湲곗긽泥??몃? ?듬룄: ${weatherHumidity ?? '?????놁쓬'}%
理쒓렐 30遺?濡쒓렇 ?? ${recentLogs.length}媛?理쒖떊 ?쇱꽌 ?섏튂: PM2.5=${latest.pm25}, 媛??${latest.gas}, ?⑤룄=${latest.temperature}째C, ?ㅻ궡?듬룄=${latest.humidity}%

[?먮떒 湲곗?]
- PM2.5 ?믨퀬 媛???뺤긽?대㈃ ?ㅻ궡 ?≪뿰 媛?μ꽦
- 媛???믨퀬 PM2.5 ??쑝硫?媛???꾩텧 媛?μ꽦
- PM2.5, 媛?? ?⑤룄 ?④퍡 ?믪쑝硫??붿옱 ?꾪뿕
- ?몃? ?듬룄 85% ?댁긽?대㈃ ?섏쬆湲??ㅼ옉??媛?μ꽦

諛섎뱶???꾨옒 JSON ?뺤떇?쇰줈留??듯빐以?
{
  "status": "?곹깭紐?,
  "icon": "?대え吏",
  "title": "吏㏃? ?쒕ぉ",
  "description": "2以??대궡 ?ㅻ챸",
  "action": "?ъ슜?먭? ?댁빞 ??議곗튂"
}`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }] }),
  });

  const data = await res.json();
  const content: string = data.choices[0].message.content;
  const clean = content.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(clean);
}

export async function GET(request: NextRequest) {
  const mac = request.nextUrl.searchParams.get('mac') ?? 'NODE_302';
  const demoScenario = request.nextUrl.searchParams.get('demo');

  // ?곕え 紐⑤뱶
  if (demoScenario && demoScenario in DEMO_SCENARIOS) {
    const { latest, history } = DEMO_SCENARIOS[demoScenario];
    const weatherHumidity = await getWeatherHumidity();
    const recentLogs = filterRecent30Minutes(history);
    const mode = checkMode(latest, recentLogs, weatherHumidity);

    if (mode === 'Normal') {
      return NextResponse.json<AiAnalysisResult>({
        mode: 'Normal', weatherHumidity, recentLogsCount: recentLogs.length,
        status: '?뺤긽', icon: '??, title: '?뺤긽 ?곹깭',
        description: '紐⑤뱺 ?쇱꽌 ?섏튂媛 ?뺤긽 踰붿쐞?낅땲??', action: '吏?띿쟻?쇰줈 紐⑤땲?곕쭅?섏꽭??',
        isDemo: true,
      });
    }

    const aiResult = await analyzeWithOpenAI(latest, recentLogs, mode, weatherHumidity);
    return NextResponse.json<AiAnalysisResult>({ mode, weatherHumidity, recentLogsCount: recentLogs.length, ...aiResult, isDemo: true });
  }

  try {
    const [latestRes, historyRes, weatherHumidity] = await Promise.all([
      fetch(`${BACKEND_URL}/api/v1/smoke-events/latest/${mac}`, { cache: 'no-store' }),
      fetch(`${BACKEND_URL}/api/v1/smoke-events/history/${mac}`, { cache: 'no-store' }),
      getWeatherHumidity(),
    ]);

    if (!latestRes.ok) {
      return NextResponse.json({ error: '?쇱꽌 ?곗씠???놁쓬' }, { status: 404 });
    }

    const latest: SmokeEvent = await latestRes.json();
    const history: SmokeEvent[] = historyRes.ok ? await historyRes.json() : [];
    const recentLogs = filterRecent30Minutes(history);
    const mode = checkMode(latest, recentLogs, weatherHumidity);

    if (mode === 'Normal') {
      return NextResponse.json<AiAnalysisResult>({
        mode: 'Normal', weatherHumidity, recentLogsCount: recentLogs.length,
        status: '?뺤긽', icon: '??, title: '?뺤긽 ?곹깭',
        description: '紐⑤뱺 ?쇱꽌 ?섏튂媛 ?뺤긽 踰붿쐞?낅땲??', action: '吏?띿쟻?쇰줈 紐⑤땲?곕쭅?섏꽭??',
      });
    }

    const aiResult = await analyzeWithOpenAI(latest, recentLogs, mode, weatherHumidity);
    return NextResponse.json<AiAnalysisResult>({ mode, weatherHumidity, recentLogsCount: recentLogs.length, ...aiResult });
  } catch (e) {
    console.error('AI 遺꾩꽍 ?ㅻ쪟:', e);
    return NextResponse.json({ error: '遺꾩꽍 ?ㅽ뙣' }, { status: 500 });
  }
}

*/
