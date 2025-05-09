// template.js
// テンプレート関連の機能をまとめたモジュール
import showVariableModal from './variableModal.js';

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
 * プロンプト文字列から変数名を抽出する関数
 * なぜ: 変数のプレースホルダーを事前に解析し、挿入時の処理を高速化するため
 * @param {string} promptText
 * @returns {string[]}
 */
function extractVariables(promptText) {
  const regex = /\{\{(.*?)\}\}/g;
  const vars = [];
  let match;
  while ((match = regex.exec(promptText)) !== null) {
    if (!vars.includes(match[1])) vars.push(match[1]);
  }
  return vars;
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

  // 挿入ボタン（プラスアイコンのみ）
  const templateButton = document.createElement('button');
  templateButton.innerHTML = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="8" y="3" width="2" height="12" rx="1" fill="currentColor"/><rect x="3" y="8" width="12" height="2" rx="1" fill="currentColor"/></svg>`;
  templateButton.classList.add('btn', 'btn--primary', 'btn--insert');
  templateButton.title = 'Insert template';
  templateButton.addEventListener('click', async (e) => {
    e.stopPropagation();
    // 保存時に抽出済みの変数を使ってモーダル表示
    let filledPrompt = template.prompt;
    if (template.variables && template.variables.length > 0) {
      const result = await showVariableModal(template.variables, template.prompt);
      if (result === null) return; // キャンセル時は何もしない
      filledPrompt = result;
    }
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (activeTab && activeTab.id) {
        chrome.tabs.sendMessage(
          activeTab.id,
          { action: 'insertPrompt', prompt: filledPrompt },
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

  // 編集ボタン（鉛筆アイコンのみ）
  const editButton = document.createElement('button');
  editButton.innerHTML = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M13.13 2.87a2 2 0 0 1 2.83 2.83l-8.08 8.08a2 2 0 0 1-.71.44l-3.11 1.04a.5.5 0 0 1-.63-.63l1.04-3.11a2 2 0 0 1 .44-.71l8.08-8.08Zm1.41 1.42a1 1 0 0 0-1.41 0l-.71.7 1.41 1.42.71-.71a1 1 0 0 0 0-1.41ZM11.61 5.34 4 12.95V14h1.05l7.61-7.61-1.05-1.05Z" fill="currentColor"/></svg>`;
  editButton.classList.add('btn', 'btn--edit');
  editButton.title = 'Edit';
  editButton.addEventListener('click', (event) => {
    event.stopPropagation();
    // 編集イベントを発行して sidepanel.js 側で処理
    const editEvt = new CustomEvent('edit-template', { bubbles: true, detail: index });
    li.dispatchEvent(editEvt);
  });
  buttonContainer.appendChild(editButton);

  // 削除ボタン（ゴミ箱アイコンのみ）
  const deleteButton = document.createElement('button');
  deleteButton.innerHTML = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="5" y="7" width="8" height="8" rx="2" fill="currentColor"/><rect x="7" y="3" width="4" height="2" rx="1" fill="currentColor"/><rect x="3" y="5" width="12" height="2" rx="1" fill="currentColor"/></svg>`;
  deleteButton.classList.add('btn', 'btn--delete');
  deleteButton.title = 'Delete';
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
          // 削除後に再描画用イベントを発行
          document.dispatchEvent(new CustomEvent('templates-updated'));
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
    message.textContent = 'No templates found.';
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
  const newTemplate = {
    title: template.title,
    prompt: template.prompt,
    variables: extractVariables(template.prompt)
  };
  templates.push(newTemplate);
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
    templates[index] = {
      title: template.title,
      prompt: template.prompt,
      variables: extractVariables(template.prompt)
    };
    await setTemplates(templates);
  } else {
    throw new Error('Invalid index for update: ' + index);
  }
}
