// template.js
// テンプレート関連の機能をまとめたモジュール

// テンプレート保存用のキー
export const STORAGE_KEY = 'promptTemplates';

/**
 * chrome.storage.local.get のコールバックを Promise 化し、
 * テンプレート配列を非同期に取得するための関数。
 * なぜ: コールバックのネストを避け、async/await で扱いやすくするため。
 * @returns {Promise<Array<{title: string, prompt: string}>>}
 */
export async function fetchTemplates() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      if (chrome.runtime.lastError) {
        console.error('テンプレート取得失敗:', chrome.runtime.lastError);
        reject(chrome.runtime.lastError);
      } else {
        // ストレージに保存されている配列がなければ空配列を返す
        resolve(result[STORAGE_KEY] || []);
      }
    });
  });
}

/**
 * テンプレートひとつ分の<li>要素を生成する関数
 * なぜ: 項目生成ロジックを分離し、可読性とテスト容易性を向上させるため。
 * @param {Object} template
 * @param {number} index
 * @returns {HTMLLIElement}
 */
export function createTemplateItem(template, index) {
  const li = document.createElement('li');
  li.dataset.index = index;
  li.classList.add('template-item');
  
  // 展開アイコン - アコーディオン機能のためのUI要素
  const expandIcon = document.createElement('span');
  expandIcon.classList.add('expand-icon');
  expandIcon.textContent = '▶';
  li.appendChild(expandIcon);
  
  // タイトル表示要素 - テキストオーバーフロー対策とスタイリングのため分離
  const titleEl = document.createElement('div');
  titleEl.classList.add('template-title');
  titleEl.textContent = template.title;
  li.appendChild(titleEl);

  // ボタンコンテナ作成 - ボタンのグループ化
  const buttonContainer = document.createElement('div');
  buttonContainer.classList.add('template-buttons');
  li.appendChild(buttonContainer);
  
  // 挿入ボタン
  const templateButton = document.createElement('button');
  templateButton.innerHTML = '<span>挿入</span>';
  templateButton.classList.add('template-insert', 'btn');
  templateButton.title = 'テンプレートを挿入';
  templateButton.addEventListener('click', (e) => {
    e.stopPropagation();
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (activeTab && activeTab.id) {
        chrome.tabs.sendMessage(
          activeTab.id,
          { action: 'insertPrompt', prompt: template.prompt },
          (response) => {
            if (chrome.runtime.lastError) {
              console.warn('メッセージ送信失敗:', chrome.runtime.lastError.message);
            }
          }
        );
      }
    });
  });
  buttonContainer.appendChild(templateButton);

  // 編集ボタン - 適切なアイコンで表現
  const editButton = document.createElement('button');
  editButton.innerHTML = '✏️';
  editButton.classList.add('template-edit', 'btn', 'icon-btn');
  editButton.title = '編集';
  editButton.addEventListener('click', (event) => {
    event.stopPropagation();
    window.startEditing(index);
  });
  buttonContainer.appendChild(editButton);

  // 削除ボタン - ゴミ箱アイコンで直感性向上
  const deleteButton = document.createElement('button');
  deleteButton.innerHTML = '✖';
  deleteButton.classList.add('template-delete', 'btn', 'icon-btn');
  deleteButton.title = '削除';
  deleteButton.addEventListener('click', (event) => {
    event.stopPropagation();
    chrome.storage.local.get({ [STORAGE_KEY]: [] }, (result) => {
      const items = result[STORAGE_KEY];
      items.splice(index, 1);
      chrome.storage.local.set({ [STORAGE_KEY]: items }, () => {
        if (chrome.runtime.lastError) {
          console.error('テンプレート削除失敗:', chrome.runtime.lastError);
          alert('テンプレートの削除中にエラーが発生しました。');
        } else {
          // グローバル経由でレンダリング関数を呼び出し
          if (typeof window.renderTemplates === 'function') {
            window.renderTemplates();
          }
        }
      });
    });
  });
  buttonContainer.appendChild(deleteButton);

  return li;
}

/**
 * テンプレート配列から DocumentFragment を構築し、
 * 一括で DOM に追加できる形にする関数。
 * なぜ: 単一のフラグメントでまとめて操作することで
 *     再描画コストを軽減しパフォーマンスを向上させるため。
 * @param {Array<{title: string, prompt: string}>} templates
 * @returns {DocumentFragment}
 */
export function buildList(templates) {
  const fragment = document.createDocumentFragment();
  if (templates.length === 0) {
    const message = document.createElement('div');
    message.textContent = 'テンプレートがありません。';
    fragment.appendChild(message);
    return fragment;
  }
  templates.forEach((template, index) => {
    fragment.appendChild(createTemplateItem(template, index));
  });
  return fragment;
}

/**
 * テンプレート配列をストレージに保存する関数 (Promise版)
 * なぜ: 操作を async/await で扱えるようにするため
 * @param {Array<{title:string,prompt:string}>} templates
 * @returns {Promise<void>}
 */
export async function setTemplates(templates) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [STORAGE_KEY]: templates }, () => {
      if (chrome.runtime.lastError) {
        console.error('テンプレート保存失敗:', chrome.runtime.lastError);
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
}

/**
 * 新規テンプレートを追加する関数
 * @param {{title:string,prompt:string}} template
 */
export async function addTemplate(template) {
  const templates = await fetchTemplates();
  templates.push(template);
  await setTemplates(templates);
}

/**
 * 既存テンプレートを更新する関数
 * @param {number} index
 * @param {{title:string,prompt:string}} template
 */
export async function updateTemplate(index, template) {
  const templates = await fetchTemplates();
  if (index >= 0 && index < templates.length) {
    templates[index] = template;
    await setTemplates(templates);
  } else {
    throw new Error('Invalid index for update: ' + index);
  }
}
