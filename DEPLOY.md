# 部署指南:花语集上线

代码这边已经准备好了(DeepSeek 云端 API + Docker 化后端 + 可配置的前端 API 地址)。剩下的账号创建、支付信息、实际点击部署这几步涉及你自己的邮箱/账号,需要你本人操作——这份文档就是照着做的清单。

## 前提

- 一个 DeepSeek API key,账户里有余额(在 https://platform.deepseek.com 充值)
- 一个 GitHub 账号(已有,项目已经在 `Danmily/LiteSearch-Project`)
- 免费注册一个 Render 账号(https://render.com,用 GitHub 登录最快)
- 免费注册一个 Vercel 账号(https://vercel.com,同样可以用 GitHub 登录)

## 第一步:后端部署到 Render(Docker)

1. 打开 https://dashboard.render.com → New → Web Service
2. 选择 "Build and deploy from a Git repository" → 连接 `Danmily/LiteSearch-Project`
3. 关键配置:
   - **Root Directory**: `backend`
   - **Runtime**: Docker(Render 会自动识别 `backend/Dockerfile`)
   - **Instance Type**: Free 档位够用(demo 流量不大)
4. 环境变量(Environment 标签页里加):
   - `DEEPSEEK_API_KEY` = 你的 DeepSeek key
   - `ALLOWED_ORIGINS` = 先留空,等第二步拿到 Vercel 域名后回来填
5. 点 Create Web Service,等它 build 完(第一次要装 sentence-transformers/torch,可能要几分钟)。
6. 部署成功后,Render 会给一个形如 `https://litesearch-backend.onrender.com` 的地址——记下来,下一步要用。
7. 访问 `https://<你的地址>/health`,看到 `{"status":"ok"}` 就说明后端活了。

**注意**:Render 免费档闲置一段时间会自动休眠,下一次请求要等它冷启动(几十秒),这是免费档的正常行为,不是 bug。

## 第二步:前端部署到 Vercel

1. 打开 https://vercel.com/new,选择同一个仓库 `Danmily/LiteSearch-Project`
2. 关键配置:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite(Vercel 通常会自动识别)
3. 环境变量:
   - `VITE_API_BASE` = 第一步拿到的 Render 后端地址(比如 `https://litesearch-backend.onrender.com`,不要带结尾斜杠)
4. 点 Deploy。完成后 Vercel 会给一个形如 `https://litesearch-project.vercel.app` 的公网地址——这就是可以发给别人玩的链接。

## 第三步:回填 CORS

1. 回到 Render 后端的环境变量页面,把 `ALLOWED_ORIGINS` 改成第二步拿到的 Vercel 地址(比如 `https://litesearch-project.vercel.app`)。
2. 保存后 Render 会自动重新部署一次。
3. 打开 Vercel 给的前端链接,试一下注册/登录/插花/发布——如果浏览器控制台报 CORS 错误,多半是这一步的地址没填对或者带了多余的斜杠。

## 完成后的效果 / 已知局限

- 别人打开 Vercel 那个链接就能直接用:检索、推荐、插花工坊、复杂需求、花友集市,全部走公网后端 + DeepSeek 云端生成。
- 数据库(`auth.db` / `gallery.db`)存在 Render 这台机器的本地磁盘上——**免费档没有持久磁盘**,服务重启(比如你改了环境变量、或者 Render 自动重启)会清空所有注册用户和帖子。真要长期保留数据,需要升级 Render 到带持久磁盘的付费档,或者换成外部数据库(这一步我可以之后帮你改代码,但账户升级/付费是你自己决定)。
- 没有邮箱验证、没有找回密码、登录接口没有限流——公开给陌生人用之前,这几项是明确的待办,不是被忽略的。
- DeepSeek API 是按 token 计费的,别人用得越多你的账户扣费越多,注意关注余额。
