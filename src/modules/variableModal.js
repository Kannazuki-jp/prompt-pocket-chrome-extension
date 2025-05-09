// variableModal.js
// テンプレート内変数入力用のモーダルダイアログを生成し、ユーザーの入力結果を返す

/**
 * テンプレートの変数名リストと元プロンプトを受け取り、
 * ユーザーに変数入力を促すモーダルを表示し、入力値で置換したプロンプトを返す
 * なぜ: 挿入時に変数を動的に置換するため
 * @param {string[]} variableNames
 * @param {string} promptText
 * @returns {Promise<string|null>} 入力されたプロンプト、キャンセル時はnull
 */
export default function showVariableModal(variableNames, promptText) {
  return new Promise((resolve) => {
    // オーバーレイ作成
    const overlay = document.createElement('div');
    overlay.classList.add('modal-overlay');
    // モーダルコンテナ
    const modal = document.createElement('div');
    modal.classList.add('modal');
    // ヘッダー
    const header = document.createElement('div');
    header.classList.add('modal-header');
    header.textContent = '変数を入力してください';
    modal.appendChild(header);
    // ボディ: 変数ごとの入力フィールド生成
    const body = document.createElement('div');
    body.classList.add('modal-body');
    variableNames.forEach((name) => {
      const field = document.createElement('div');
      field.classList.add('md-field');
      const label = document.createElement('label');
      label.setAttribute('for', `var-${name}`);
      label.textContent = name;
      const input = document.createElement('input');
      input.id = `var-${name}`;
      input.type = 'text';
      field.appendChild(label);
      field.appendChild(input);
      body.appendChild(field);
    });
    modal.appendChild(body);
    // フッター: ボタン生成
    const footer = document.createElement('div');
    footer.classList.add('modal-footer');
    const insertBtn = document.createElement('button');
    insertBtn.classList.add('btn', 'btn--primary');
    insertBtn.textContent = '挿入';
    const cancelBtn = document.createElement('button');
    cancelBtn.classList.add('btn', 'btn--text');
    cancelBtn.textContent = 'キャンセル';
    footer.appendChild(insertBtn);
    footer.appendChild(cancelBtn);
    modal.appendChild(footer);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    // 最初の入力にフォーカス
    const firstInput = body.querySelector('input');
    if (firstInput) firstInput.focus();
    // 挿入ボタン押下時の処理
    insertBtn.addEventListener('click', () => {
      let filled = promptText;
      variableNames.forEach((name) => {
        const value = body.querySelector(`#var-${name}`).value;
        filled = filled.replace(new RegExp(`\{\{${name}\}\}`, 'g'), value);
      });
      document.body.removeChild(overlay);
      resolve(filled);
    });
    // キャンセル時
    cancelBtn.addEventListener('click', () => {
      document.body.removeChild(overlay);
      resolve(null);
    });
  });
}
