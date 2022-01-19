## Demo

![](https://s2.loli.net/2021/12/08/tJuby2B7VXx9Ciq.png)

## Deployment

<details>
<summary>本地运行</summary>

```bash
npm i
npm start
```
</details>

<details>
<summary>点击按钮部署到 Vercel↓↓↓</summary>

![设置 Vercel 环境变量](https://s2.loli.net/2021/12/08/EyehqDkaN2KrzQu.png)
</details>

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2F0wQ%2Fonedrive-list&env=base_dir,client_id,client_secret,redirect_uri,auth_endpoint,drive_api,gist_token,gist_id)

### 0. 本项目需要的环境变量

> * Vercel 部署需在 Vercel 中配置环境变量<br>
> * 本地部署需自行创建并填入到 `.env` 文件

```bash
client_id =                                                           # 必填
client_secret =                                                       # 必填
redirect_uri = http://localhost:3000                                  # 选填
auth_endpoint = https://login.microsoftonline.com/common/oauth2/v2.0  # 选填
drive_api = https://graph.microsoft.com/v1.0/me/drive                 # 选填

gist_id =                                                             # 必填
gist_token =                                                          # 必填
gist_filename = onedrive-token.json                                   # 选填

base_dir = /                                                          # 选填
top = 500                                                             # 选填
```


### 1. 使用 [ms-graph-cli](https://github.com/beetcb/ms-graph-cli) 获取

`client_id` `client_secret` `redirect_uri` `auth_endpoint` `drive_api` `refresh_token`

```bash
# 需安装 Node.js
npx @beetcb/ms-graph-cli -l cn
```

### 2. 获取 `gist_id`

创建 [Gist](https://gist.github.com/) 文件名 `onedrive-token.json`，文件内容如下：

> 将 `ms-graph-cli` 中获取的 `refresh_token` 填写进去

```json
{
  "refresh_token": "xxx"
}
```

Gist 创建完成即可从链接 `https://gist.github.com/{username}/{gist_id}` 中获取 `gist_id`

### 3. 获取 `gist_token`

https://github.com/settings/tokens

## Thanks
- [onedrive-vercel-index](https://github.com/spencerwooo/onedrive-vercel-index)
- [sosf](https://github.com/beetcb/sosf)
- [ms-graph-cli](https://github.com/beetcb/ms-graph-cli)
- [gist-helper](https://github.com/linbuxiao/gist-helper)
