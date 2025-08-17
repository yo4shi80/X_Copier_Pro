// offscreen.js

// background.jsからのメッセージを受け取るリスナー
chrome.runtime.onMessage.addListener(async (message) => {
  if (message.target === 'offscreen-doc' && message.type === 'copy-to-clipboard') {
    try {
      // テキストエリアを作成し、クリップボードに書き込むテキストを設定
      const textarea = document.createElement('textarea');
      textarea.value = message.text;
      document.body.appendChild(textarea);
      textarea.select();
      // クリップボードに書き込み
      document.execCommand('copy');
      document.body.removeChild(textarea);
    } finally {
      // 処理が完了したら、offscreenドキュメントを閉じる
      // これにより、リソースの消費を抑える
      window.close();
    }
  }
});
