import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Express } from 'express';
import { createApp, initializeDatabase } from '../server';

let appPromise: Promise<Express> | undefined;

async function getApp(): Promise<Express> {
  if (!appPromise) {
    appPromise = initializeDatabase().then(() => createApp());
  }
  return appPromise;
}

export default async function handler(
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  const app = await getApp();
  app(request, response);
}
