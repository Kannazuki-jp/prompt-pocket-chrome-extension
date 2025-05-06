// content.js (Restored)

console.log('Content script loaded.');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received from side panel:', message);

  // メッセージのアクションがプロンプト挿入かどうかを確認
  if (message.action === 'insertPrompt' && message.prompt) {
    const promptText = message.prompt;
    let targetElement = null;
    let success = false;

    console.log(`Attempting to insert prompt: \"${promptText.substring(0, 50)}...\"`);

    // 現在のホスト名に基づいてターゲット要素を特定
    const hostname = window.location.hostname;

    if (hostname.includes('chatgpt.com')) {
      // ChatGPT の入力欄セレクター (変更される可能性あり)
      targetElement = document.querySelector('#prompt-textarea');
      if (targetElement) {
        console.log('Found ChatGPT input element:', targetElement);
        // textareaの場合は value を設定 -> contenteditable div なので innerText を設定
        targetElement.innerText = promptText;
        targetElement.dispatchEvent(new Event('input', { bubbles: true }));
        targetElement.focus(); // 任意: 入力欄にフォーカスを当てる
        success = true;
      } else {
        console.error('ChatGPT textarea not found.');
      }
    } else if (hostname.includes('gemini.google.com')) {
      // Gemini の入力欄セレクター (変更される可能性あり)
      // contenteditable属性を持つdivを探す (より具体的なセレクターが必要な場合あり)
      targetElement = document.querySelector('div[contenteditable="true"].ql-editor'); // Gemini のセレクタ候補
      if(!targetElement){
         // Geminiの別のセレクタ候補
         targetElement = document.querySelector('.input-box .ql-editor');
      }

      if (targetElement) {
        console.log('Found Gemini contenteditable div:', targetElement);
        // contenteditableの場合は innerText または textContent を設定し、input イベントを発火
        targetElement.innerText = promptText; // または targetElement.textContent = promptText;
        targetElement.dispatchEvent(new Event('input', { bubbles: true }));
        targetElement.focus(); // 任意: 入力欄にフォーカスを当てる
        success = true;
      } else {
        console.error('Gemini contenteditable div not found.');
      }
    } else {
      console.warn('Current page is not recognized as ChatGPT or Gemini.');
    }

    // 処理結果に基づいて応答を返す
    if (success) {
      console.log('Prompt inserted successfully.');
      sendResponse({ status: 'success', message: 'Prompt inserted.' });
    } else {
      console.error('Failed to insert prompt.');
      sendResponse({ status: 'error', message: 'Target element not found or page not supported.' });
    }

  } else {
    // 想定外のメッセージタイプの場合は無視するか、エラー応答を返す
    console.log('Received unknown message action or missing prompt:', message.action);
    sendResponse({ status: 'ignored', message: 'Unknown action or missing prompt.' });
  }

  // 非同期の応答が必要な場合は true を返す (今回は sendMessage の応答コールバックがあるので基本的に不要)
  // return true;
});