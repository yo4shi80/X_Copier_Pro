// background.js

// 拡張機能のインストール時に実行されるリスナー
chrome.runtime.onInstalled.addListener(() => {
  // 右クリックメニューは引き続き利用可能にする
  setupContextMenus();
});

// アイコンクリック時のイベントリスナー
chrome.action.onClicked.addListener((tab) => {
  // content_script.jsが実行されているタブにメッセージを送信
  if (tab.id) {
    chrome.tabs.sendMessage(tab.id, { action: "copyUserAndTextFromIconClick" });
  }
});

// 右クリックメニューがクリックされたときのイベントリスナー
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab.id) return;

  try {
    const postData = await chrome.tabs.sendMessage(tab.id, { action: "getPostData" });

    if (!postData || postData.error) {
      console.error("X Copier Pro:", postData.error || "投稿データの取得に失敗しました。");
      return;
    }

    const textToCopy = formatText(postData, info.menuItemId);
    await writeToClipboard(textToCopy);
    console.log("X Copier Pro: コピーが完了しました。");

  } catch (error) {
    console.error("X Copier Pro: エラーが発生しました。", error);
  }
});

// 右クリックメニューをセットアップする関数
function setupContextMenus() {
  chrome.contextMenus.create({
    id: "x-copier-pro",
    title: "X Copier Proでコピー",
    contexts: ["page"],
    documentUrlPatterns: ["https://x.com/*"]
  });
  chrome.contextMenus.create({
    id: "copy-text-only",
    parentId: "x-copier-pro",
    title: "テキストのみコピー",
    contexts: ["page"],
    documentUrlPatterns: ["https://x.com/*"]
  });
  chrome.contextMenus.create({
    id: "copy-user-and-text",
    parentId: "x-copier-pro",
    title: "投稿者 + テキストをコピー",
    contexts: ["page"],
    documentUrlPatterns: ["https://x.com/*"]
  });
  chrome.contextMenus.create({
    id: "copy-as-markdown",
    parentId: "x-copier-pro",
    title: "Markdown形式でコピー",
    contexts: ["page"],
    documentUrlPatterns: ["https://x.com/*"]
  });
}

// 渡された情報とメニューIDに応じてテキストを整形する関数
function formatText(data, menuItemId) {
  const { text, username, postUrl, postDate } = data;

  switch (menuItemId) {
    case "copy-text-only":
      const formattedDate = postDate !== '不明な日時'
        ? new Date(postDate).toISOString().slice(0, 16).replace('T', ' ')
        : '日付不明';
      const header = `# ${formattedDate} ${postUrl}`;
      const body = `${text}`;
      return `${header}\n\n${body}`;

    case "copy-user-and-text":      return `${username}\n${postUrl}\n${text}`;

    case "copy-as-markdown":
      return `> ${text.replace(/\n/g, '\n> ')}\n> — ${username} (${postUrl})`;

    default:
      return text;
  }
}

// クリップボードに書き込むヘルパー関数
async function writeToClipboard(text) {
  await chrome.offscreen.createDocument({
    url: 'offscreen.html',
    reasons: ['CLIPBOARD'],
    justification: 'Clipboard access from a service worker requires an offscreen document.',
  });
  await chrome.runtime.sendMessage({ type: 'copy-to-clipboard', target: 'offscreen-doc', text });
}

// 通知を表示するヘルパー関数
function showNotification(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: title,
    message: message,
    priority: 1
  });
}