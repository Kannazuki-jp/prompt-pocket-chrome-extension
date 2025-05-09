import { initDOM } from '../modules/dom.js';
import { setupTabs } from '../modules/tabs.js';

// DOMのセレクタ定義
const SELECTORS = {
  list: 'template-list',
  form: 'add-template-form',
  titleInput: 'template-title',
  promptInput: 'template-prompt'
};

// 初期化処理: パネル表示時に必要なモジュールを動的に import
document.addEventListener('DOMContentLoaded', () => {
  setupTabs();
  const dom = initDOM(SELECTORS);
  let initialized = false;
  let cachedTemplates = [];
  let currentPreview = null;
  let selectedItem = null;

  // テンプレートタブクリックで遅延ロード
  const templateTabBtn = document.querySelector('.tab-btn[data-tab="templates"]');
  templateTabBtn.addEventListener('click', async () => {
    if (initialized) return;
    initialized = true;
    try {
      // 必要モジュールを並列ロード
      const [tpl, prev, form, util] = await Promise.all([
        import('../modules/template.js'),
        import('../modules/preview.js'),
        import('../modules/form.js'),
        import('../modules/utils.js')
      ]);
      const { fetchTemplates, buildList } = tpl;
      const { renderPreview } = prev;
      const { handleAdd, startEditing, resetForm } = form;
      const { notify } = util;
      const { templateListElement, addFormElement, titleInputElement, promptInputElement, submitButton } = dom;

      // テンプレート取得・描画
      cachedTemplates = await fetchTemplates();
      const fragment = buildList(cachedTemplates);
      templateListElement.innerHTML = '';
      templateListElement.appendChild(fragment);

      // プレビュー切替
      templateListElement.addEventListener('click', (e) => {
        // ボタン（insert/edit/delete）クリック時は無視
        if (e.target.closest('.btn')) return;
        // li要素を取得
        const li = e.target.closest('li.template-item');
        if (!li) return;
        const idx = Number(li.dataset.index);
        // トグル動作
        if (li === selectedItem) {
          currentPreview?.remove();
          li.classList.remove('selected');
          li.querySelector('.expand-icon')?.classList.remove('open');
          selectedItem = null;
          currentPreview = null;
          return;
        }
        // 他のプレビューが開いていれば閉じる
        if (currentPreview) {
          currentPreview.remove();
          selectedItem.classList.remove('selected');
          selectedItem.querySelector('.expand-icon')?.classList.remove('open');
        }
        // 新規プレビューを開く
        renderPreview(li, cachedTemplates[idx]);
        li.classList.add('selected');
        li.querySelector('.expand-icon')?.classList.add('open');
        currentPreview = li.nextElementSibling;
        selectedItem = li;
      });

      // 編集イベント
      templateListElement.addEventListener('edit-template', (e) => {
        startEditing(
          e.detail,
          titleInputElement,
          promptInputElement,
          submitButton
        );
      });

      // テンプレート追加・更新
      handleAdd(
        addFormElement,
        titleInputElement,
        promptInputElement,
        submitButton,
        async () => { 
          cachedTemplates = await fetchTemplates();
          const frag2 = buildList(cachedTemplates);
          templateListElement.innerHTML = '';
          templateListElement.appendChild(frag2);
        },
        () => resetForm(addFormElement, submitButton)
      );
    } catch (err) {
      // エラー時も notify を動的にインポートする（既にロードされている可能性もあるが念のため）
      try {
        const { notify } = await import('../modules/utils.js');
        notify(`初期化エラー (template tab): ${err.message}`, 'error');
      } catch (notifyErr) {
        console.error('Failed to load notify module for error reporting:', notifyErr);
        console.error('Original template tab initialization error:', err);
      }
    }
  });
  // 初期表示で既にアクティブなら自動ロード
  if (templateTabBtn.classList.contains('active')) {
    templateTabBtn.click();
  }
});