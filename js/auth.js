// OIDC 認証（Auth0）。ただし避難案内の中核はログイン不要で使えるようにする。
//  - 起動時に必ず startApp() を呼ぶ（＝災害時にログイン画面が命の情報を塞がない）
//  - 認証は任意。ヘッダーに「ログイン」/「氏名＋ログアウト」を出すだけ。
//  - Authorization Code + PKCE（Client Secret 不要）。トークンは localStorage にキャッシュ。
import { AUTH0_DOMAIN, AUTH0_CLIENT_ID } from "./config.js";
import { startApp } from "./app.js";

const domain = AUTH0_DOMAIN;
const clientId = AUTH0_CLIENT_ID;
const baseUrl = location.origin + location.pathname;

const $ = (id) => document.getElementById(id);
const userArea = $("user-area");
const userName = $("user-name");
const logoutBtn = $("logout-btn");
const loginBtn = $("login-btn-header");

async function main() {
  // 中核は認証を待たずに起動
  startApp();

  // Auth0 が未設定、またはSDKが読めない（オフライン等）ならログインUIは出さない
  if (!domain || !clientId || typeof auth0 === "undefined") return;

  let client;
  try {
    client = await auth0.createAuth0Client({
      domain,
      clientId,
      authorizationParams: { redirect_uri: baseUrl },
      cacheLocation: "localstorage",
      useRefreshTokens: true,
    });
  } catch (e) {
    console.warn("認証の初期化に失敗:", e);
    return;
  }

  // ログインからの戻り（?code=&state=）を処理してURLを掃除
  if (location.search.includes("code=") && location.search.includes("state=")) {
    try {
      await client.handleRedirectCallback();
    } catch (e) {
      console.warn("ログイン処理に失敗:", e);
    }
    history.replaceState({}, document.title, baseUrl);
  }

  if (await client.isAuthenticated()) {
    showUser(client, await client.getUser());
  } else {
    showLogin(client);
  }
}

function showLogin(client) {
  if (userArea) userArea.classList.add("hidden");
  if (!loginBtn) return;
  loginBtn.classList.remove("hidden");
  loginBtn.onclick = () =>
    client.loginWithRedirect().catch((e) => console.warn("ログイン開始に失敗:", e));
}

function showUser(client, user) {
  if (loginBtn) loginBtn.classList.add("hidden");
  if (!userArea) return;
  userArea.classList.remove("hidden");
  if (userName) userName.textContent = user?.name || user?.email || "ログイン中";
  if (logoutBtn) logoutBtn.onclick = () => client.logout({ logoutParams: { returnTo: baseUrl } });
}

main();
