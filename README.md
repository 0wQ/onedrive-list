## Deployment

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2F0wQ%2Fonedrive-list&env=base_dir,client_id,client_secret,redirect_uri,auth_endpoint,drive_api,gist_token,gist_id)

```shell
npm i
npm run auth
```

 打开 `.env` 文件可获取：
```
base_dir
client_id
client_secret
redirect_uri
auth_endpoint
refresh_token
drive_api
```

### `gist_id`
创建 [Gist](https://gist.github.com/) 文件名 `onedrive-token.json`，文件内容如下：

> `.env` 中获取的 `refresh_token` 填写进去，不含括号

```json
{
  "expires_at": 0,
  "access_token": "",
  "refresh_token": "{refresh_token}"
}
```

可从 Gist 链接 `https://gist.github.com/{username}/{gist_id}` 中获取 `gist_id`


### `gist_token`

https://github.com/settings/tokens

### 设置 Vercel 环境变量：
![](https://s2.loli.net/2021/12/08/EyehqDkaN2KrzQu.png)
