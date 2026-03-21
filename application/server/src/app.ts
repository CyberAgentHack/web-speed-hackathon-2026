import bodyParser from 'body-parser';
import Express from 'express';

import { apiRouter } from '@web-speed-hackathon-2026/server/src/routes/api';
import { staticRouter } from '@web-speed-hackathon-2026/server/src/routes/static';
import { sessionMiddleware } from '@web-speed-hackathon-2026/server/src/session';

export const app = Express();

app.set('trust proxy', true);

app.use(sessionMiddleware);
app.use(bodyParser.json());
app.use(bodyParser.raw({ limit: '10mb' }));

app.use((req, res, next) => {
  if (/^\/(scripts|styles|images|sounds|movies)\//.test(req.path)) {
    // contenthashがついているものは30分キャッシュ
    res.header({
      'Cache-Control': `public, max-age=${60 * 30}, immutable`,
      Connection: 'keep-alive',
    });
  } else {
    res.header({
      'Cache-Control': 'max-age=0, no-transform',
      Connection: 'keep-alive',
    });
  }
  return next();
});

app.use('/api/v1', apiRouter);
app.use(staticRouter);
