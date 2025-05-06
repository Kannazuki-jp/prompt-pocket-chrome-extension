// preview.js
// テンプレートプレビュー用モジュールを定義
// renderPreviewで選択テンプレートをプレビュー表示する

/**
 * 選択されたテンプレート内容を指定したリストアイテム直下にアコーディオン表示する関数
 * なぜ: 各項目ごとにプレビューを展開し、文脈を明確にするため
 * @param {HTMLLIElement} li - プレビューを表示するリストアイテム要素
 * @param {{title:string,prompt:string}} template - プレビュー対象のテンプレートデータ
 */
export function renderPreview(li, template) {
  // 既存のプレビューを閉じる（すべてのプレビューを削除）
  document.querySelectorAll('.template-preview').forEach(p => p.remove());

  // プレビューパネルを作成
  const panel = document.createElement('div');
  panel.classList.add('template-preview', 'open');

  // ヘッダー要素を作成
  const headerEl = document.createElement('div');
  headerEl.classList.add('template-preview-header');
  headerEl.textContent = template.title;

  panel.appendChild(headerEl);

  // プロンプト本体表示
  const promptEl = document.createElement('pre');
  promptEl.textContent = template.prompt;
  promptEl.classList.add('template-preview-content');
  panel.appendChild(promptEl);

  // li直後にパネルを挿入
  li.insertAdjacentElement('afterend', panel);
}
