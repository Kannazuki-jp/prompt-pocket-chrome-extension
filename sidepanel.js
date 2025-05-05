// sidepanel.js (リセット版)
// 定数定義
const STORAGE_KEY = 'promptTemplates';
const SELECTORS = {
  list: 'template-list', // # を外してID名のみにします
  form: 'add-template-form',
  titleInput: 'template-title',
  promptInput: 'template-prompt'
};
console.log('sidepanel.js execution started.'); // 実行開始ログ

// DOM要素
let templateListElement, addFormElement, titleInputElement, promptInputElement, submitButton;

// DOM要素取得をデバッグする関数
function debugElement(id) {
  console.log(`Checking element with ID: ${id}`);
  const el = document.getElementById(id);
  console.log(`Element found: ${el !== null}`);
  return el;
}

let editingIndex = null; // 現在編集中のテンプレートのインデックス (-1 や null で未編集状態を示す)

/**
 * ストレージからテンプレートを読み込み、HTMLリストとして描画する関数
 */
async function renderTemplates() {
  // 要素の存在確認
  if (!templateListElement) {
    console.error('テンプレートリスト要素が見つかりません');
    return;
  }
  try {
    const templates = await fetchTemplates();
    const fragment = buildList(templates);
    templateListElement.innerHTML = '';
    templateListElement.appendChild(fragment);
  } catch (error) {
    console.error('renderTemplates エラー:', error);
    templateListElement.textContent = 'テンプレートの読み込み中にエラーが発生しました。';
  }
}

/**
 * テンプレートリストをストレージに保存する共通関数
 * @param {Array<Object>} templates - 保存するテンプレートの配列
 * @param {Function} callback - 保存完了後に実行されるコールバック関数
 */
function saveTemplates(templates, callback) {
  chrome.storage.local.set({ [STORAGE_KEY]: templates }, () => {
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
    chrome.storage.local.get({ [STORAGE_KEY]: [] }, (result) => {
      let currentTemplates = result[STORAGE_KEY];

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

/**
 * 指定されたインデックスのテンプレート編集を開始する関数
 * @param {number} index - 編集するテンプレートのインデックス
 */
function startEditing(index) {
  console.log(`Starting edit for index: ${index}`);
  chrome.storage.local.get({ [STORAGE_KEY]: [] }, (result) => {
    const templates = result[STORAGE_KEY];
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

// 初期化処理を実行
// 注意: Chrome拡張機能の設定によってはイベントが発火しない場合があるので、即時関数も追加
function initSidePanel() {
  console.log('initSidePanelを開始...');
  try {
    console.log('DOM要素をチェック中...');
    const allElements = document.querySelectorAll('*');
    console.log(`ページ上の要素数: ${allElements.length}`);
    
    // 名前付きのHTML要素を確認してログ出力
    console.log('IDを持つ要素:');
    for (const el of document.querySelectorAll('[id]')) {
      console.log(`- ID: ${el.id}`);
    }
    
    // DOM要素を直接取得
    templateListElement = debugElement(SELECTORS.list);
    if (!templateListElement) {
      console.error(`要素が見つかりません: #${SELECTORS.list}`);
      return; // 中断するが例外は投げない
    }
    
    addFormElement = debugElement(SELECTORS.form);
    if (!addFormElement) {
      console.error(`要素が見つかりません: #${SELECTORS.form}`);
      return;
    }
    
    titleInputElement = debugElement(SELECTORS.titleInput);
    if (!titleInputElement) {
      console.error(`要素が見つかりません: #${SELECTORS.titleInput}`);
      return;
    }
    
    promptInputElement = debugElement(SELECTORS.promptInput);
    if (!promptInputElement) {
      console.error(`要素が見つかりません: #${SELECTORS.promptInput}`);
      return;
    }
    
    submitButton = addFormElement.querySelector('button[type="submit"]');
    if (!submitButton) {
      console.error('Submit button not found in form');
      return;
    }
    
    // スクリプト読み込み時にテンプレートを描画
    renderTemplates();
    
    // テンプレート追加フォームを初期化
    initializeAddForm();
    
    console.log('サイドパネル初期化完了');
  } catch (error) {
    console.error('初期化エラー:', error.message);
  }
}

// DOMContentLoadedイベントで初期化を実行
document.addEventListener('DOMContentLoaded', initSidePanel);

// バックアップとして、即時関数で一定時間後にも初期化を試みる
setTimeout(() => {
  console.log('延微初期化チェック...');
  if (!templateListElement) {
    console.log('DOMContentLoadedが発火しなかったか、要素の存在チェックに失敗したため、手動で初期化します');
    initSidePanel();
  }
}, 500);