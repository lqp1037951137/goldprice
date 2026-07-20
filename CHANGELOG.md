# Change Log

All notable changes to the "gold" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

## [0.0.5]

- WebSocket 域名接口改为解密 `en_data`（AES-256-CBC）后读取 `hq_ws_links`
- 更新 WebSocket 备用地址

## [0.0.4]

- 支持民生、浙商、WebSocket 三种数据源
- WebSocket 动态获取服务器地址
- 自动重连和降级机制