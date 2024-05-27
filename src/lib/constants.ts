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
  '20230629': {
    title: 'BigIntの良いとこ悪いとこ',
    date: '2022-07-30',
    description: 'JavaScriptで大きい整数を扱う'
  },
  'catenary-03_24': {
    title: 'Catenaryの技術のこと',
    date: '2021-03-24',
    description: 'EPSON HackTrek 2021の大賞受賞アプリについての解説資料'
  },
}
