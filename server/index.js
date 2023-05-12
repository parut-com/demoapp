#!/usr/bin/env node

import http from 'http';
import servatron from 'servatron/http.js';
import { Issuer } from 'openid-client';
import jwt from 'jsonwebtoken';
import watch from '../scripts/watch.js';
import fs from 'fs';
import waitOn from 'wait-on';

const publicKey = await fs.promises.readFile('./config/public.key', 'utf8');

const url = process.env.OAUTH_PROVIDER_URL + '/status';
await waitOn({ resources: [url], verbose: true });

const staticHandler = servatron({
  directory: './dist',
  spa: true,
  spaIndex: 'index.html'
})

const issuer = await Issuer.discover(process.env.OAUTH_PROVIDER_URL);
const client = new issuer.Client({
  client_id: process.env.OAUTH_CLIENT_ID
});

const userInfos = {};

async function getUserInfoFromToken (token) {
  if (!userInfos[token]) {
    const claims = jwt.verify(token, publicKey);
    userInfos[token] = {
      claims,
      userinfo: await client.userinfo(token),
    }
    return;
  }

  if (userInfos[token].claims.exp * 1000 <= Date.now()) {
    throw new Error('access token expired');
  }

  return userInfos[token];
}

export default async function server () {
  await watch();

  const server = http.createServer(async function (request, response) {
    if (!request.url.startsWith('/api/')) {
      staticHandler(request, response);
      return;
    }

    if (!request.headers.authorization) {
      response.writeHead(401);
      response.end('unauthorised')
      return
    }

    const token = request.headers.authorization.split(' ')[1];
    try {
      const userinfo = await getUserInfoFromToken(token);

      response.end(JSON.stringify({
        items: [{
          id: 1,
          text: 'This is a test'
        }],
        userinfo
      }));
    } catch (error) {
      console.log(error);
      response.writeHead(401);
      response.end('unauthorised');
    }
  });

  server.listen(8071, '0.0.0.0');

  server.on('listening', () => {
    console.log('Web server listening at:', '\nhttp://localhost:' + server.address().port);
  });
}

server();
