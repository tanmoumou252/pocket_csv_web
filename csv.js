
    const textarea1 = document.getElementById('textarea1');
    const textarea2 = document.getElementById('textarea2');
    const processBtn = document.getElementById('processCsvBtn');

    // 预期的字段顺序
    const HEADERS = ["title", "url", "time_added", "tags", "status"];

document.addEventListener('DOMContentLoaded', () => {
        // 强制清空文本框 1 的内容
        if (textarea1) {
            textarea1.value = '';
            // 也可以顺便清空文本框 2
            if (textarea2) {
                 textarea2.value = '';
            }
        }
    // 提示用户如何操作
    textarea1.placeholder = "请在此粘贴Pocket导出的 CSV 数据\n表头这一行(title,url,time_added,tags,status)不需要复制";

    });
    /**
     * 将 Unix 时间戳转换为 YYYY-MM-DD 格式的日期字符串
     * @param {string} timestampStr - Unix 时间戳字符串
     * @returns {string} - YYYY-MM-DD 格式的日期
     */
    function formatTimestamp(timestampStr) {
        const timestamp = parseInt(timestampStr, 10);
        if (isNaN(timestamp) || timestamp === 0) {
            // 如果时间戳无效或为空，返回空字符串或一个默认值
            return "";
        }
        
        // JavaScript Date 对象需要毫秒，所以需要乘以 1000
        const date = new Date(timestamp * 1000);
        
        const year = date.getFullYear();
        // getMonth() 返回 0-11，需要 +1
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    }

    /**
     * 核心处理逻辑：将 CSV 文本转换为 JSON 数组格式
     */
    function processCsvToJson() {
        const csvText = textarea1.value.trim();
        if (!csvText) {
            textarea2.value = "错误: 请在第一个文本框中输入 CSV 数据。";
            return;
        }

        // 按行分割，并过滤掉空行
        const lines = csvText.split('\n').filter(line => line.trim() !== '');
        
        const jsonArray = [];

        lines.forEach(line => {
            // 简单的 CSV 解析：按逗号分割。
            // ⚠️ 注意：这是一种简化的解析，不处理字段内的逗号或引号。
            const values = line.split(','); 

            if (values.length < HEADERS.length) {
                // 如果字段不足，跳过或记录错误
                console.warn(`跳过格式不正确的行: ${line}`);
                return;
            }

            const item = {};
            
            // 映射字段并进行转换
            HEADERS.forEach((key, index) => {
                let value = values[index] ? values[index].trim() : "";
                
                if (key === "time_added") {
                    // 转换 Unix 时间戳
                    item[key] = formatTimestamp(value);
                } else if (key === "tags") {
                    // tags 字段在您的示例中是空值 ""，但在目标 JSON 中希望使用分号分隔。
                    // 这里的示例数据中 tags 字段为空，我们保持空字符串。
                    // 如果未来需要将空格分隔改为分号分隔，逻辑会更复杂。
                    // 假设 CSV 中的 tags 字段已是目标格式 (或为空)。
                    
                    // 确保 tags 字段如果为空，仍然保持空字符串。
                    item[key] = value.replace(/;+/g, ';'); // 清理重复分号
                } else if (key === "title") {
                    // 清理 title 字段中的多余引号
                    item[key] = value.replace(/^"|"$/g, '').trim(); 
                } else {
                    item[key] = value;
                }
            });

            jsonArray.push(item);
        });

        // 格式化输出为带有逗号分隔的对象列表
        if (jsonArray.length > 0) {
    // -----------------------------------------------------------------
    // 📌 关键修改区域：格式化输出
    // -----------------------------------------------------------------
    
    // 1. 使用 map 方法将每个 JavaScript 对象转换为格式化的 JSON 字符串
    const formattedItems = jsonArray.map(item => {
        // 使用 JSON.stringify(item, null, 2) 进行格式化和缩进
        return JSON.stringify(item, null, 2); 
    });

    // 2. 使用 join 方法，在每个对象之间添加逗号分隔符
    //    这里不再使用复杂的 replace 来移除换行，而是让 JSON.stringify 负责缩进
    const innerContent = formattedItems.join(',\n'); 

    // 3. 添加最外部的方括号，并插入缩进后的内容
    const finalJsonOutput = 
`[
${innerContent}
]`; // 确保最后的 ] 后面没有逗号

    // 最终输出到第二个文本框
    textarea2.value = finalJsonOutput;
    
    // -----------------------------------------------------------------
    
} else {
            textarea2.value = "未找到有效数据。请检查 CSV 格式。";
        }
    }

    // 绑定按钮点击事件
    processBtn.addEventListener('click', processCsvToJson);


// --- 复制功能逻辑 ---
    const copyBtn = document.getElementById('copyBtn');
    const textareaToCopy = document.getElementById('textarea2');

    // 复制成功后恢复状态的计时器
    let copyTimeout;

    // ... (保持上方的变量定义不变) ...

    function handleCopy() {
        if (!textareaToCopy.value) {
            return;
        }

        // 核心步骤：记录状态，临时解除 disabled 属性
        const wasDisabled = textareaToCopy.disabled;
        if (wasDisabled) {
            textareaToCopy.disabled = false;
        }

        // 尝试使用现代 Clipboard API
        if (navigator.clipboard) {
            navigator.clipboard.writeText(textareaToCopy.value).then(() => {
                showCopiedStatus();
            }).catch(err => {
                fallbackCopy();
            }).finally(() => { // 无论成功失败，都恢复状态
                if (wasDisabled) {
                    textareaToCopy.disabled = true;
                }
            });
        } else {
            // 传统方法
            fallbackCopy();
        }
    }
    
    // 传统复制方法
    function fallbackCopy() {
        try {
            textareaToCopy.select();
            textareaToCopy.setSelectionRange(0, 99999);
            document.execCommand("copy");
            showCopiedStatus();
        } catch (err) {
            console.error('无法执行复制命令', err);
            alert('复制失败，请手动复制文本框内容。');
        } finally {
            // 复制完成后恢复 disabled 状态 (防止在 finally 块外执行)
            if (textareaToCopy.disabled === false) { 
                textareaToCopy.disabled = true;
            }
        }
        
        textareaToCopy.blur(); 
    }

    // ... (其余 showCopiedStatus 保持不变) ...

    function showCopiedStatus() {
        // 切换样式到“已复制”状态
        copyBtn.classList.add('copied');
        
        // 清除任何旧的计时器
        if (copyTimeout) {
            clearTimeout(copyTimeout);
        }
        
        // 3秒后恢复默认状态
        copyTimeout = setTimeout(() => {
            copyBtn.classList.remove('copied');
        }, 3000);
    }

    // 绑定复制按钮事件
    if (copyBtn) {
        copyBtn.addEventListener('click', handleCopy);
    }