// OIDC 認証（Auth0）によるログイン必須ゲート。
// 認証に成功したときだけ startApp() でアプリ本体を起動する。
// 静的サイト向けに Authorization Code + PKCE（Client Secret 不要）を使う。
// 一度ログインすればトークンは localStorage にキャッシュされ、オフラインでも維持される。
import { AUTH0_DOMAIN, AUTH0_CLIENT_ID } from "./config.js";
import { startApp } from "./app.js";

const LS_DOMAIN = "auth0_domain";
const LS_CID = "auth0_client_id";

const domain = localStorage.getItem(LS_DOMAIN) || AUTH0_DOMAIN;
const clientId = localStorage.getItem(LS_CID) || AUTH0_CLIENT_ID;
// リダイレクト先＝現在のアプリURL（クエリ/ハッシュ無し）。Auth0の許可URLに登録する値。
const baseUrl = location.origin + location.pathname;

const $ = (id) => document.getElementById(id);
const gate = $("auth-gate");
const loginBox = $("auth-login");
const configBox = $("auth-config");
const msg = $("auth-msg");

let started = false;

async function main() {
  // Auth0 未設定ならログイン画面で設定入力を促す（＝認証必須のまま前に進めない）
  if (!domain || !clientId) {
    showConfigForm();
    return;
  }

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
    setMsg("認証の初期化に失敗しました: " + e.message);
    showConfigForm();
    return;
  }

  // ログインからの戻り（?code=...&state=...）を処理してURLを掃除
  if (location.search.includes("code=") && location.search.includes("state=")) {
    try {
      await client.handleRedirectCallback();
    } catch (e) {
      setMsg("ログイン処理に失敗しました: " + e.message);
    }
    history.replaceState({}, document.title, baseUrl);
  }

  if (await client.isAuthenticated()) {
    const user = await client.getUser();
    onAuthenticated(client, user);
  } else {
    showLogin(client);
  }
}

function showLogin(client) {
  configBox.classList.add("hidden");
  loginBox.classList.remove("hidden");
  gate.classList.remove("hidden");
  $("login-btn").onclick = () =>
    client.loginWithRedirect().catch((e) => setMsg("ログインを開始できません: " + e.message));
}

function showConfigForm() {
  loginBox.classList.add("hidden");
  configBox.classList.remove("hidden");
  gate.classList.remove("hidden");
  if (domain) $("auth0-domain").value = domain;
  if (clientId) $("auth0-clientid").value = clientId;
  $("auth0-save").onclick = () => {
    const d = $("auth0-domain").value.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
    const c = $("auth0-clientid").value.trim();
    if (!d || !c) {
      setMsg("ドメインとクライアントIDを入力してください。");
      return;
    }
    localStorage.setItem(LS_DOMAIN, d);
    localStorage.setItem(LS_CID, c);
    location.reload();
  };
}

function onAuthenticated(client, user) {
  gate.classList.add("hidden");
  // ヘッダーにユーザー名とログアウトを表示
  const area = $("user-area");
  if (area) {
    area.classList.remove("hidden");
    $("user-name").textContent = user?.name || user?.email || "ログイン中";
    $("logout-btn").onclick = () =>
      client.logout({ logoutParams: { returnTo: baseUrl } });
  }
  if (!started) {
    started = true;
    startApp();
  }
}

function setMsg(t) {
  if (msg) msg.textContent = t;
}

main();
