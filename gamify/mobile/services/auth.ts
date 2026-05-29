import { Platform } from "react-native";

const WEB_CLIENT_ID = "97346646198-q5ac252sm37cjsquugbdav0bbpb2u13b.apps.googleusercontent.com";

// Web: ต้องให้ Google redirect กลับมาที่หน้านี้
// หลังจาก redirect → app reload → URL มี #access_token=...
// store/useStore.ts hydrate() จะอ่าน token นี้
const redirectUri = Platform.OS === "web"
  ? "http://localhost:8081"
  : "https://auth.expo.io/@flarezzz/fitquest";

export function signInWithGoogle(): Promise<{
  success: boolean;
  user?: { id: string; email: string; name: string; picture: string };
  error?: string;
}> {
  // Web: redirect เต็มหน้า (ไม่ใช้ popup)
  if (Platform.OS === "web") {
    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${WEB_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=token` +
      `&scope=${encodeURIComponent("email profile")}` +
      `&prompt=select_account`;
    window.location.href = authUrl;
    // ไม่ต้อง return เพราะ page จะ redirect
    return Promise.resolve({ success: false, error: "redirecting..." });
  }

  // Mobile: ใช้ WebBrowser (native)
  return (async () => {
    const expoWebBrowser: any = await import("expo-web-browser");
    try {
      const authUrl =
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${WEB_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=token` +
        `&scope=${encodeURIComponent("email profile")}` +
        `&prompt=select_account`;

      const result = await expoWebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      if (result.type !== "success") {
        return { success: false, error: result.type === "cancel" ? "ยกเลิก" : "ไม่สำเร็จ" };
      }

      let accessToken = "";
      try {
        const hash = result.url.split("#")[1];
        if (hash) {
          hash.split("&").forEach((p: string) => {
            const [k, v] = p.split("=");
            if (k === "access_token") accessToken = decodeURIComponent(v);
          });
        }
      } catch {}

      if (!accessToken) return { success: false, error: "no token" };

      const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (!data.email) return { success: false, error: "no email" };

      return {
        success: true,
        user: { id: data.id, email: data.email, name: data.name, picture: data.picture || "" },
      };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  })();
}

// อ่าน token จาก URL เมื่อ redirect กลับมา
export function getTokenFromUrl(): { accessToken: string } | null {
  if (Platform.OS !== "web") return null;
  try {
    const hash = window.location.hash.substring(1);
    if (!hash) return null;
    let accessToken = "";
    hash.split("&").forEach((p: string) => {
      const [k, v] = p.split("=");
      if (k === "access_token") accessToken = decodeURIComponent(v);
    });
    if (accessToken) {
      // clear URL hash
      window.location.hash = "";
      return { accessToken };
    }
  } catch {}
  return null;
}

// ดึง user info จาก access_token
export async function fetchUserInfo(accessToken: string) {
  const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  if (!data.email) return null;
  return { id: data.id, email: data.email, name: data.name, picture: data.picture || "" };
}
