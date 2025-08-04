// 创建待办事项弹窗
export function createTodoPrompt(onSubmit) {
  // 获取DOM元素
  const container = document.getElementById("custom-prompt-container");
  const form = document.getElementById("todo-form");
  const input = document.getElementById("todo-input");
  const tagInput = document.getElementById("todo-tag");
  const deadlineInput = document.getElementById("todo-deadline");
  const cancelBtn = document.getElementById("prompt-cancel");
  const submitBtn = document.getElementById("prompt-submit");
  const titleEl = document.getElementById("prompt-title");

  // 隐藏弹窗
  function hide() {
    container.classList.remove("show"); // 移除show类
    form.reset(); // 重置表单
  }

  // 表单提交事件
  form.addEventListener("submit", (e) => {
    e.preventDefault(); // 阻止默认提交行为
    onSubmit(input.value, tagInput.value, deadlineInput.value); // 调用回调
    hide(); // 隐藏弹窗
  });

  // 取消按钮事件
  cancelBtn.addEventListener("click", hide);

  // 显示弹窗
  function show(todo = null) {
    container.classList.add("show"); // 添加show类以显示

    // 获取今天的日期字符串
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const todayStr = `${year}-${month}-${day}`;
    deadlineInput.min = todayStr; // 设置最小日期为今天

    if (todo) {
      // 编辑模式
      titleEl.textContent = "编辑待办事项";
      submitBtn.textContent = "更新";

      // 填充数据
      input.value = todo.text;
      tagInput.value = todo.tag || "";

      // 设置截止日期
      if (todo.deadline) {
        const deadlineDate = new Date(todo.deadline);
        const year = deadlineDate.getFullYear();
        const month = String(deadlineDate.getMonth() + 1).padStart(2, "0");
        const day = String(deadlineDate.getDate()).padStart(2, "0");
        deadlineInput.value = `${year}-${month}-${day}`;
      } else {
        deadlineInput.value = todayStr; // 默认今天
      }
    } else {
      // 添加模式
      titleEl.textContent = "添加待办事项";
      submitBtn.textContent = "添加";

      // 清空表单
      input.value = "";
      tagInput.value = "";
      deadlineInput.value = todayStr; // 默认今天
    }

    input.focus(); // 聚焦到输入框
  }

  // 返回公共方法
  return { show, hide };
}
