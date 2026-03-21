import { createPage } from './utils/create_page';
import { calculatePostAudioPage } from './scoring/calculate_post_audio_page';
import { calculatePostVideoPage } from './scoring/calculate_post_video_page';

const device = {
  deviceScaleFactor: 1,
  hasTouch: false,
  isMobile: false,
  viewport: {
    height: 1080,
    width: 1920,
  },
};

const baseUrl = 'http://localhost:3000';

function pick(audits: Record<string, any>) {
  return {
    fcp: audits['first-contentful-paint']?.numericValue,
    fcpDisplay: audits['first-contentful-paint']?.displayValue,
    lcp: audits['largest-contentful-paint']?.numericValue,
    lcpDisplay: audits['largest-contentful-paint']?.displayValue,
    lcpElement:
      audits['largest-contentful-paint-element']?.details?.items?.[0]?.node?.snippet ??
      audits['largest-contentful-paint-element']?.displayValue,
    lcpBreakdown: audits['lcp-breakdown']?.details?.items,
    networkRequestCount: audits['network-requests']?.details?.items?.length,
    totalByteWeight: audits['total-byte-weight']?.displayValue,
    totalBlockingTime: audits['total-blocking-time']?.displayValue,
    speedIndex: audits['speed-index']?.displayValue,
  };
}

const main = async () => {
  await using videoCtx = await createPage({ device });
  const video = await calculatePostVideoPage({
    baseUrl,
    playwrightPage: videoCtx.playwrightPage,
    puppeteerPage: videoCtx.puppeteerPage,
  });
  console.log('VIDEO');
  console.log(JSON.stringify(pick(video.audits as Record<string, any>), null, 2));

  await using audioCtx = await createPage({ device });
  const audio = await calculatePostAudioPage({
    baseUrl,
    playwrightPage: audioCtx.playwrightPage,
    puppeteerPage: audioCtx.puppeteerPage,
  });
  console.log('AUDIO');
  console.log(JSON.stringify(pick(audio.audits as Record<string, any>), null, 2));
};

void main();
