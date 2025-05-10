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
      const { fetchTemplates, buildList, addTemplate } = tpl;
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
        const idx = e.detail;
        // 編集開始
        startEditing(
          idx,
          titleInputElement,
          promptInputElement,
          submitButton
        );
        // 全てのDeleteボタンを無効化
        templateListElement.querySelectorAll('.btn--delete').forEach(btn => {
          btn.disabled = true;
          btn.classList.add('btn--disabled');
        });
      });

      // MDファイルインポート処理
      const importInput = document.getElementById('import-md-file');
      const importBtn = document.getElementById('import-md-btn');
      const fileNameDisplay = document.getElementById('selected-file-name');
      
      // ファイル選択時の表示更新
      importInput.addEventListener('change', () => {
        const file = importInput.files[0];
        if (file) {
          fileNameDisplay.textContent = file.name;
          // 選択済みの場合はスタイル変更
          fileNameDisplay.classList.add('file-selected');
        } else {
          fileNameDisplay.textContent = '選択されていません';
          fileNameDisplay.classList.remove('file-selected');
        }
      });
      
      importBtn.addEventListener('click', () => {
        const file = importInput.files[0];
        if (!file) {
          notify('ファイルを選択してください', 'error');
          return;
        }
        
        // ローディング表示
        importBtn.disabled = true;
        importBtn.innerHTML = '<svg class="spinner" viewBox="0 0 50 50"><circle cx="25" cy="25" r="20"></circle></svg> 処理中...';
        
        const reader = new FileReader();
        reader.onload = async () => {
          const markdownText = reader.result;
          const title = file.name.replace(/\.md$/i, '');
          try {
            await addTemplate({ title, prompt: markdownText });
            notify('インポート完了', 'success');
            document.dispatchEvent(new CustomEvent('templates-updated'));
            
            // フォームリセット
            importInput.value = '';
            fileNameDisplay.textContent = '選択されていません';
            fileNameDisplay.classList.remove('file-selected');
          } catch (e) {
            console.error('MDインポート失敗:', e);
            notify('インポート失敗', 'error');
          } finally {
            // ボタン状態を元に戻す
            importBtn.disabled = false;
            importBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 12V4M8 4L5 7M8 4l3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 12h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg> インポート';
          }
        };
        reader.readAsText(file);
      });

      // テンプレート追加・更新
      handleAdd(
        addFormElement,
        titleInputElement,
        promptInputElement,
        submitButton,
        // 再描画コールバック
        async () => { 
          cachedTemplates = await fetchTemplates();
          const frag2 = buildList(cachedTemplates);
          templateListElement.innerHTML = '';
          templateListElement.appendChild(frag2);
        },
        // フォームリセット後にDeleteボタンを再度有効化
        () => {
          resetForm(addFormElement, submitButton);
          templateListElement.querySelectorAll('.btn--delete').forEach(btn => {
            btn.disabled = false;
            btn.classList.remove('btn--disabled');
          });
        }
      );

      // テンプレート削除時も即時再描画
      document.addEventListener('templates-updated', async () => {
        cachedTemplates = await fetchTemplates();
        const frag = buildList(cachedTemplates);
        templateListElement.innerHTML = '';
        templateListElement.appendChild(frag);
        // プレビューが開いていれば閉じる
        if (currentPreview) {
          currentPreview.remove();
          selectedItem?.classList.remove('selected');
          selectedItem?.querySelector('.expand-icon')?.classList.remove('open');
          currentPreview = null;
          selectedItem = null;
        }
      });
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