// utils.js
// 汎用ユーティリティモジュール

/**
 * ユーザーに通知を表示するヘルパー
 * @param {string} message - 表示するメッセージ
 * @param {'info'|'error'} type - 通知の種別
 */
export function notify(message, type = 'info') {
  if (type === 'error') {
    console.error(message);
    alert(message);
  } else {
    console.log(message);
  }
}
