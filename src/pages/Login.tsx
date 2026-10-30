import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function getOAuthUrl() {
  const kimiAuthUrl = import.meta.env.VITE_KIMI_AUTH_URL;
  const appID = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);
  const url = new URL(`${kimiAuthUrl}/api/oauth/authorize`);
  url.searchParams.set("client_id", appID);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "profile");
  url.searchParams.set("state", state);
  return url.toString();
}

export default function Login() {
  return <div className="login-page"><section className="login-intro"><span className="brand-mark">澄</span><p>RESEARCH DESK</p><h1>让研究有证据，<br />让协作有秩序。</h1><div>方向决策 · 成员分工 · 数据分析 · 报告路演</div></section><Card className="login-card"><CardHeader><CardTitle>进入项目工作区</CardTitle><p>登录后，你的项目数据与生成档案会安全保存在云端。</p></CardHeader><CardContent><Button className="btn primary full" size="lg" onClick={() => { window.location.href = getOAuthUrl(); }}>使用 Kimi 账号继续</Button><small>首次登录将自动创建独立工作区</small></CardContent></Card></div>;
}
