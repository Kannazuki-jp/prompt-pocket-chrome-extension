// sidepanel.js (リセット版)
console.log('sidepanel.js execution started.'); // 実行開始ログ

// DOM要素の取得 (スクリプト読み込み時に実行)
const templateListElement = document.getElementById('template-list');
const addFormElement = document.getElementById('add-template-form');
const titleInputElement = document.getElementById('template-title');
const promptInputElement = document.getElementById('template-prompt');
const submitButton = addFormElement.querySelector('button[type="submit"]'); // 送信ボタンを取得

let editingIndex = null; // 現在編集中のテンプレートのインデックス (-1 や null で未編集状態を示す)

/**
 * ストレージからテンプレートを読み込み、HTMLリストとして描画する関数
 */
function renderTemplates() {
  // リスト要素が存在するか確認
  if (!templateListElement) {
    console.error('#template-list element not found in DOM.');
    return; // 要素がなければ処理中断
  }

  // ストレージからテンプレートを取得
  chrome.storage.local.get(['promptTemplates'], (result) => {
    // エラーチェック
    if (chrome.runtime.lastError) {
      console.error('Error retrieving templates:', chrome.runtime.lastError);
      templateListElement.textContent = 'テンプレートの読み込みに失敗しました。';
      return;
    }

    // テンプレート配列を取得 (存在しない場合は空配列)
    const templates = result.promptTemplates || [];

    // リストをクリア
    templateListElement.innerHTML = '';

    // テンプレートがなければメッセージ表示
    if (templates.length === 0) {
      templateListElement.textContent = 'テンプレートがありません。';
      return;
    }

    // 各テンプレートをリストアイテムとして追加
    templates.forEach((template, index) => {
      const listItem = document.createElement('li');
      listItem.dataset.index = index; // リストアイテム自体にもインデックスを持たせる

      // タイトル表示用のボタンを作成
      const templateButton = document.createElement('button');
      templateButton.textContent = template.title || `テンプレート ${index + 1}`; // タイトルがない場合の代替テキスト
      templateButton.dataset.prompt = template.prompt; // プロンプト内容をデータ属性として保持 (より直接的)

      // ボタンクリック時の処理: メッセージをコンテンツスクリプトに送信
      templateButton.addEventListener('click', () => {
        const promptToSend = template.prompt; // クリックされたボタンに対応するプロンプト

        // アクティブなタブを取得
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const activeTab = tabs[0];

          // アクティブタブが存在し、IDがあることを確認
          if (activeTab && activeTab.id) {
            console.log(`Sending message to tab ${activeTab.id}:`, { action: 'insertPrompt', prompt: promptToSend });
            // コンテンツスクリプトへメッセージを送信
            chrome.tabs.sendMessage(activeTab.id, 
              { 
                action: 'insertPrompt', 
                prompt: promptToSend 
              },
              (response) => { // 応答コールバック
                if (chrome.runtime.lastError) {
                  // コンテンツスクリプトが存在しない/応答しない場合のエラー (警告レベルで表示)
                  console.warn(`Could not send message to tab ${activeTab.id}: ${chrome.runtime.lastError.message}`);
                  // 必要であればユーザーに通知 (例: alert)
                  // alert('現在のページではプロンプトを挿入できません。');
                } else {
                  // コンテンツスクリプトからの応答をログに出力
                  console.log('Response from content script:', response);
                }
              }
            );
          } else {
            console.warn('No active tab found or active tab has no ID.');
            alert('アクティブなタブが見つかりません。');
          }
        });
      });

      listItem.appendChild(templateButton);

      // 編集ボタンを作成
      const editButton = document.createElement('button');
      editButton.textContent = '編集';
      editButton.classList.add('edit-button');
      editButton.addEventListener('click', () => {
        startEditing(index);
      });
      listItem.appendChild(editButton);

      // 削除ボタンを作成
      const deleteButton = document.createElement('button');
      deleteButton.textContent = '削除';
      deleteButton.classList.add('delete-button'); // CSS スタイル用 (任意)
      deleteButton.dataset.index = index; // 削除対象のインデックスを保持

      // 削除ボタンクリック時の処理
      deleteButton.addEventListener('click', (event) => {
        const indexToDelete = parseInt(event.target.dataset.index, 10);
        console.log(`Attempting to delete template at index: ${indexToDelete}`);

        // ストレージから現在のテンプレートリストを取得
        chrome.storage.local.get({ promptTemplates: [] }, (result) => {
          let currentTemplates = result.promptTemplates;

          // 指定されたインデックスのテンプレートを削除
          if (indexToDelete >= 0 && indexToDelete < currentTemplates.length) {
            currentTemplates.splice(indexToDelete, 1); // 配列から要素を削除

            // 更新されたリストをストレージに保存
            chrome.storage.local.set({ promptTemplates: currentTemplates }, () => {
              if (chrome.runtime.lastError) {
                console.error('Error saving templates after deletion:', chrome.runtime.lastError);
                alert('テンプレートの削除中にエラーが発生しました。');
              } else {
                console.log('Template deleted successfully. Re-rendering list.');
                renderTemplates(); // リストを再描画して変更を反映
              }
            });
          } else {
            console.error('Invalid index for deletion:', indexToDelete);
            alert('削除対象のテンプレートが見つかりませんでした。');
          }
        });
      });

      listItem.appendChild(deleteButton); // 削除ボタンをリストアイテムに追加

      templateListElement.appendChild(listItem);
    });

    console.log('Templates rendered successfully.');
  });
}

