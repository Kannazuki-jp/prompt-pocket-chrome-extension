import { initDOM } from '../modules/dom.js';
import { fetchTemplates, buildList } from '../modules/template.js';
import { renderPreview } from '../modules/preview.js';
import { handleAdd, startEditing as formStartEditing, resetForm as formReset } from '../modules/form.js';
import { notify } from '../modules/utils.js';

// DOMのセレクタ定義
const SELECTORS = {
  list: 'template-list',
  form: 'add-template-form',
  titleInput: 'template-title',
  promptInput: 'template-prompt'
};

// タブ切り替えロジック
// なぜ: ユーザーが複数画面を直感的に切り替えられるようにするため
function setupTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // すべてのタブボタンのactiveクラスを外す
      tabBtns.forEach(b => b.classList.remove('active'));
      // クリックしたボタンにactiveクラスを付与
      btn.classList.add('active');
      // すべてのタブコンテンツを非表示
      tabContents.forEach(tc => tc.classList.remove('active'));
      // data-tab属性に対応するタブコンテンツのみ表示
      const tabId = btn.getAttribute('data-tab');
      const target = document.getElementById('tab-' + tabId);
      if (target) {
        target.classList.add('active');
      }
    });
  });
}

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
  // タブ切り替え初期化
  setupTabs();
  // 他のモジュールからアクセスできるようグローバルに関数を公開
  window.renderTemplates = renderTemplates;
  try {
    // DOM要素を取得
    domElements = initDOM(SELECTORS);
    // 展開アイコン (▶/▼) をクリックしてプレビューをトグル表示
    domElements.templateListElement.addEventListener('click', async (e) => {
      const li = e.target.closest('li');
      if (!li) return;
      // アイコン以外のクリックは無視
      if (!e.target.classList.contains('expand-icon')) return;
      const icon = e.target;
      const index = Number(li.dataset.index);
      const templates = await fetchTemplates();
      // 既存プレビューがあるかチェック
      const next = li.nextElementSibling;
      const isOpen = next && next.classList.contains('template-preview');
      // 他の開いているプレビューを閉じる
      document.querySelectorAll('.template-preview').forEach(p => p.remove());
      domElements.templateListElement.querySelectorAll('li').forEach(item => {
        item.classList.remove('selected');
        const exp = item.querySelector('.expand-icon');
        if (exp) exp.classList.remove('open');
      });
      if (!isOpen) {
        // プレビューを表示
        renderPreview(li, templates[index]);
        li.classList.add('selected');
        icon.classList.add('open');
      }
    });
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