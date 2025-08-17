// content_script.js

// background.jsからのメッセージを受け取るリスナー
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // 対象となる投稿要素を見つける
  const targetArticle = findTopmostVisibleArticle();

  if (!targetArticle) {
    showTemporaryNotification("コピー対象の投稿が見つかりません。", "error");
    // 右クリックメニューのためにエラーを返す
    if (request.action === 'getPostData') {
      sendResponse({ error: "コピー対象の投稿が見つかりません。" });
    }
    return true;
  }

  // 投稿データを抽出
  const postData = extractPostData(targetArticle);
  if (!postData) {
    showTemporaryNotification("投稿情報の抽出に失敗しました。", "error");
    if (request.action === 'getPostData') {
      sendResponse({ error: "投稿情報の抽出に失敗しました。" });
    }
    return true;
  }

  // アイコンクリックからのコピー要求
  if (request.action === 'copyUserAndTextFromIconClick') {
    const textToCopy = `${postData.username}
${postData.postUrl}
${postData.text}`;
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        showTemporaryNotification("コピーしました！", "success");
      })
      .catch(err => {
        console.error('X Copier Pro: クリップボードへの書き込みに失敗しました。', err);
        showTemporaryNotification("コピーに失敗しました。", "error");
      });
  }

  // 右クリックメニューからのデータ要求
  if (request.action === 'getPostData') {
    sendResponse(postData);
  }

  return true; // 非同期応答のために常にtrueを返す
});

/**
 * 画面内に表示されている最も上の<article>要素を見つける関数
 * @returns {HTMLElement|null} 見つかった<article>要素、またはnull
 */
function findTopmostVisibleArticle() {
  const articles = Array.from(document.querySelectorAll('article'));
  let topmostArticle = null;
  let minTop = Infinity;

  for (const article of articles) {
    const rect = article.getBoundingClientRect();
    // 画面内に少しでも表示されているものを候補とする
    if (rect.bottom > 0 && rect.top < window.innerHeight) {
      // 画面の一番上に近いものを選択
      if (rect.top < minTop) {
        minTop = rect.top;
        topmostArticle = article;
      }
    }
  }
  return topmostArticle;
}

/**
 * 指定された投稿要素（<article>）から必要な情報を抽出する関数
 * @param {HTMLElement} articleElement - 投稿の<article>要素
 * @returns {object|null} 抽出した投稿データ（text, username, postUrl, postDate）
 */
function extractPostData(articleElement) {
  try {
    const usernameElement = articleElement.querySelector('div[data-testid="User-Name"] span:last-child');
    const username = usernameElement ? usernameElement.textContent.trim() : '不明なユーザー';

    const postTextElement = articleElement.querySelector('div[data-testid="tweetText"]');
    const text = postTextElement ? postTextElement.innerText : '';

    const timeElement = articleElement.querySelector('time');
    const postUrl = timeElement && timeElement.parentElement.href ? timeElement.parentElement.href : window.location.href;
    const postDate = timeElement ? timeElement.getAttribute('datetime') : '不明な日時';

    return { text, username, postUrl, postDate };

  } catch (error) {
    console.error("X Copier Pro: 投稿データの抽出中にエラーが発生しました。", error);
    return null;
  }
}

/**
 * ページ上に一時的な通知メッセージを表示する関数
 * @param {string} message - 表示するメッセージ
 * @param {'success'|'error'} type - メッセージの種類
 */
function showTemporaryNotification(message, type) {
  // 既存の通知があれば削除
  const existingNotification = document.getElementById('x-copier-pro-notification');
  if (existingNotification) {
    existingNotification.remove();
  }

  const notification = document.createElement('div');
  notification.id = 'x-copier-pro-notification';
  notification.textContent = message;
  
  Object.assign(notification.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    padding: '15px 25px',
    borderRadius: '8px',
    color: 'white',
    backgroundColor: type === 'success' ? 'rgba(29, 155, 240, 0.9)' : 'rgba(244, 33, 46, 0.9)',
    zIndex: '9999',
    fontSize: '16px',
    fontWeight: 'bold',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    transition: 'opacity 0.5s ease-in-out',
    opacity: '1'
  });

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      notification.remove();
    }, 500);
  }, 3000);
}