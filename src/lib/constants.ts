export interface SlideInterface {
  title: string;
  date: string;
  description: string;
}

export const SLIDES: {[key: string]: SlideInterface} = {
  'hls-moq': {
    title: 'Media over QUICとRTMP+HLSの比較',
    date: '2024-05-24',
    description: 'WebRTC Meetup 10周年記念イベントでの登壇資料'
  },
  '2023f-wip': {
    title: 'Using QUIC to traverse NATsの実装',
    date: '2024-01-21',
    description: '2023年秋学期 RG WIP発表資料'
  },
  'bigint': {
    title: 'BigIntの良いとこ悪いとこ',
    date: '2022-07-30',
    description: 'JavaScriptで大きい整数を扱う'
  },
  'catenary-03_24': {
    title: 'Catenaryの技術のこと',
    date: '2021-03-24',
    description: 'EPSON HackTrek 2021の大賞受賞アプリについての解説資料'
  },
  'wellcomp-1st': {
    title: 'マルチモーダルなセンシングデータを用いたSFC GO AROUNDの効果測定',
    date: '2023-07-28',
    description: '2023年春学期 中澤大越研 WIP発表資料'
  },
  'tco': {
    title: '末尾呼び出し最適化とJavaScript',
    date: '2021-04-23',
    description: 'JavaScriptエンジンにおけるTCOの実装状況について'
  }
}

const dateToNum = (date: string): number => {
  const dateStr = date.replace(/-/g, '');
  return parseInt(dateStr);
}

export const sortByDate = (slides: {[key: string]: SlideInterface}): {[key: string]: SlideInterface} => {
  const sortedSlides: {[key: string]: SlideInterface} = {};
  const sortedKeys = Object.keys(slides).sort((a, b) => dateToNum(slides[b].date) - dateToNum(slides[a].date));
  sortedKeys.forEach(key => {
    sortedSlides[key] = slides[key];
  });
  return sortedSlides;
}