/**
 * 指定されたインデックスのテンプレート編集を開始する関数
 * @param {number} index - 編集するテンプレートのインデックス
 */
function startEditing(index) {
  console.log(`Starting edit for index: ${index}`);
  chrome.storage.local.get({ promptTemplates: [] }, (result) => {
    const templates = result.promptTemplates;
    if (index >= 0 && index < templates.length) {
      const templateToEdit = templates[index];
      titleInputElement.value = templateToEdit.title;
      promptInputElement.value = templateToEdit.prompt;
      editingIndex = index; // 編集中のインデックスを設定
      submitButton.textContent = '更新'; // ボタンのテキストを変更
      titleInputElement.focus(); // タイトル入力欄にフォーカス
    } else {
      console.error('Invalid index for editing:', index);
      alert('編集対象のテンプレートが見つかりませんでした。');
    }
  });
}

/**
 * テンプレートリストをストレージに保存する共通関数
 * @param {Array<Object>} templates - 保存するテンプレートの配列
 * @param {Function} callback - 保存完了後に実行されるコールバック関数
 */
function saveTemplates(templates, callback) {
  chrome.storage.local.set({ promptTemplates: templates }, () => {
    if (chrome.runtime.lastError) {
      console.error('Error saving templates:', chrome.runtime.lastError);
      alert('テンプレートの保存中にエラーが発生しました。');
      if (callback) callback(chrome.runtime.lastError);
    } else {
      console.log('Templates saved successfully.');
      if (callback) callback(null);
    }
  });
}

/**
 * フォームの状態をリセットする関数
 */
function resetForm() {
  addFormElement.reset(); // フォームの入力内容をクリア
  editingIndex = null; // 編集状態を解除
  submitButton.textContent = '保存'; // ボタンのテキストを元に戻す
}

/**
 * テンプレート追加フォームの初期化とイベントリスナー設定
 */
function initializeAddForm() {
  if (!addFormElement || !titleInputElement || !promptInputElement || !submitButton) {
    console.error('Add form elements not found.');
    return;
  }

  addFormElement.addEventListener('submit', (event) => {
    event.preventDefault(); // デフォルトのフォーム送信をキャンセル

    const title = titleInputElement.value.trim();
    const prompt = promptInputElement.value.trim();

    // 入力チェック
    if (!title || !prompt) {
      alert('タイトルとプロンプトの両方を入力してください。');
      return;
    }

    const newTemplate = { title, prompt };

    // ストレージから現在のテンプレートリストを取得
    chrome.storage.local.get({ promptTemplates: [] }, (result) => {
      let currentTemplates = result.promptTemplates;

      if (editingIndex !== null) {
        // --- 更新処理 ---
        console.log(`Updating template at index: ${editingIndex}`);
        if (editingIndex >= 0 && editingIndex < currentTemplates.length) {
          currentTemplates[editingIndex] = newTemplate; // 該当インデックスの要素を置き換え
          saveTemplates(currentTemplates, (error) => {
            if (!error) {
              resetForm(); // フォームをリセット
              renderTemplates(); // リストを再描画
            }
          });
        } else {
          console.error("Invalid index for update:", editingIndex);
          alert('テンプレートの更新中にエラーが発生しました。');
          resetForm(); // エラーでもフォームはリセット
        }
      } else {
        // --- 追加処理 (従来通り) ---
        console.log('Adding new template');
        currentTemplates.push(newTemplate);
        saveTemplates(currentTemplates, (error) => {
          if (!error) {
            resetForm(); // フォームをリセット
            renderTemplates(); // リストを再描画
          }
        });
      }
    });
  });

  console.log('Add form initialized.');
}

// スクリプト読み込み時にテンプレートを描画
renderTemplates();

// テンプレート追加フォームを初期化
initializeAddForm();