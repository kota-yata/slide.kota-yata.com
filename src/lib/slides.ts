interface SlideBase {
  slug: string;
  title: string;
  date: string;
  previewImagePath: string;
}

export interface PdfSlide extends SlideBase {
  format: 'pdf';
  pdfPath: string;
}

export interface KeynoteSlide extends SlideBase {
  format: 'keynote';
  keynotePath: string;
  keynoteManifestPath: string;
}

export type Slide = PdfSlide | KeynoteSlide;

export const slides: Slide[] = [
  {
    slug: 'moq-meetup-japan',
    title: 'MoQ Optimization for Point-cloud Volumetric Video Streaming',
    date: '2026/10/02',
    format: 'keynote',
    keynotePath: '/keynotes/moq-meetup-japan.key',
    keynoteManifestPath: '/keynotes/moq-meetup-japan/manifest.json',
    previewImagePath: '/previews/moq-meetup-japan.jpg'
  },
  {
    slug: 'seccamp2026-lt',
    title: '“リアルな”遅延を測る仕様: Responsiveness under Working Conditions',
    date: '2026/08/12',
    format: 'pdf',
    pdfPath: '/pdfs/seccamp2026-lt.pdf',
    previewImagePath: '/previews/seccamp2026-lt.png'
  },
  {
    slug: 'seccamp2025-lt',
    title: '結局QUICで通信は速くなるの？？',
    date: '2025/08/12',
    format: 'pdf',
    pdfPath: '/pdfs/seccamp2025-lt.pdf',
    previewImagePath: '/previews/seccamp2025-lt.png'
  },
  {
    slug: 'quic-in-kernel',
    title: '論文輪読: Implementation and Performance Evaluation of the QUIC Protocol in Linux Kernel',
    date: '2025/05/01',
    format: 'pdf',
    pdfPath: '/pdfs/quic-in-kernel.pdf',
    previewImagePath: '/previews/quic-in-kernel.png'
  },
  {
    slug: '2024f-wip',
    title: 'RISC-V向けOS上でのICMPプロトコルスタック実装',
    date: '2025/01/30',
    format: 'pdf',
    pdfPath: '/pdfs/2024f-wip.pdf',
    previewImagePath: '/previews/2024f-wip.png'
  },
  {
    slug: 'ph-5',
    title: 'パタヘネ輪読: 第五章',
    date: '2024/12/01',
    format: 'pdf',
    pdfPath: '/pdfs/ph-5.pdf',
    previewImagePath: '/previews/ph-5.png'
  },
  {
    slug: 'ph-1',
    title: 'パタヘネ輪読: 第一章',
    date: '2024/10/24',
    format: 'pdf',
    pdfPath: '/pdfs/ph-1.pdf',
    previewImagePath: '/previews/ph-1.png'
  },
  {
    slug: '2024s-wip',
    title: 'Media over QUIC Transport: 標準化に向けた貢献',
    date: '2024/07/29',
    format: 'pdf',
    pdfPath: '/pdfs/2024s-wip.pdf',
    previewImagePath: '/previews/2024s-wip.png'
  },
  {
    slug: 'warp-loc',
    title: 'MoQTストリーミングフォーマット紹介: LOCとWARP',
    date: '2024/05/12',
    format: 'pdf',
    pdfPath: '/pdfs/warp-loc.pdf',
    previewImagePath: '/previews/warp-loc.png'
  },
  {
    slug: '2023s-wip',
    title: 'マルチモーダルなセンシングデータを用いたSFC GO AROUNDの効果測定',
    date: '2023/07/28',
    format: 'pdf',
    pdfPath: '/pdfs/2023s-wip.pdf',
    previewImagePath: '/previews/2023s-wip.png'
  },
  {
    slug: 'bigint',
    title: 'BigIntの良いとこ悪いとこ',
    date: '2022/07/30',
    format: 'pdf',
    pdfPath: '/pdfs/bigint.pdf',
    previewImagePath: '/previews/bigint.png'
  },
  {
    slug: 'js-tco',
    title: '末尾呼び出し最適化とJavaScript',
    date: '2021/04/23',
    format: 'pdf',
    pdfPath: '/pdfs/js-tco.pdf',
    previewImagePath: '/previews/js-tco.png'
  }
];

export function findSlide(slug: string): Slide | undefined {
  return slides.find((slide) => slide.slug === slug);
}
