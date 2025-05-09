import { initDOM } from '../modules/dom.js';
import { fetchTemplates, buildList } from '../modules/template.js';
import { renderPreview } from '../modules/preview.js';
import { handleAdd, startEditing as formStartEditing, resetForm as formReset } from '../modules/form.js';
import { notify } from '../modules/utils.js';
import { setupTabs } from '../modules/tabs.js';

// DOMのセレクタ定義
const SELECTORS = {
  list: 'template-list',
  form: 'add-template-form',
  titleInput: 'template-title',
  promptInput: 'template-prompt'
};

// DOM要素を格納するオブジェクト
let domElements;

// 取得したテンプレートをキャッシュ
let cachedTemplates = [];

// 現在選択中のリストアイテムとプレビュー要素をトラッキング
let selectedItem = null;
let currentPreview = null;

/**
 * テンプレート描画関数
 */
async function renderTemplates() {
  try {
    const { templateListElement } = domElements;
    const templates = await fetchTemplates();
    // キャッシュを更新
    cachedTemplates = templates;
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
  // タブ切り替え初期化
  setupTabs();
  try {
    // DOM要素を取得
    domElements = initDOM(SELECTORS);
    // 展開アイコン (▶/▼) をクリックしてプレビューをトグル表示
    domElements.templateListElement.addEventListener('click', (e) => {
      const li = e.target.closest('li');
      if (!li || !e.target.classList.contains('expand-icon')) return;
      const icon = e.target;
      const index = Number(li.dataset.index);
      // 同じアイテムのトグル: 開いている場合は閉じる
      if (currentPreview && selectedItem === li) {
        currentPreview.remove();
        li.classList.remove('selected');
        icon.classList.remove('open');
        currentPreview = null;
        selectedItem = null;
        return;
      }
      // 既存のプレビューを閉じる
      if (currentPreview) {
        currentPreview.remove();
        selectedItem.classList.remove('selected');
        const prevIcon = selectedItem.querySelector('.expand-icon');
        if (prevIcon) prevIcon.classList.remove('open');
      }
      // 新規プレビューを表示
      renderPreview(li, cachedTemplates[index]);
      li.classList.add('selected');
      icon.classList.add('open');
      // トラッキング更新
      currentPreview = li.nextElementSibling;
      selectedItem = li;
    });
    // 編集イベントをリスンして処理
    domElements.templateListElement.addEventListener('edit-template', (e) => {
      const idx = e.detail;
      formStartEditing(
        idx,
        domElements.titleInputElement,
        domElements.promptInputElement,
        domElements.submitButton
      );
    });
    // テンプレート更新完了イベントで再描画
    document.addEventListener('templates-updated', () => {
      renderTemplates();
    });
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