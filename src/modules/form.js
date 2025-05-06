// form.js
// フォーム関連のロジックをまとめるモジュール

import { addTemplate, updateTemplate, fetchTemplates } from './template.js';

let editingIndex = null;

/**
 * テンプレート追加・更新処理のイベントハンドラを登録
 * @param {HTMLFormElement} form
 * @param {HTMLInputElement} titleInput
 * @param {HTMLInputElement} promptInput
 * @param {HTMLButtonElement} submitButton
 * @param {Function} renderTemplates
 * @param {Function} resetForm
 */
export function handleAdd(form, titleInput, promptInput, submitButton, renderTemplates, resetForm) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const title = titleInput.value.trim();
    const prompt = promptInput.value.trim();
    if (!title || !prompt) {
      alert('タイトルとプロンプトを入力してください。');
      return;
    }
    const template = { title, prompt };
    try {
      if (editingIndex !== null) {
        await updateTemplate(editingIndex, template);
      } else {
        await addTemplate(template);
      }
      resetForm();
      renderTemplates();
      editingIndex = null;
    } catch (e) {
      console.error('フォーム処理エラー:', e);
      alert('保存中にエラーが発生しました。');
    }
  });
}

/**
 * 編集処理開始
 * @param {number} index
 * @param {HTMLInputElement} titleInput
 * @param {HTMLInputElement} promptInput
 * @param {HTMLButtonElement} submitButton
 */
export async function startEditing(index, titleInput, promptInput, submitButton) {
  editingIndex = index;
  try {
    const templates = await fetchTemplates();
    if (templates && templates[index]) {
      const templateToEdit = templates[index];
      titleInput.value = templateToEdit.title;
      promptInput.value = templateToEdit.prompt;
      submitButton.textContent = '更新';
    } else {
      console.error('編集対象のテンプレートが見つかりません。index:', index);
      alert('編集対象のテンプレートの読み込みに失敗しました。');
      // エラー発生時はフォームをリセットするか、何らかのフォールバック処理を検討
    }
  } catch (error) {
    console.error('編集中にエラーが発生しました:', error);
    alert('テンプレートの読み込み中にエラーが発生しました。');
  }
}

/**
 * フォームと状態をリセット
 * @param {HTMLFormElement} form
 * @param {HTMLButtonElement} submitButton
 */
export function resetForm(form, submitButton) {
  form.reset();
  submitButton.textContent = '保存';
}
