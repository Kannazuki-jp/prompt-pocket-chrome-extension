import { initDOM } from './dom.js';
import { fetchTemplates, buildList } from './template.js';
import { handleAdd, startEditing as formStartEditing, resetForm as formReset } from './form.js';
import { notify } from './utils.js';

// DOMのセレクタ定義
const SELECTORS = {
  list: 'template-list',
  form: 'add-template-form',
  titleInput: 'template-title',
  promptInput: 'template-prompt'
};

// DOM要素を格納するオブジェクト
let domElements;

/**
 * テンプレート描画関数
 */
async function renderTemplates() {
  try {
    const { templateListElement } = domElements;
    const templates = await fetchTemplates();
    const fragment = buildList(templates);
    templateListElement.innerHTML = '';
    templateListElement.appendChild(fragment);
  } catch (error) {
    notify('テンプレート読み込み中にエラーが発生しました。', 'error');
  }
}

/**
 * 初期化処理
 */
document.addEventListener('DOMContentLoaded', () => {
  // 他のモジュールからアクセスできるようグローバルに関数を公開
  window.renderTemplates = renderTemplates;
  try {
    // DOM要素を取得
    domElements = initDOM(SELECTORS);
    // 編集処理をグローバルに設定
    window.startEditing = (index) =>
      formStartEditing(
        index,
        domElements.titleInputElement,
        domElements.promptInputElement,
        domElements.submitButton
      );
    // フォームの追加・更新処理
    handleAdd(
      domElements.addFormElement,
      domElements.titleInputElement,
      domElements.promptInputElement,
      domElements.submitButton,
      renderTemplates,
      () => formReset(domElements.addFormElement, domElements.submitButton)
    );
    // 初回テンプレート描画
    renderTemplates();
  } catch (error) {
    notify(`初期化エラー: ${error.message}`, 'error');
  }
});