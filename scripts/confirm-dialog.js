// 创建确认对话框
export function createConfirmDialog() {
  // 获取DOM元素
  const container = document.getElementById("confirm-dialog-container");
  const messageEl = document.getElementById("confirm-message");
  const cancelBtn = document.getElementById("confirm-cancel");
  const okBtn = document.getElementById("confirm-ok");

  // 显示对话框
  function show(message) {
    return new Promise((resolve) => {
      messageEl.textContent = message; // 设置消息
      container.classList.add("show"); // 显示对话框

      // 处理结果
      const handleResult = (result) => {
        container.classList.remove("show"); // 隐藏对话框
        resolve(result); // 解析Promise
      };

      // 按钮事件
      cancelBtn.onclick = () => handleResult(false);
      okBtn.onclick = () => handleResult(true);
    });
  }

  // 返回公共方法
  return { show };
}
