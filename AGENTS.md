# Pixel Odyssey 协作约定

本文件约束后续在这个仓库里改代码时的范围和习惯。当前阶段只初始化工程。

## 目录职责

- `frontend/`：浏览器客户端。负责页面、Phaser 渲染和玩家操作。通过 HTTP 调用后端，不在浏览器里伪造存档或角色数据。
- `backend/`：Spring Boot API。负责业务规则和以后的数据持久化。接口放在 `/api` 下。
- `database/`：MySQL 8 的建库说明和表结构。当前只有初始化说明，游戏表等持久化阶段再加。
- `docs/`：设计说明。不要把凭证写进文档。

## 当前边界

- 一次只做当前要求的阶段，不提前实现注册、战斗、背包或存档。
- 不创建没有真实实现的接口，也不用前端假数据冒充后端结果。
- 不引入 Spring Cloud，也不把项目拆成微服务。
- Spring Security、JWT、Redis、WebSocket 等到对应阶段再加入。
- MyBatis 和 MySQL 驱动在真正需要连接数据库时再加入。现在加入会导致应用在没有数据源时无法启动。

## 代码风格

- 前端使用 TypeScript，保持现有 `strict` 与未使用变量检查。组件用 `<script setup lang="ts">`。
- 前端路由放在 `src/router`，Pinia store 放在 `src/stores`，页面放在 `src/views`。
- 后端包名使用 `com.pixelodyssey`。Web 层、业务层、持久化层分开，不要把 SQL 写进控制器。
- 源文件使用 UTF-8。Java 标识符和代码注释使用英文，面向阅读者的说明可以使用中文。
- 改动保持在任务范围内，匹配周围代码的写法。

## 密钥与本地配置

- 禁止提交数据库密码、JWT 密钥、API token、私钥和生产环境连接串。
- 本地密码放在已被 Git 忽略的 `application-local.yml` 或 `.env` 中。
- `database/schema.sql` 和 README 只能出现占位符，例如 `<local-password>`。
- 发现密钥已经进入仓库时，先停止继续扩散，再轮换该密钥。

## 版本

- 目标运行时是 Java 21。本机目前是 JDK 17，Spring Boot 3.5.16 支持 Java 17 到 25，所以 `backend/pom.xml` 的 `java.version` 暂为 17。
- 安装 JDK 21 并设置 `JAVA_HOME` 后，再把 `java.version` 改为 21。不要在只有 JDK 17 时把编译目标改成 21。
- 保持 Spring Boot 3.5.x，除非明确要求升级。Spring Boot 4 不在当前范围内。

## 验证

- 后端：在 `backend/` 执行 `mvn test`，并请求 `GET /api/health`，确认返回 `status` 为 `UP`。
- 前端：在 `frontend/` 执行 `npm run build`。开发时用 `npm run dev`，通过页面或 `http://localhost:5173/api/health` 确认代理到达后端。
