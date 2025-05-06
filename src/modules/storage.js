// storage.js
// chrome.storage.local を Promise/async-await で扱うユーティリティ

/**
 * chrome.storage.local.get を Promise 化
 * @param {string|string[]|Object} keys - 取得するキーまたはデフォルト値を含むオブジェクト
 * @returns {Promise<Object>} Promise で取得結果を返す
 */
export function getStorage(keys) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(keys, (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result);
      }
    });
  });
}

/**
 * chrome.storage.local.set を Promise 化
 * @param {Object} items - 保存するキーと値のオブジェクト
 * @returns {Promise<void>} Promise が完了を通知
 */
export function setStorage(items) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(items, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
}
