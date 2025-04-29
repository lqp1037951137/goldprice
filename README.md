# 黄金价格监控 VS Code 扩展

这个VS Code扩展在状态栏显示实时黄金价格。

## 功能

- 在状态栏显示黄金价格
- 支持HTTP和WebSocket两种数据源
- 点击状态栏项可手动刷新数据

## 要求

- VS Code 1.74.0 或更高版本

## 安装

通过扩展视图搜索并安装，或者通过VSIX文件安装。

## 使用方法

安装后，黄金价格将显示在VS Code状态栏的左侧。点击状态栏项可以手动刷新数据。

## 扩展设置

* `gold.httpUrl`: HTTP API地址
* `gold.wsUrl`: WebSocket服务器地址
* `gold.httpRefreshInterval`: HTTP请求刷新间隔(毫秒)
* `gold.wsReconnectInterval`: WebSocket断线重连间隔(毫秒)

## 已知问题

暂无已知问题。

## 发布说明

### 0.0.3

初始版本，支持HTTP和WebSocket两种数据源。

## Features

Describe specific features of your extension including screenshots of your extension in action. Image paths are relative to this README file.

For example if there is an image subfolder under your extension project workspace:

\!\[feature X\]\(images/feature-x.png\)

> Tip: Many popular extensions utilize animations. This is an excellent way to show off your extension! We recommend short, focused animations that are easy to follow.

## Requirements

If you have any requirements or dependencies, add a section describing those and how to install and configure them.

## Extension Settings

Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

For example:

This extension contributes the following settings:

* `myExtension.enable`: Enable/disable this extension.
* `myExtension.thing`: Set to `blah` to do something.

## Known Issues

Calling out known issues can help limit users opening duplicate issues against your extension.

## Release Notes

Users appreciate release notes as you update your extension.

### 1.0.0

Initial release of ...

### 1.0.1

Fixed issue #.

### 1.1.0

Added features X, Y, and Z.

---

## Working with Markdown

You can author your README using Visual Studio Code.  Here are some useful editor keyboard shortcuts:

* Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux)
* Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux)
* Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets

## For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
