# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个VS Code扩展,用于在状态栏实时显示黄金价格。扩展支持三种数据源:民生HTTP、浙商积存金和WebSocket,在状态栏左侧显示三个独立的价格监控项。

## 开发命令

### 测试
```bash
npm test
```

### 打包扩展
```bash
vsce package
```

## 架构说明

### 核心组件

**extension.js** - 主入口文件,包含所有核心逻辑:
- `activate()`: 扩展激活时创建三个状态栏项(民生HTTP、浙商、WebSocket),设置定时更新和事件监听
- `deactivate()`: 清理WebSocket连接和定时器
- `fetchWebSocketUrl()`: 从API动态获取WebSocket链接地址
- `setupWebSocket()`: 异步建立WebSocket连接,先获取动态链接,失败则使用备用链接,处理消息、错误和自动重连(最多5次)
- `fetchGoldPrice()`: 获取民生金价(HTTP方式)
- `fetchZSGoldPrice()`: 获取浙商积存金价格(HTTP POST方式)
- `throttle()`: 节流函数,用于限制WebSocket消息更新频率(1秒)

### 数据源

1. **民生HTTP数据源** (`fetchGoldPrice`)
   - API: `https://api.jdjygold.com/gw/generic/hj/h5/m/latestPrice`
   - 定时轮询(默认3秒间隔)
   - 返回JSON格式: `data.resultData.datas.price`

2. **浙商积存金数据源** (`fetchZSGoldPrice`)
   - API: `https://api.jdjygold.com/gw2/generic/jrm/h5/m/stdLatestPrice?productSku=1961543816`
   - 使用POST方式,请求体: `{reqData: {productSku: "1961543816"}}`
   - 定时轮询(使用httpRefreshInterval配置,默认3秒间隔)
   - 返回JSON格式: `data.resultData.datas.price`

3. **WebSocket数据源** (`setupWebSocket`)
   - 动态获取链接: 先通过 `https://www.jrjr.com/api/getDomainInfo` 获取动态链接
   - 使用 `data.hq_ws_links` 对象中的第一条记录作为WebSocket服务器地址
   - 备用链接: 配置中的 `gold.wsUrl` (动态获取失败时使用)
   - 实时推送金价数据
   - 消息格式: `[{symbol: "GOLD", ask: price, bid: price, ...}]`
   - 显示买入价(bid),tooltip中包含买入价(bid)和卖出价(ask)
   - 自动重连机制(最多5次,间隔5秒)

### 命令系统

- `goldprice.refresh`: 刷新所有数据源(民生、浙商、WebSocket)
- `goldprice.refreshHttp`: 仅刷新民生HTTP数据
- `goldprice.refreshZS`: 仅刷新浙商数据
- `goldprice.refreshWs`: 重连WebSocket(重置重连计数)

### 配置项

- `gold.httpUrl`: HTTP API地址
- `gold.httpRefreshInterval`: HTTP轮询间隔(毫秒)
- `gold.wsUrl`: WebSocket服务器备用地址(动态获取失败时使用)
- `gold.wsReconnectInterval`: WebSocket重连间隔(毫秒)

## 重要实现细节

- 状态栏显示顺序(从左到右): 民生(priority 100) -> 浙商(priority 99) -> WebSocket(priority 98)
- WebSocket连接使用动态获取的链接地址,启动时先调用API获取最新的服务器地址
- 动态获取失败时自动降级使用配置中的备用链接
- WebSocket重连有最大次数限制(5次),手动刷新会重置计数器
- 民生和浙商数据源共用同一个定时刷新间隔配置(`httpRefreshInterval`)
- WebSocket显示买入价(bid),tooltip中同时显示买入价和卖出价
- WebSocket消息更新使用1秒节流防止频繁刷新
- 配置变更会自动触发重新初始化所有数据源
- 所有定时器和连接在扩展停用时会被正确清理
