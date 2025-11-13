// 全局状态变量
// 初始化时 allData 为空数组，等待数据加载
let allData = []; 
let currentStatus = 'all'; 
let currentTag = 'all';

// 元素引用
const tableBody = document.getElementById('tableBody');
const mainTabsContainer = document.getElementById('mainTabs'); 
const tagsDropdownContent = document.getElementById('tagsDropdownContent'); 
const tagsMasterTab = document.querySelector('.tag-master-tab'); 
const tagsCountBadge = document.getElementById('tags-count-badge'); 


// ===================================================================
// 📌 新增：异步数据加载和主初始化函数
// ===================================================================

async function loadDataAndInitialize() {
    try {
        const response = await fetch('./data.json');
        
        if (!response.ok) {
            throw new Error(`HTTP 错误! 状态: ${response.status}. 请确保您在使用本地服务器运行。`);
        }
        
        const data = await response.json();
        
        // 📌 核心修复：将加载的数据赋给全局变量 allData
        allData = data; 
        
        // -----------------------------------------------------------
        // 触发初始化函数：现在 allData 已填充
        // -----------------------------------------------------------
        
        // 1. 初始化标签悬停菜单 (现在它将读取全局 allData)
        initializeTagFilters(allData);
        
        // 2. 绑定事件 (只需要绑定一次)
        bindFilterEvents();
        
        // 3. 初次渲染 (现在它将读取全局 allData)
        filterAndRender();

    } catch (error) {
        console.error("加载数据文件失败:", error);
        tableBody.innerHTML = '<tr><td colspan="4" class="no-results" style="text-align: center; padding: 30px; border-top: 1px solid var(--nav-border-color);">数据加载失败，请检查 data.json 文件路径和格式。详情请看控制台。</td></tr>';
    }
}


// --- 初始化函数 (修改 DOMContentLoaded) ---
document.addEventListener('DOMContentLoaded', () => {
    // 📌 启动异步加载和初始化流程，所有依赖数据的操作都在 loadDataAndInitialize 内部完成
    loadDataAndInitialize();
});


// --- 1. Tags 悬停菜单初始化 ---
// ⚠️ 注意：这个函数可以保持接收 data 参数，但由于现在它在 loadDataAndInitialize 中被调用，
//      并传入了 allData，保持原样即可。
function initializeTagFilters(data) {
    const allTags = new Set();
    
    // 收集所有唯一的 Tags
    data.forEach(item => {
        const tagsArray = item.tags.split(';').map(t => t.trim()).filter(t => t);
        tagsArray.forEach(tag => allTags.add(tag));
    });
    
    const uniqueTagCount = allTags.size; 

    //  更新计数徽章
    if (tagsCountBadge) {
        tagsCountBadge.textContent = uniqueTagCount;
        
        if (uniqueTagCount === 0) {
             tagsCountBadge.style.display = 'none';
        } else {
             tagsCountBadge.style.display = 'inline-block';
        }
    }
    
    tagsDropdownContent.innerHTML = ''; 

    // 动态生成 Tags 选项并插入到次级弹窗
    Array.from(allTags).sort().forEach(tag => {
        const tagItem = document.createElement('div');
        tagItem.className = 'tag-item';
        tagItem.setAttribute('data-filter-type', 'tag');
        tagItem.setAttribute('data-filter-value', tag);
        tagItem.textContent = tag;
        tagsDropdownContent.appendChild(tagItem);
    });
}


// --- 2. 绑定筛选事件 ---
function bindFilterEvents() {
    // 代理所有主标签 (Status 和 Tags Master Tab) 的点击事件
    mainTabsContainer.addEventListener('click', handleMainTabClick);
    
    // 绑定 Tags 子菜单中的标签点击事件
    tagsDropdownContent.addEventListener('click', handleSubTagClick);
}


// 处理 Status 和 "所有标签" 主标签的点击
function handleMainTabClick(event) {
    const target = event.target.closest('.nav-link'); 
    if (!target) return;
    
    event.preventDefault(); 

    const filterType = target.getAttribute('data-filter-type');
    const filterValue = target.getAttribute('data-filter-value');
    
    // --- 样式更新 ---
    mainTabsContainer.querySelectorAll('.nav-link').forEach(item => item.classList.remove('active'));
    target.classList.add('active');
    
    if (filterType === 'tag' && filterValue === 'all') {
        tagsDropdownContent.querySelectorAll('.tag-item').forEach(item => item.classList.remove('active'));
    }

    // --- 状态更新 ---
    if (filterType === 'status') {
        currentStatus = filterValue;
        currentTag = 'all'; 
    } else if (filterType === 'tag') {
        currentTag = filterValue;
        currentStatus = 'all'; 
    }

    // 重新筛选和渲染
    filterAndRender();
}

// 处理 Tags 子菜单中标签的点击
function handleSubTagClick(event) {
    const target = event.target.closest('.tag-item');
    if (!target) return;

    const filterValue = target.getAttribute('data-filter-value');
    
    // --- 样式更新 ---
    mainTabsContainer.querySelectorAll('.nav-link').forEach(item => item.classList.remove('active'));
    tagsMasterTab.classList.add('active');

    tagsDropdownContent.querySelectorAll('.tag-item').forEach(item => item.classList.remove('active'));
    target.classList.add('active');

    // --- 状态更新 ---
    currentTag = filterValue;
    currentStatus = 'all'; 

    // 重新筛选和渲染
    filterAndRender();
}


// --- 3. 筛选和渲染逻辑 (使用全局 allData) ---
function filterAndRender() {
    // 📌 这里的 allData 现在是全局的，并且在 loadDataAndInitialize 中被赋值
    let filteredData = allData.filter(item => {
        // Status 筛选
        const statusMatch = currentStatus === 'all' || item.status === currentStatus;
        
        // Tags 筛选
        let tagMatch = true;
        if (currentTag !== 'all') {
            const itemTags = item.tags.split(';').map(t => t.trim()).filter(t => t);
            tagMatch = itemTags.includes(currentTag);
        }

        return statusMatch && tagMatch;
    });

    renderTable(filteredData);
}


/**
 * 渲染表格数据
 */
function renderTable(data) {
    tableBody.innerHTML = ''; 

    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 30px; border-top: 1px solid var(--nav-border-color);">没有匹配当前筛选条件的数据。</td></tr>';
        return;
    }

    data.forEach(item => {
        const row = tableBody.insertRow();
        
        // Title (超链接列)
        const titleCell = row.insertCell();
        const titleLink = document.createElement('a');
        titleLink.href = item.url;
        titleLink.textContent = item.title;
        titleLink.target = "_blank"; 
        titleCell.appendChild(titleLink);

        // Time Added
        row.insertCell().textContent = item.time_added;

        // Tags
        row.insertCell().textContent = item.tags;

        // Status
        row.insertCell().textContent = item.status;
    });
}