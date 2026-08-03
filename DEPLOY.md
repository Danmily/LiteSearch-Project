# 部署指南:花语集上线

代码这边已经准备好了(DeepSeek 云端 API + Docker 化后端 + 可配置的前端 API 地址)。剩下的账号创建、支付信息、实际点击部署这几步涉及你自己的邮箱/账号,需要你本人操作——这份文档就是照着做的清单。

## 后端选哪个平台?

Render 免费档只给 **512MB 内存**,而后端要跑 PyTorch(哪怕只是跑一个几十 MB 的小 embedding 模型),PyTorch 运行时本身常驻内存就要 300-400MB+,免费档几乎必然 OOM——这不是哪个模型的问题,是这个内存上限对"跑 PyTorch"这件事本身就太紧张。

**推荐用 Hugging Face Spaces 代替 Render**:免费档给 **16GB 内存**,原生支持 Docker,注册只要邮箱、不需要手机号或支付方式,门槛比 Render 还低。下面「第一步」直接给的是 HF Spaces 的流程;如果你已经在 Render 上折腾过、想继续用 Render(比如升级到付费档换更大内存),流程附在文末「备选:Render」。

## 前提

- 一个 DeepSeek API key,账户里有余额(在 https://platform.deepseek.com 充值)
- 一个 GitHub 账号(已有,项目已经在 `Danmily/LiteSearch-Project`)
- 免费注册一个 Hugging Face 账号(https://huggingface.co/join,只要邮箱)
- 免费注册一个 Vercel 账号(https://vercel.com,可以用 GitHub 登录)

## 第一步:后端部署到 Hugging Face Spaces(Docker)

1. 打开 https://huggingface.co/new-space
2. 填写:
   - **Space name**: 随便取,比如 `litesearch-backend`
   - **SDK**: 选 **Docker**
   - **Hardware**: 保持默认的 **CPU basic · Free**(16GB 内存,免费)
   - Visibility 选 Public 或 Private 都行
3. 创建后 Hugging Face 会给你一个空的 git 仓库地址,形如 `https://huggingface.co/spaces/<你的用户名>/litesearch-backend`。把这个地址发给我,我用 `git subtree` 把仓库里 `backend/` 目录的内容推送过去(这一步只是普通的 git push,不涉及账号操作,我可以直接做)。
   - 如果你想自己动手,命令是:
     ```bash
     git remote add space https://huggingface.co/spaces/<你的用户名>/litesearch-backend
     git subtree push --prefix backend space main
     ```
   - 推送前把 `backend/space.README.md` 的内容复制/改名成 `backend/README.md`(HF Spaces 靠仓库根目录的 `README.md` 头部的 YAML 元数据识别这是个 Docker Space)——这一步我可以直接帮你处理好再推送。
4. 推送成功后,打开你的 Space 页面 → **Settings → Variables and secrets**,加一个 **Secret**(不是 Variable,secret 不会明文显示):
   - `DEEPSEEK_API_KEY` = 你的 DeepSeek key
   - 先不用加 `ALLOWED_ORIGINS`,等第二步拿到 Vercel 域名后回来填(同样加成 Variable 即可,这个不是敏感信息)
5. Space 会自动开始 build(可以在页面里看实时日志),第一次要装 sentence-transformers/torch,可能要几分钟。
6. build 成功后,Space 的公网地址就是 `https://<你的用户名>-litesearch-backend.hf.space`——记下来,下一步要用。
7. 访问 `https://<你的地址>/health`,看到 `{"status":"ok"}` 就说明后端活了。

**注意**:HF Spaces 免费档同样会在闲置一段时间后休眠,下一次请求要等它冷启动,这是免费档的正常行为。

## 第二步:前端部署到 Vercel

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

1. 回到 Space 的 **Settings → Variables and secrets**,加一个 Variable:`ALLOWED_ORIGINS` = 第二步拿到的 Vercel 地址(比如 `https://litesearch-project.vercel.app`)。
2. 保存后 Space 会自动重新构建一次。
3. 打开 Vercel 给的前端链接,试一下注册/登录/插花/发布——如果浏览器控制台报 CORS 错误,多半是这一步的地址没填对或者带了多余的斜杠。

## 完成后的效果 / 已知局限

- 别人打开 Vercel 那个链接就能直接用:检索、推荐、插花工坊、复杂需求、花友集市,全部走公网后端 + DeepSeek 云端生成。
- 数据库(`auth.db` / `gallery.db`)存在 Space 这台机器的本地磁盘上——**免费档没有持久磁盘**,服务重启(比如你改了环境变量、或者 Space 自动休眠后重新唤醒)会清空所有注册用户和帖子。真要长期保留数据,需要换成外部数据库,或者挂载 HF Spaces 的付费持久存储(这一步我可以之后帮你改代码,但升级/付费是你自己决定)。
- 没有邮箱验证、没有找回密码、登录接口没有限流——公开给陌生人用之前,这几项是明确的待办,不是被忽略的。
- DeepSeek API 是按 token 计费的,别人用得越多你的账户扣费越多,注意关注余额。

## 备选:部署到 Render

如果更想用 Render(比如愿意升级到付费档换更大内存),流程是一样的套路,只是配置界面不同:

1. 打开 https://dashboard.render.com → New → Web Service → 连接 `Danmily/LiteSearch-Project`
2. 关键配置:**Root Directory** = `backend`,**Runtime** = Docker(自动识别 `backend/Dockerfile`)
3. 环境变量:`DEEPSEEK_API_KEY`、`ALLOWED_ORIGINS`(同上)
4. **免费档(512MB)大概率会因为 PyTorch 本身的内存占用而 OOM**,这不是配置问题——真要用 Render,建议直接选 Starter 及以上的付费档(内存更大)。
5. 部署成功后地址形如 `https://litesearch-backend.onrender.com`,后续步骤(填 `VITE_API_BASE`、回填 CORS)跟 HF Spaces 那条路完全一样。
