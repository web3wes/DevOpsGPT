import express, { Request, Response } from 'express';
import crypto from 'crypto';
import { S3 } from 'aws-sdk';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

import { ILogEvent } from '@devopsgpt/types';

const s3 = new S3({
  region: process.env.AWS_REGION || 'us-east-1',
});

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

interface WebhookOptions {
  port?: number;
  path?: string;
  secret?: string;
  s3Bucket: string;
}

/**
 * Creates and starts the webhook listener server.
 */
export function startWebhookServer(options: WebhookOptions) {
  const {
    port = 4000,
    path = '/webhook',
    secret = process.env.WEBHOOK_SECRET || '',
    s3Bucket,
  } = options;

  if (!s3Bucket) {
    throw new Error('s3Bucket is required');
  }

  const app = express();
  app.use(express.json({ limit: '10mb' }));

  app.post(path, async (req: Request, res: Response) => {
    try {
      // Verify signature if secret provided
      if (secret) {
        const signatureHeader = (req.headers['x-hub-signature-256'] as string) || '';
        const hmac = crypto.createHmac('sha256', secret);
        const digest = 'sha256=' + hmac.update(JSON.stringify(req.body)).digest('hex');
        if (signatureHeader !== digest) {
          return res.status(401).json({ error: 'Invalid signature' });
        }
      }

      // For demonstration, expect { log: base64string, repo, buildId }
      const { log, repo, buildId } = req.body as { log: string; repo: string; buildId: string };
      if (!log || !repo || !buildId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const logBuffer = Buffer.from(log, 'base64');
      const logKey = `logs/${repo}/${buildId}-${Date.now()}.txt`;

      await s3
        .putObject({ Bucket: s3Bucket, Key: logKey, Body: logBuffer })
        .promise();

      const logUrl = `s3://${s3Bucket}/${logKey}`;

      const event: ILogEvent = {
        id: uuidv4(),
        repo,
        buildId,
        timestamp: new Date().toISOString(),
        logUrl,
      };

      await redis.xadd('build_logs', '*', 'event', JSON.stringify(event));

      res.status(202).json({ status: 'queued', id: event.id });
    } catch (err) {
      console.error('Webhook error', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.listen(port, () => {
    console.log(`Webhook listener running on port ${port}${path}`);
  });

  return app;
}
