// dom.js
// DOM要素の取得・初期化をまとめるモジュール

/**
 * 指定されたセレクタ設定に基づきDOM要素を取得し返す
 * なぜ: DOM取得ロジックを一元化し、テストやメンテナンスを容易にするため
 * @param {Object} selectors - 要素IDのマッピング
 * @param {string} selectors.list - テンプレートリストのID
 * @param {string} selectors.form - フォームのID
 * @param {string} selectors.titleInput - タイトル入力欄のID
 * @param {string} selectors.promptInput - プロンプト入力欄のID
 * @returns {{ templateListElement: HTMLElement, addFormElement: HTMLFormElement, titleInputElement: HTMLInputElement, promptInputElement: HTMLInputElement, submitButton: HTMLButtonElement }}
 */
export function initDOM(selectors) {
  // IDから要素を取得し、存在チェックを行うユーティリティ
  function debugElement(id) {
    console.log(`Checking element with ID: ${id}`);
    const el = document.getElementById(id);
    console.log(`Element found: ${el !== null}`);
    return el;
  }

  const templateListElement = debugElement(selectors.list);
  if (!templateListElement) {
    throw new Error(`要素が見つかりません: #${selectors.list}`);
  }

  const addFormElement = debugElement(selectors.form);
  if (!addFormElement) {
    throw new Error(`要素が見つかりません: #${selectors.form}`);
  }

  const titleInputElement = debugElement(selectors.titleInput);
  if (!titleInputElement) {
    throw new Error(`要素が見つかりません: #${selectors.titleInput}`);
  }

  const promptInputElement = debugElement(selectors.promptInput);
  if (!promptInputElement) {
    throw new Error(`要素が見つかりません: #${selectors.promptInput}`);
  }

  const submitButton = addFormElement.querySelector('button[type="submit"]');
  if (!submitButton) {
    throw new Error('Submit button not found in form');
  }

  return { templateListElement, addFormElement, titleInputElement, promptInputElement, submitButton };
}

/**
 * プレビューコンテナ要素を取得する
 * @returns {HTMLElement}
 */
export function getPreviewContainer() {
  const el = document.getElementById('template-preview');
  if (!el) throw new Error('プレビューコンテナが見つかりません: #template-preview');
  return el;
}
