# Pixel Odyssey

浏览器 2D RPG。前端负责渲染和交互，Java 后端负责业务接口和以后的数据持久化。当前阶段只完成工程初始化，并提供一个真实的健康检查接口。

## 环境

| 工具 | 本机已验证版本 | 说明 |
| --- | --- | --- |
| Node.js | 20.20.2 | Vite 8 要求 `^20.19.0 \|\| >=22.12.0` |
| npm | 10.8.2 | |
| JDK | 17.0.14 | 目标是 Java 21；见下方说明 |
| Maven | 3.9.16 | |
| MySQL | 尚未接入 | 建库说明在 `database/schema.sql` |

安装依赖时，npm 会提示部分传递依赖希望使用 Node.js `^22.18.0 \|\| >=24.11.0`。Vite 8 本身接受当前的 Node 20.20.2，并且 `npm run build` 已通过。要消除这条提示，可以安装 Node.js 22.18 或更新版本，不需要为了这条提示降级 Vite。

### Java 版本

项目目标运行时是 Java 21。当前机器的 `JAVA_HOME` 指向 JDK 17，系统里没有 JDK 21。Spring Boot 3.5.16 官方支持 Java 17 到 25，因此 `backend/pom.xml` 的 `java.version` 设为 `17`，这样可以在本机完成编译和启动。

安装 JDK 21 后，把 `JAVA_HOME` 指到新 JDK，再把 `java.version` 改为 `21`：

```powershell
winget install --id Amazon.Corretto.21.JDK -e --scope user --accept-package-agreements --accept-source-agreements
```

## 技术版本

后端：

- Spring Boot 3.5.16
- Spring Web（`spring-boot-starter-web`）
- Java 编译目标 17

MyBatis 和 MySQL 驱动还没有加入。没有数据源时，这两个依赖会让应用启动失败。数据库接入留到持久化阶段。

前端（`frontend/package.json`）：

- Vue 3.5.43
- TypeScript 6.0.3
- Vite 8.3.4
- Vue Router 5.4.0
- Pinia 4.0.3
- Axios 1.20.0
- Phaser 3.90.0
- vue-tsc 3.3.13

Phaser 3.90.0 已接入晨曦村场景。主角正式精灵表规格见下文；文件缺失时使用程序绘制的占位角色。

## 目录

```text
frontend/     Vue 3 客户端，开发时代理 /api
backend/      Spring Boot API
database/     MySQL 初始化说明，当前没有游戏表
docs/         设计文档目录
AGENTS.md     后续改代码时的约定
```

## 主角精灵表

正式主角图片放在 `frontend/public/assets/characters/player/player.png`。浏览器里的地址是 `/assets/characters/player/player.png`。

规格：

- 4 行，每行 4 帧，帧之间没有间距
- 每帧 32×48 像素，整张图 128×192 像素
- 第 1 行向下走，第 2 行向左走，第 3 行向右走，第 4 行向上走
- 背景透明
- 使用原创角色，不使用其他作品的官方素材

动画名是 `player-walk-down`、`player-walk-left`、`player-walk-right`、`player-walk-up`。停下时显示该方向第 1 帧。角色脚底对齐现有占位图的身体底部；碰撞箱仍是 `PLAYER_HITBOX`，不跟着动画帧变化。

这个文件目前可以不存在。缺失或尺寸不对时，控制台会记录明确错误，村庄继续使用蓝绿色占位角色。

## 获取代码

公开仓库：<https://github.com/Smithfordring/pixel-odyssey>

下载压缩包：<https://github.com/Smithfordring/pixel-odyssey/archive/refs/heads/main.zip>

或克隆：

```powershell
git clone https://github.com/Smithfordring/pixel-odyssey.git
cd pixel-odyssey
```

解压或克隆后按下面的步骤启动。依赖不会随仓库分发，需要本机执行 `npm install`，并由 Maven 下载后端依赖。

## 启动

开启两个终端。

后端：

```powershell
cd backend
mvn spring-boot:run
```

前端：

```powershell
cd frontend
npm install
npm run dev
```

- 后端：<http://localhost:8080>
- 前端：<http://127.0.0.1:5173>（`localhost:5173` 也可以）
- 开发服务器绑定 IPv4，并把 `/api` 转发到 `http://localhost:8080`

## 预期输出

后端日志中出现：

```text
Tomcat started on port 8080
Started PixelOdysseyApplication
```

访问 <http://localhost:8080/api/health> 或 <http://localhost:5173/api/health>，返回：

```json
{
  "status": "UP",
  "service": "pixel-odyssey-backend",
  "message": "Pixel Odyssey backend is running"
}
```

浏览器打开 <http://localhost:5173>，页面显示“服务正常：UP”。

## 验证

```powershell
cd backend
mvn test
```

```powershell
cd frontend
npm run build
```

后端启动后：

```powershell
curl.exe http://localhost:8080/api/health
curl.exe http://localhost:5173/api/health
```

第二条命令需要前端开发服务器已经运行。`npm run preview` 同样代理 `/api`，地址是 <http://localhost:4173>。

## 密钥

不要把数据库密码、JWT 密钥或 `.env` 提交到 Git。本地覆盖配置使用 `backend/src/main/resources/application-local.yml`，该文件已被忽略。
