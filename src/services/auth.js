import * as oauth from 'oauth4webapi';
import app from '../app/index.js';

import { oauthClientId, oauthPrividerUrl } from '../../config/index.js';

const client = {
  client_id: oauthClientId,
  token_endpoint_auth_method: 'none',
}

const issuer = new URL(oauthPrividerUrl)

let accessToken = localStorage.getItem('accessToken');
let claims = JSON.parse(localStorage.getItem('claims') || 'null');

const redirect_uri = 'http://localhost:8071'

const searchParams = new URLSearchParams(window.location.search);
const sessionState = searchParams.get('code');

async function syncUserProfile () {
  const currentTimestamp = Date.now();
  const expireTimestamp = claims.exp * 1000;

  if (expireTimestamp <= currentTimestamp) {
    login();
    return;
  }
    // const userInfoResponse = await oauth.userInfoRequest(authServer, client, accessToken)
    // const userInfo = await oauth.processUserInfoResponse(authServer, client, claims.sub, userInfoResponse)

  app.setState({
    ...app.state,
    session: claims
  });

  const notesResponse = await fetch('/api/notes', {
    headers: {
      authorization: 'Bearer ' + accessToken
    }
  });

  if (notesResponse.status === 401) {
    login();
    return;
  }

  const data = await notesResponse.json();

  app.setState({
    ...app.state,
    notes: data.items
  });
}

if (accessToken) {
  syncUserProfile();
} else if (sessionState) {
  authPart2(searchParams);
}

async function authPart2() {
  const discoveryResponse = await oauth.discoveryRequest(issuer)
  const authServer = await oauth.processDiscoveryResponse(issuer, discoveryResponse)

  const currentUrl = new URL(window.location.href);
  window.history.pushState(null, null, '/');

  console.log(authServer, client, currentUrl, oauth.expectNoState);
  const params = oauth.validateAuthResponse(authServer, client, currentUrl, oauth.expectNoState)

  if (oauth.isOAuth2Error(params)) {
    console.error(params)
    throw new Error('authentication failed')
  }

  const codeVerifier = localStorage.getItem('codeVerifier');
  localStorage.removeItem('codeVerifier')

  const response = await oauth.authorizationCodeGrantRequest(
    authServer,
    client,
    params,
    redirect_uri,
    codeVerifier,
  )

  const result = await oauth.processAuthorizationCodeOpenIDResponse(authServer, client, response)
  if (oauth.isOAuth2Error(result)) {
    console.log('error', result)
    throw new Error('oauth failed')
  }

  // console.log('result', result)
  // const { access_token } = result

  accessToken = result.access_token
  localStorage.setItem('accessToken', accessToken);

  claims = oauth.getValidatedIdTokenClaims(result)
  localStorage.setItem('claims', JSON.stringify(claims));

  // console.log('ID Token Claims', claims);
  // const { sub }  = claims

  // const userInfoResponse = await oauth.userInfoRequest(authServer, client, access_token)
  // const userInfo = await oauth.processUserInfoResponse(authServer, client, sub, userInfoResponse)

  syncUserProfile();
}

async function login() {
  const discoveryResponse = await oauth.discoveryRequest(issuer)
  const authServer = await oauth.processDiscoveryResponse(issuer, discoveryResponse)

  localStorage.removeItem('accessToken');
  localStorage.removeItem('claims');

  if (!authServer.code_challenge_methods_supported?.includes('S256')) {
    throw new Error('auth provider must use S256 PKCE');
  }

  const codeVerifier = oauth.generateRandomCodeVerifier()
  localStorage.setItem('codeVerifier', codeVerifier);
  const codeChallenge = await oauth.calculatePKCECodeChallenge(codeVerifier)

  const authorizationUrl = new URL(authServer.authorization_endpoint)
  authorizationUrl.searchParams.set('client_id', client.client_id)
  authorizationUrl.searchParams.set('code_challenge', codeChallenge)
  authorizationUrl.searchParams.set('code_challenge_method', 'S256')
  authorizationUrl.searchParams.set('redirect_uri', redirect_uri)
  authorizationUrl.searchParams.set('audience', 'https://localhost:8071')
  authorizationUrl.searchParams.set('response_type', 'code')
  authorizationUrl.searchParams.set('scope', 'openid email profile')

  window.location.href = authorizationUrl.href
}

async function logout () {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('claims');
  location.reload();
  // location.href = issuer.href + `v2/logout?client_id=${client.client_id}&returnTo=http://localhost:8071/`
}

export default {
  login,
  logout
}
