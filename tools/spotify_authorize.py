"""One-time local setup: turn a Spotify user login into a long-lived refresh token.

`GET /shows/{id}/episodes` — the endpoint fetch_episode_media.py needs for
per-episode Spotify links — requires the `user-read-playback-position` scope,
which only the Authorization Code flow can grant. The Client Credentials flow
this project uses everywhere else cannot reach it (Spotify returns 403).

This script is the bridge: run it once, in your own terminal, with your own
Spotify app credentials. It never sends your client secret anywhere except
Spotify's own token endpoint, and it prints the resulting refresh token for
you to store as a GitHub secret yourself — this script's output is the only
place that value exists; nothing here uploads or transmits it elsewhere.

Setup (once, in the Spotify Developer Dashboard for this app):
  Redirect URI: http://127.0.0.1:8888/callback
  (must match exactly, including the trailing path)

Usage:
  export SPOTIFY_CLIENT_ID=...      # from the app's dashboard page
  export SPOTIFY_CLIENT_SECRET=...  # same page, "View client secret"
  python3 tools/spotify_authorize.py

The script prints a URL. Open it, log in, click Agree. Spotify then
redirects your browser to something like:

  http://127.0.0.1:8888/callback?code=AQC7...

That page will fail to load (nothing is listening on port 8888) — that is
expected. Copy the `code=` value from the browser's address bar and paste it
back into the terminal when prompted.
"""

from __future__ import annotations

import base64
import json
import os
import subprocess
import sys
import urllib.parse

REDIRECT_URI = "http://127.0.0.1:8888/callback"
SCOPE = "user-read-playback-position"
TOKEN_URL = "https://accounts.spotify.com/api/token"


def main() -> int:
    client_id = os.getenv("SPOTIFY_CLIENT_ID")
    client_secret = os.getenv("SPOTIFY_CLIENT_SECRET")
    if not client_id or not client_secret:
        print(
            "SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET が未設定です。\n"
            "Spotify Developer Dashboardのアプリのページに表示されている値を、\n"
            "このターミナルで export してから実行してください。",
            file=sys.stderr,
        )
        return 1

    auth_url = "https://accounts.spotify.com/authorize?" + urllib.parse.urlencode(
        {
            "client_id": client_id,
            "response_type": "code",
            "redirect_uri": REDIRECT_URI,
            "scope": SCOPE,
        }
    )
    print("以下のURLをブラウザで開いて、Spotifyにログインし、許可してください:\n")
    print(f"  {auth_url}\n")
    print(
        "許可すると、存在しないページへのリダイレクトで読み込みエラーになります。\n"
        "それが正常です。ブラウザのアドレスバーに表示された URL 全体をコピーしてください。\n"
        "例: http://127.0.0.1:8888/callback?code=AQC7xxxxxxxx...\n"
    )
    redirected = input("リダイレクト後のURL(またはcodeの値だけ)を貼り付けてください: ").strip()

    parsed = urllib.parse.urlparse(redirected)
    query = urllib.parse.parse_qs(parsed.query)
    code = query.get("code", [redirected])[0]  # プレーンなcode値の貼り付けにも対応
    if not code or code.startswith("http"):
        print("codeを読み取れませんでした。URL全体を貼り付けてください。", file=sys.stderr)
        return 1

    basic = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()
    # curl, not urllib: python.org's macOS build ships without a CA bundle
    # unless "Install Certificates.command" has been run, and this script has
    # to work on a machine it is run on exactly once. curl uses the system
    # trust store. The secret goes to Spotify's token endpoint and nowhere else.
    completed = subprocess.run(
        [
            "curl", "--silent", "--show-error", "--fail-with-body",
            "--max-time", "30",
            "--header", f"Authorization: Basic {basic}",
            "--data-urlencode", "grant_type=authorization_code",
            "--data-urlencode", f"code={code}",
            "--data-urlencode", f"redirect_uri={REDIRECT_URI}",
            TOKEN_URL,
        ],
        capture_output=True,
        text=True,
    )
    if completed.returncode != 0:
        print(
            f"トークン交換に失敗しました:\n{completed.stdout}{completed.stderr}",
            file=sys.stderr,
        )
        return 1

    try:
        payload = json.loads(completed.stdout)
    except json.JSONDecodeError:
        print(f"応答を解釈できませんでした: {completed.stdout}", file=sys.stderr)
        return 1

    refresh_token = payload.get("refresh_token")
    if not refresh_token:
        print(f"refresh_tokenが応答に含まれていません: {payload}", file=sys.stderr)
        return 1

    print("\n成功しました。以下の値を GitHub の Secrets に登録してください:\n")
    print("  Name:   SPOTIFY_REFRESH_TOKEN")
    print(f"  Secret: {refresh_token}\n")
    print(
        "登録先: リポジトリの Settings → Secrets and variables → Actions → New repository secret"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
