Kota's Slide Gallery

SvelteKitとTypeScriptで実装した，静的生成のスライドギャラリーです．

開発:
  npm install
  npm run dev

ビルド:
  npm run build

PDFを追加する場合は，PDFをstatic/pdfs，プレビュー画像をstatic/previewsに置き，
src/lib/slides.tsへ情報を追加してください．

Keynoteを追加:
  npm run import:keynote -- /path/to/slide.key slide-slug

このコマンドはKeynoteファイルを解析し，プレビュー，動画，動画の配置情報，
箇条書きなどの表示情報をstaticへ書き出します．実行後はsrc/lib/slides.tsへ
format: 'keynote'のスライド情報を追加してください．

Keynoteレンダラーはsrc/lib/keynote-rendererに同梱しています．
IWAの解析，Worker，描画処理はこのローカル実装を使用します．由来とライセンスは
src/lib/keynote-renderer/UPSTREAM.mdとLICENSEを参照してください．

Keynoteレンダラーの確認:
  npm run test:keynote

PDFとKeynoteの各ページは，ビルド時に静的生成されます．
