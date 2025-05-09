// tabs.js
// タブ切り替えロジックをモジュール化

/**
 * タブ切り替えロジック
 * なぜ: ユーザーが複数画面を直感的に切り替えられるようにするため
 */
export function setupTabs() {
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
