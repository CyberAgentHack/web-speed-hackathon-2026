The "写真つき投稿詳細ページ" (post detail with photo) has TBT of 0 points.
This page can show images, movies, and sounds via ImageArea, MovieArea, SoundArea.

Investigate what's causing high TBT on this page:
1. Check SoundWaveSVG — is audio decoding blocking the main thread?
   Move heavy computation to a Web Worker if possible.
2. Check if any heavy synchronous operations run on mount in PostPage/PostItem
3. Check MovieArea and SoundArea for any blocking initialization

Report findings only, no changes yet.
