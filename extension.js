// 黄金价格监控扩展
const vscode = require("vscode");
const WebSocket = require("ws");

// 全局变量
let ws = null;
let reconnectAttempts = 0;
let reconnectTimeout;
const MAX_RECONNECT_ATTEMPTS = 5;

/**
 * 浙商积存金
 * const getJDPriceZS = async () => {
  const data = await fetch(
    "https://api.jdjygold.com/gw2/generic/jrm/h5/m/stdLatestPrice?productSku=1961543816",
    {
      method: "post",
      data: {
        reqData: { productSku: "1961543816" },
      },
      timeout: 30,
    }
  ).then((response) => response.json());
  state.priceZS = data.resultData.datas.price;
};
 */

// 获取配置
function getConfig() {
  const config = vscode.workspace.getConfiguration("gold");
  return {
    httpUrl: config.get(
      "httpUrl",
      "https://api.jdjygold.com/gw/generic/hj/h5/m/latestPrice"
    ),
    httpRefreshInterval: config.get("httpRefreshInterval", 1000),
    wsUrl: config.get("wsUrl", "wss://webhqv1.jrjr.com:39920/ws"),
    wsReconnectInterval: config.get("wsReconnectInterval", 5000),
  };
}

// 节流函数，防止频繁更新
function throttle(func, limit) {
  let lastFunc;
  let lastRan;
  return function () {
    const context = this;
    const args = arguments;
    if (!lastRan) {
      func.apply(context, args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(function () {
        if (Date.now() - lastRan >= limit) {
          func.apply(context, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
}

// 获取HTTP金价
async function fetchGoldPrice() {
  const config = getConfig();
  try {
    const response = await fetch(config.httpUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Origin: "https://www.jd.com",
        Referer: "https://www.jd.com/",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP错误: ${response.status}`);
    }

    const data = await response.json();
    return data.resultData.datas.price;
  } catch (error) {
    console.error("获取HTTP金价失败:", error);
    throw error;
  }
}

// 设置WebSocket连接
function setupWebSocket(wsStatusBarItem) {
  try {
    // 关闭已存在的连接
    if (ws) {
      ws.removeAllListeners();
      ws.close();
    }

    wsStatusBarItem.text = `$(radio-tower) 连接中...`;

    const config = getConfig();
    ws = new WebSocket(config.wsUrl);

    ws.on("open", () => {
      console.log("WebSocket已连接");
      wsStatusBarItem.text = `$(radio-tower) 已连接`;
      reconnectAttempts = 0;
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }
    });

    ws.on(
      "message",
      throttle((message) => {
        try {
          const data = JSON.parse(message.toString());
          if (data && data.length && data[0].c === "XAU") {
            const price = data[0].a;
            wsStatusBarItem.text = `$(radio-tower) ${price}`;
            wsStatusBarItem.tooltip = `WebSocket实时数据 | 更新时间: ${new Date().toLocaleTimeString()}`;
          }
        } catch (error) {
          console.error("解析WebSocket消息失败:", error);
        }
      }, 1000)
    );

    ws.on("error", (error) => {
      console.error("WebSocket错误:", error);
      wsStatusBarItem.text = `$(error) WS金价: 错误`;
      wsStatusBarItem.tooltip = `错误: ${error.message}`;
    });

    ws.on("close", () => {
      console.log("WebSocket已断开");
      wsStatusBarItem.text = `$(circle-slash) WS金价: 已断开`;

      // 尝试重连
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        wsStatusBarItem.text = `$(sync~spin) WS金价: 重连中(${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`;
        const config = getConfig();
        console.log(`尝试重连 ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`);

        reconnectTimeout = setTimeout(() => {
          setupWebSocket(wsStatusBarItem);
        }, config.wsReconnectInterval);
      } else {
        console.log("WebSocket重连失败，达到最大尝试次数");
        wsStatusBarItem.text = `$(error) WS金价: 重连失败`;
      }
    });
  } catch (error) {
    console.error("设置WebSocket时出错:", error);
    wsStatusBarItem.text = `$(error) WS金价: 设置失败`;
    wsStatusBarItem.tooltip = `错误: ${error.message}`;
  }
}

// 扩展激活时调用
function activate(context) {
  console.log('扩展"黄金价格监控"已激活');

  // 创建HTTP状态栏项
  const httpStatusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
  );
  httpStatusBarItem.text = `$(cloud) HTTP金价: 加载中...`;
  httpStatusBarItem.tooltip = "点击刷新HTTP金价";
  httpStatusBarItem.command = "goldprice.refreshHttp";
  httpStatusBarItem.show();

  // 创建WebSocket状态栏项
  const wsStatusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    99
  );
  wsStatusBarItem.text = `$(radio-tower) WS金价: 连接中...`;
  wsStatusBarItem.tooltip = "点击重连WebSocket";
  wsStatusBarItem.command = "goldprice.refreshWs";
  wsStatusBarItem.show();

  // 更新HTTP金价显示
  async function updateHttpPrice() {
    try {
      const price = await fetchGoldPrice();
      httpStatusBarItem.text = `$(cloud) ${price}`;
      httpStatusBarItem.tooltip = `HTTP数据 | 更新时间: ${new Date().toLocaleTimeString()}`;
      return price;
    } catch (error) {
      httpStatusBarItem.text = `$(error) HTTP金价: 获取失败`;
      httpStatusBarItem.tooltip = `错误: ${error.message}`;
      return null;
    }
  }

  // 注册HTTP刷新命令
  const refreshHttpCommand = vscode.commands.registerCommand(
    "goldprice.refreshHttp",
    async () => {
      const price = await updateHttpPrice();
    }
  );

  // 注册WebSocket刷新命令
  const refreshWsCommand = vscode.commands.registerCommand(
    "goldprice.refreshWs",
    () => {
      reconnectAttempts = 0; // 重置重连计数
      setupWebSocket(wsStatusBarItem);
    }
  );

  // 注册刷新所有命令
  const refreshAllCommand = vscode.commands.registerCommand(
    "goldprice.refresh",
    async () => {
      await updateHttpPrice();
      reconnectAttempts = 0;
      setupWebSocket(wsStatusBarItem);
    }
  );

  // 设置HTTP定时更新
  let httpInterval = null;
  function setupHttpInterval() {
    const config = getConfig();
    if (httpInterval) {
      clearInterval(httpInterval);
    }
    httpInterval = setInterval(updateHttpPrice, config.httpRefreshInterval);
  }

  // 监听配置变更
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("gold")) {
        setupHttpInterval();
        setupWebSocket(wsStatusBarItem);
      }
    })
  );

  // 注册资源到订阅中以便自动清理
  context.subscriptions.push(httpStatusBarItem);
  context.subscriptions.push(wsStatusBarItem);
  context.subscriptions.push(refreshHttpCommand);
  context.subscriptions.push(refreshWsCommand);
  context.subscriptions.push(refreshAllCommand);
  context.subscriptions.push({
    dispose: () => {
      if (httpInterval) clearInterval(httpInterval);
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    },
  });

  // 首次更新金价并设置定时更新
  updateHttpPrice();
  setupHttpInterval();

  // 设置WebSocket连接
  setupWebSocket(wsStatusBarItem);
}

// 扩展停用时调用
function deactivate() {
  if (ws) {
    ws.close();
    ws = null;
  }
  console.log('扩展"黄金价格监控"已停用');
}

module.exports = {
  activate,
  deactivate,
};
