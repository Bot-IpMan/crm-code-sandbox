/**
 * File Explorer module for ProCRM
 * Adds a dock panel section for browsing and managing vault files
 */

const FILE_SYSTEM_STORAGE_KEY = 'crmFileSystemState';
const FILE_SYSTEM_STORAGE_VERSION = 1;

const DEFAULT_FILE_SYSTEM = {
    "name": "vault",
    "type": "folder",
    "children": [
        {
            "name": "Clients",
            "type": "folder",
            "children": [
                {
                    "name": "@InsightEdge Consulting – Марія Коваленко.md",
                    "type": "file"
                },
                {
                    "name": "README.md",
                    "type": "file"
                }
            ]
        },
        {
            "name": "Competitors",
            "type": "folder",
            "children": [
                {
                    "name": "InsightSphere – Analytics.md",
                    "type": "file"
                },
                {
                    "name": "MarketPulse – SaaS.md",
                    "type": "file"
                },
                {
                    "name": "README.md",
                    "type": "file"
                }
            ]
        },
        {
            "name": "Contacts",
            "type": "folder",
            "children": [
                {
                    "name": "README.md",
                    "type": "file"
                },
                {
                    "name": "Бондар Сергій – Agency Intelligence.md",
                    "type": "file"
                },
                {
                    "name": "Гончар Оксана – UrbanX Mobility.md",
                    "type": "file"
                },
                {
                    "name": "Коваленко Марія – InsightEdge Consulting.md",
                    "type": "file"
                },
                {
                    "name": "Лисенко Андрій – Agency Sales.md",
                    "type": "file"
                },
                {
                    "name": "Орлов Денис – GreenFin Analytics.md",
                    "type": "file"
                }
            ]
        },
        {
            "name": "Daily Notes",
            "type": "folder",
            "children": [
                {
                    "name": "2024-05-06.md",
                    "type": "file"
                },
                {
                    "name": "README.md",
                    "type": "file"
                }
            ]
        },
        {
            "name": "Documents",
            "type": "folder",
            "children": [
                {
                    "name": "Clients",
                    "type": "folder",
                    "children": [
                        {
                            "name": "InsightEdge Consulting",
                            "type": "folder",
                            "children": [
                                {
                                    "name": "Contracts",
                                    "type": "folder",
                                    "children": [
                                        {
                                            "name": "2024-05-06 – InsightEdge – Annual Service Agreement.md",
                                            "type": "file"
                                        }
                                    ]
                                },
                                {
                                    "name": "README.md",
                                    "type": "file"
                                },
                                {
                                    "name": "Scopes",
                                    "type": "folder",
                                    "children": [
                                        {
                                            "name": "2024-05-05 – InsightEdge – Competitive Intelligence Scope.md",
                                            "type": "file"
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                {
                    "name": "README.md",
                    "type": "file"
                }
            ]
        },
        {
            "name": "Knowledge",
            "type": "folder",
            "children": [
                {
                    "name": "Account Playbooks",
                    "type": "folder",
                    "children": [
                        {
                            "name": "InsightEdge.md",
                            "type": "file"
                        }
                    ]
                },
                {
                    "name": "Agency Operations.md",
                    "type": "file"
                },
                {
                    "name": "Partners",
                    "type": "folder",
                    "children": [
                        {
                            "name": "Strategy Guild.md",
                            "type": "file"
                        }
                    ]
                },
                {
                    "name": "README.md",
                    "type": "file"
                }
            ]
        },
        {
            "name": "Leads",
            "type": "folder",
            "children": [
                {
                    "name": "GreenFin Analytics (lead).md",
                    "type": "file"
                },
                {
                    "name": "InsightEdge Consulting (lead).md",
                    "type": "file"
                },
                {
                    "name": "README.md",
                    "type": "file"
                },
                {
                    "name": "UrbanX Mobility (lead).md",
                    "type": "file"
                }
            ]
        },
        {
            "name": "Projects",
            "type": "folder",
            "children": [
                {
                    "name": "Deal – InsightEdge Retainer.md",
                    "type": "file"
                },
                {
                    "name": "README.md",
                    "type": "file"
                },
                {
                    "name": "UrbanX Competitive Program.md",
                    "type": "file"
                }
            ]
        },
        {
            "name": "README.md",
            "type": "file"
        },
        {
            "name": "Reports",
            "type": "folder",
            "children": [
                {
                    "name": "CRM Analytics Dashboard.md",
                    "type": "file"
                },
                {
                    "name": "Data Export Playbook.md",
                    "type": "file"
                },
                {
                    "name": "README.md",
                    "type": "file"
                },
                {
                    "name": "Weekly Review Template.md",
                    "type": "file"
                }
            ]
        },
        {
            "name": "Sales Pipeline.md",
            "type": "file"
        },
        {
            "name": "Tasks",
            "type": "folder",
            "children": [
                {
                    "name": "README.md",
                    "type": "file"
                },
                {
                    "name": "Налагодити звіт для InsightEdge.md",
                    "type": "file"
                },
                {
                    "name": "Підготувати аналітичний дайджест для GreenFin.md",
                    "type": "file"
                },
                {
                    "name": "Фоллоу-ап з UrbanX Mobility.md",
                    "type": "file"
                }
            ]
        },
        {
            "name": "Templates",
            "type": "folder",
            "children": [
                {
                    "name": "Client Template.md",
                    "type": "file"
                },
                {
                    "name": "Competitor Template.md",
                    "type": "file"
                },
                {
                    "name": "Lead Template.md",
                    "type": "file"
                },
                {
                    "name": "Meeting or Call Template.md",
                    "type": "file"
                },
                {
                    "name": "Project or Campaign Template.md",
                    "type": "file"
                },
                {
                    "name": "README.md",
                    "type": "file"
                },
                {
                    "name": "Task Template.md",
                    "type": "file"
                }
            ]
        }
    ]
};

let fileSystemState = null;
let fileManagerCurrentPath = [];
let fileManagerInitialized = false;
let fileManagerExpandedNodes = new Set();
let fileManagerDragData = null;
let fileManagerSearchQuery = '';

function showFiles() {
    showView('files');
    setPageHeader('files');
    fileManagerSearchQuery = '';
    initializeFileManager();
}

function initializeFileManager() {
    if (!fileSystemState) {
        fileSystemState = loadFileSystemState();
    }

    if (!fileManagerInitialized) {
        buildFileManagerLayout();
        initializeTreeExpansion();
        fileManagerInitialized = true;
    }

    renderFileManager();
}

function buildFileManagerLayout() {
    const filesView = document.getElementById('filesView');
    if (!filesView) {
        return;
    }

    filesView.innerHTML = `
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h3 class="text-lg font-semibold text-gray-800">Vault Explorer</h3>
                    <p class="text-sm text-gray-500" id="filesCurrentFolder"></p>
                    <p class="text-xs text-gray-400 mt-1" id="filesFolderSummary"></p>
                </div>
                <div class="flex items-center flex-wrap gap-3 justify-end">
                    <div class="relative">
                        <span class="absolute inset-y-0 left-3 flex items-center text-gray-400">
                            <i class="fas fa-magnifying-glass text-sm"></i>
                        </span>
                        <input id="filesSearchInput" type="search" placeholder="Search files or folders"
                               class="pl-9 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white min-w-[220px]"
                               autocomplete="off">
                        <button id="filesClearSearchBtn" type="button"
                                class="hidden absolute inset-y-0 right-2 flex items-center text-gray-400 hover:text-gray-600">
                            <span class="sr-only">Clear search</span>
                            <i class="fas fa-circle-xmark"></i>
                        </button>
                    </div>
                    <button id="filesCreateFolderBtn" class="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
                        <i class="fas fa-folder-plus mr-2"></i>New Folder
                    </button>
                    <button id="filesCreateFileBtn" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        <i class="fas fa-file-circle-plus mr-2"></i>New File
                    </button>
                </div>
            </div>
            <div class="mt-6 flex flex-col lg:flex-row lg:items-start lg:space-x-6 space-y-6 lg:space-y-0">
                <div class="lg:w-72 w-full bg-gray-50 border border-gray-100 rounded-lg">
                    <div class="px-4 py-3 border-b border-gray-100 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Folder tree
                    </div>
                    <div id="filesTree" class="max-h-[420px] overflow-y-auto px-2 py-3 space-y-1 text-sm"></div>
                </div>
                <div class="flex-1 w-full">
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div id="filesBreadcrumbs" class="flex items-center flex-wrap gap-2 text-sm text-gray-600"></div>
                        <p id="filesSearchStatus" class="text-xs text-gray-400 hidden"></p>
                    </div>
                    <div id="filesList" class="mt-4 border border-gray-100 rounded-lg overflow-hidden bg-white"></div>
                </div>
            </div>
        </div>
    `;

    filesView.querySelector('#filesCreateFolderBtn').addEventListener('click', () => openCreateItemModal('folder'));
    filesView.querySelector('#filesCreateFileBtn').addEventListener('click', () => openCreateItemModal('file'));
    filesView.querySelector('#filesList').addEventListener('click', handleFileListClick);
    filesView.querySelector('#filesBreadcrumbs').addEventListener('click', handleBreadcrumbClick);
    filesView.querySelector('#filesList').addEventListener('dragstart', handleListDragStart);
    filesView.querySelector('#filesList').addEventListener('dragend', handleListDragEnd);
    filesView.querySelector('#filesList').addEventListener('dragenter', handleDropTargetDragEnter);
    filesView.querySelector('#filesList').addEventListener('dragover', handleDropTargetDragOver);
    filesView.querySelector('#filesList').addEventListener('dragleave', handleDropTargetDragLeave);
    filesView.querySelector('#filesList').addEventListener('drop', handleDropOnTarget);

    const treeContainer = filesView.querySelector('#filesTree');
    treeContainer.addEventListener('click', handleTreeClick);
    treeContainer.addEventListener('dragenter', handleDropTargetDragEnter);
    treeContainer.addEventListener('dragover', handleDropTargetDragOver);
    treeContainer.addEventListener('dragleave', handleDropTargetDragLeave);
    treeContainer.addEventListener('drop', handleDropOnTarget);

    const searchInput = filesView.querySelector('#filesSearchInput');
    const clearButton = filesView.querySelector('#filesClearSearchBtn');
    if (searchInput) {
        searchInput.addEventListener('input', handleFileSearchInput);
    }
    if (clearButton) {
        clearButton.addEventListener('click', clearFileSearchQuery);
    }
}

function renderFileManager() {
    if (!fileSystemState) {
        fileSystemState = cloneDefaultFileSystem();
    }

    const currentNode = getCurrentFolderNode();
    if (!currentNode) {
        fileManagerCurrentPath = [];
        saveFileSystemState(fileSystemState);
        return renderFileManager();
    }

    const rootName = fileSystemState.name || DEFAULT_FILE_SYSTEM.name;
    const pathLabel = '/' + [rootName, ...fileManagerCurrentPath].join('/');
    const currentFolderLabel = document.getElementById('filesCurrentFolder');
    if (currentFolderLabel) {
        currentFolderLabel.textContent = pathLabel;
    }

    const searchInput = document.getElementById('filesSearchInput');
    if (searchInput && searchInput.value !== fileManagerSearchQuery) {
        searchInput.value = fileManagerSearchQuery;
    }
    const clearButton = document.getElementById('filesClearSearchBtn');
    if (clearButton) {
        if (fileManagerSearchQuery && fileManagerSearchQuery.trim().length > 0) {
            clearButton.classList.remove('hidden');
        } else {
            clearButton.classList.add('hidden');
        }
    }

    renderFolderTree();
    renderBreadcrumbs(rootName);
    renderFileList(currentNode);
}

function renderFolderTree() {
    const treeContainer = document.getElementById('filesTree');
    if (!treeContainer) {
        return;
    }

    const treeHtml = buildFolderTreeNode(fileSystemState, []);
    treeContainer.innerHTML = treeHtml;
}

function renderBreadcrumbs(rootName) {
    const breadcrumbsContainer = document.getElementById('filesBreadcrumbs');
    if (!breadcrumbsContainer) {
        return;
    }

    const segments = [rootName, ...fileManagerCurrentPath];
    const breadcrumbHtml = segments.map((segment, index) => {
        const safeSegment = escapeHtml(segment);
        if (index === segments.length - 1) {
            return `<span class="text-gray-700 font-medium">${safeSegment}</span>`;
        }
        return `<button type="button" data-index="${index}" class="text-blue-600 hover:text-blue-700 focus:outline-none">${safeSegment}</button>`;
    }).join('<span class="text-gray-300">/</span>');

    breadcrumbsContainer.innerHTML = breadcrumbHtml;
}

function renderFileList(folderNode) {
    const listContainer = document.getElementById('filesList');
    if (!listContainer) {
        return;
    }

    const children = Array.isArray(folderNode.children) ? folderNode.children : [];
    sortChildren(children);

    const folderCount = children.filter(child => child.type === 'folder').length;
    const fileCount = children.filter(child => child.type === 'file').length;
    const summaryLabel = document.getElementById('filesFolderSummary');
    if (summaryLabel) {
        summaryLabel.textContent = `${folderCount} folder${folderCount === 1 ? '' : 's'} • ${fileCount} file${fileCount === 1 ? '' : 's'}`;
    }

    const searchStatus = document.getElementById('filesSearchStatus');
    if (searchStatus) {
        searchStatus.classList.add('hidden');
        searchStatus.textContent = '';
    }

    const query = (fileManagerSearchQuery || '').trim().toLowerCase();
    if (query) {
        listContainer.removeAttribute('data-drop-path');
        const matches = searchFileSystem(fileSystemState, query, []);
        if (summaryLabel) {
            summaryLabel.textContent = `${matches.length} match${matches.length === 1 ? '' : 'es'} for "${fileManagerSearchQuery.trim()}"`;
        }
        if (searchStatus) {
            searchStatus.classList.remove('hidden');
            searchStatus.textContent = matches.length > 0
                ? `Filtering across the vault for "${fileManagerSearchQuery.trim()}"`
                : `No results for "${fileManagerSearchQuery.trim()}"`;
        }
        listContainer.innerHTML = renderSearchResults(matches, query);
        return;
    }

    listContainer.setAttribute('data-drop-path', createPathKey(fileManagerCurrentPath));

    if (children.length === 0) {
        listContainer.innerHTML = `
            <div class="p-8 text-center text-gray-500 text-sm">
                <i class="fas fa-folder-open text-3xl text-gray-300 mb-3"></i>
                <p>This folder is empty.</p>
                <p class="mt-2 text-xs text-gray-400">Use the buttons above to create a file or folder.</p>
            </div>
        `;
        return;
    }

    const folderChildren = children.filter(child => child.type === 'folder');
    const fileChildren = children.filter(child => child.type === 'file');

    const folderSection = folderChildren.length > 0
        ? `
            <div class="space-y-4 p-4">
                <p class="text-xs font-semibold uppercase tracking-wide text-gray-400">Folders</p>
                <div class="space-y-4">
                    ${folderChildren.map(child => renderFolderPreview(child, [...fileManagerCurrentPath, child.name])).join('')}
                </div>
            </div>
        `
        : '';

    const filesSection = fileChildren.length > 0
        ? `
            <div class="border-t border-gray-100 bg-gray-50 p-4">
                <p class="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Files</p>
                <div class="grid gap-2">
                    ${fileChildren.map(child => renderNestedItem(child, fileManagerCurrentPath)).join('')}
                </div>
            </div>
        `
        : '';

    listContainer.innerHTML = folderSection + filesSection;
}

function renderFolderPreview(folderNode, pathSegments) {
    const safeName = escapeHtml(folderNode.name);
    const encodedName = encodeURIComponent(folderNode.name);
    const folderPathKey = createPathKey(pathSegments);
    const nestedChildren = Array.isArray(folderNode.children) ? [...folderNode.children] : [];
    sortChildren(nestedChildren);
    const nestedHtml = nestedChildren.length > 0
        ? nestedChildren.map(child => renderNestedItem(child, pathSegments)).join('')
        : `<p class="text-xs text-gray-400 bg-white border border-dashed border-gray-200 rounded-md px-3 py-2">No items inside this folder yet.</p>`;
    const totalCount = nestedChildren.length;

    return `
        <div class="border border-gray-200 rounded-lg shadow-sm hover:border-blue-300 transition bg-white" data-drop-path="${folderPathKey}">
            <div class="flex items-start justify-between gap-3 p-3 pb-0">
                <div class="flex items-center gap-3">
                    <span class="w-10 h-10 rounded-lg flex items-center justify-center bg-yellow-100 text-yellow-600">
                        <i class="fas fa-folder-tree"></i>
                    </span>
                    <div>
                        <p class="text-sm font-semibold text-gray-800">${safeName}</p>
                        <p class="text-xs text-gray-500">${totalCount} item${totalCount === 1 ? '' : 's'} inside</p>
                    </div>
                </div>
                <button type="button" class="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md flex items-center gap-1"
                        data-name="${encodedName}" data-type="folder" data-item-path="${folderPathKey}" data-item-type="folder" draggable="true">
                    <i class="fas fa-folder-open text-xs"></i>
                    Open
                </button>
            </div>
            <div class="p-3 pt-4 bg-gray-50 border-t border-gray-100 rounded-b-lg space-y-3">
                ${nestedHtml}
            </div>
        </div>
    `;
}

function renderNestedItem(node, parentPathSegments) {
    const itemPathSegments = [...parentPathSegments, node.name];
    const itemPathKey = createPathKey(itemPathSegments);
    const encodedName = encodeURIComponent(node.name);
    const safeName = escapeHtml(node.name);
    const isFolder = node.type === 'folder';
    const icon = isFolder ? 'fa-folder' : 'fa-file-lines';
    const accent = isFolder ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-100 text-blue-600';
    const dropAttribute = isFolder ? `data-drop-path="${itemPathKey}"` : '';
    const childCount = Array.isArray(node.children) ? node.children.length : 0;
    const detailLabel = isFolder ? `${childCount} item${childCount === 1 ? '' : 's'}` : 'Markdown file';
    const grandchildrenPreview = isFolder ? renderGrandchildrenPreview(node, itemPathSegments) : '';

    return `
        <div class="space-y-2">
            <button type="button" class="w-full flex items-center justify-between gap-3 px-3 py-2 bg-white rounded-md border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition text-left"
                    data-name="${encodedName}" data-type="${node.type}" data-item-path="${itemPathKey}" data-item-type="${node.type}" ${dropAttribute} draggable="true">
                <div class="flex items-center gap-3">
                    <span class="w-8 h-8 rounded-md flex items-center justify-center ${accent}">
                        <i class="fas ${icon} text-sm"></i>
                    </span>
                    <div>
                        <p class="text-sm font-medium text-gray-700">${safeName}</p>
                        <p class="text-xs text-gray-500">${detailLabel}</p>
                    </div>
                </div>
                <i class="fas fa-angle-right text-gray-300"></i>
            </button>
            ${grandchildrenPreview}
        </div>
    `;
}

function renderGrandchildrenPreview(folderNode, pathSegments) {
    const grandchildren = Array.isArray(folderNode.children) ? [...folderNode.children] : [];
    if (grandchildren.length === 0) {
        return `<p class="text-xs text-gray-400 pl-11">No child items</p>`;
    }

    sortChildren(grandchildren);
    const previewItems = grandchildren.slice(0, 4);
    const previewButtons = previewItems.map(child => renderGrandchildChip(child, pathSegments)).join('');
    const remainder = grandchildren.length - previewItems.length;
    const remainderBadge = remainder > 0
        ? `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full bg-gray-100 text-xs text-gray-500">+${remainder} more</span>`
        : '';

    return `
        <div class="pl-11 flex flex-wrap gap-2">
            ${previewButtons}
            ${remainderBadge}
        </div>
    `;
}

function renderGrandchildChip(node, pathSegments) {
    const childPathSegments = [...pathSegments, node.name];
    const childPathKey = createPathKey(childPathSegments);
    const encodedName = encodeURIComponent(node.name);
    const safeName = escapeHtml(node.name);
    const isFolder = node.type === 'folder';
    const icon = isFolder ? 'fa-folder' : 'fa-file-lines';
    const chipClasses = isFolder
        ? 'bg-yellow-50 text-yellow-700 border border-yellow-100'
        : 'bg-blue-50 text-blue-700 border border-blue-100';
    const childCount = Array.isArray(node.children) ? node.children.length : 0;
    const detailLabel = isFolder
        ? `${childCount} item${childCount === 1 ? '' : 's'}`
        : 'Markdown file';
    const dropAttribute = isFolder ? `data-drop-path="${childPathKey}"` : '';

    return `
        <button type="button" class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${chipClasses} hover:bg-blue-100 hover:text-blue-700 transition"
                data-name="${encodedName}" data-type="${node.type}" data-item-path="${childPathKey}" data-item-type="${node.type}" ${dropAttribute} draggable="true">
            <i class="fas ${icon}"></i>
            <span class="truncate max-w-[160px]">${safeName}</span>
            <span class="text-[10px] uppercase tracking-wide text-gray-400">${detailLabel}</span>
        </button>
    `;
}

function handleFileSearchInput(event) {
    fileManagerSearchQuery = event.target.value || '';
    renderFileManager();
}

function clearFileSearchQuery() {
    fileManagerSearchQuery = '';
    const searchInput = document.getElementById('filesSearchInput');
    if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
    }
    renderFileManager();
}

function renderSearchResults(results, query) {
    if (!Array.isArray(results) || results.length === 0) {
        return `
            <div class="p-10 text-center text-gray-500 text-sm">
                <i class="fas fa-search text-3xl text-gray-300 mb-3"></i>
                <p>No items matched your search.</p>
                <p class="mt-2 text-xs text-gray-400">Try a different keyword or clear the filter to browse the hierarchy.</p>
            </div>
        `;
    }

    return `
        <div class="divide-y divide-gray-100">
            ${results.map(result => renderSearchResultRow(result, query)).join('')}
        </div>
    `;
}

function renderSearchResultRow(result, query) {
    const { node, path } = result;
    const isFolder = node.type === 'folder';
    const icon = isFolder ? 'fa-folder' : 'fa-file-lines';
    const accent = isFolder ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-100 text-blue-600';
    const encodedName = encodeURIComponent(node.name);
    const highlightedName = highlightQuery(node.name, query);
    const itemPathKey = createPathKey(path);
    const dropAttribute = isFolder ? `data-drop-path="${itemPathKey}"` : '';
    const childCount = Array.isArray(node.children) ? node.children.length : 0;
    const detailLabel = isFolder ? `${childCount} item${childCount === 1 ? '' : 's'}` : 'Markdown file';
    const rootName = fileSystemState.name || DEFAULT_FILE_SYSTEM.name;
    const breadcrumbPath = '/' + [rootName, ...path].join('/');
    const safePath = escapeHtml(breadcrumbPath);

    return `
        <button type="button" class="w-full flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 px-4 py-3 hover:bg-blue-50 focus:outline-none focus:bg-blue-100 transition text-left"
                data-name="${encodedName}" data-type="${node.type}" data-item-path="${itemPathKey}" data-item-type="${node.type}" ${dropAttribute} draggable="true">
            <div class="flex items-start gap-3">
                <span class="w-9 h-9 rounded-md flex items-center justify-center ${accent}">
                    <i class="fas ${icon} text-sm"></i>
                </span>
                <div>
                    <p class="text-sm font-medium text-gray-800 leading-5">${highlightedName}</p>
                    <p class="text-xs text-gray-500 mt-1">${detailLabel}</p>
                    <p class="text-xs text-gray-400 mt-1 font-mono">${safePath}</p>
                </div>
            </div>
            <div class="flex items-center gap-2 text-gray-300">
                <i class="fas fa-arrow-turn-up -rotate-90 lg:rotate-0"></i>
                <span class="text-[11px] uppercase tracking-wide text-gray-400">Jump</span>
            </div>
        </button>
    `;
}

function searchFileSystem(node, query, pathSegments) {
    if (!node) {
        return [];
    }

    const results = [];
    const nodeName = (node.name || '').toLowerCase();
    if (pathSegments.length > 0 && nodeName.includes(query)) {
        results.push({ node, path: [...pathSegments] });
    }

    if (node.type === 'folder' && Array.isArray(node.children)) {
        for (const child of node.children) {
            const childPath = [...pathSegments, child.name];
            results.push(...searchFileSystem(child, query, childPath));
        }
    }

    return results;
}

function expandTreeForPath(pathSegments) {
    for (let depth = 0; depth <= pathSegments.length; depth += 1) {
        const partialPath = pathSegments.slice(0, depth);
        const key = createPathKey(partialPath);
        fileManagerExpandedNodes.add(key);
    }
}

function highlightQuery(text, query) {
    if (!query) {
        return escapeHtml(text);
    }

    const safeText = escapeHtml(text);
    try {
        const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
        return safeText.replace(regex, '<mark class="file-search-highlight">$1</mark>');
    } catch (error) {
        return safeText;
    }
}

function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildFolderTreeNode(node, pathSegments) {
    if (!node || node.type !== 'folder') {
        return '';
    }

    const isRoot = pathSegments.length === 0;
    const currentPathKey = createPathKey(pathSegments);
    const activePathKey = createPathKey(fileManagerCurrentPath);
    const isActive = activePathKey === currentPathKey;

    const folderChildren = Array.isArray(node.children)
        ? node.children.filter(child => child.type === 'folder')
        : [];
    sortChildren(folderChildren);
    const hasChildren = folderChildren.length > 0;
    const isExpanded = fileManagerExpandedNodes.has(currentPathKey);

    const safeName = escapeHtml(node.name);
    const chevronIcon = hasChildren ? (isExpanded ? 'fa-chevron-down' : 'fa-chevron-right') : '';
    const toggleButton = hasChildren
        ? `<button type="button" class="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600" data-tree-action="toggle" data-path="${currentPathKey}" aria-label="${isExpanded ? 'Collapse' : 'Expand'} ${safeName}"><i class="fas ${chevronIcon} text-xs"></i></button>`
        : `<span class="w-6 h-6"></span>`;
    const iconStyles = isRoot ? 'bg-blue-100 text-blue-600' : 'bg-yellow-100 text-yellow-600';
    const childHtml = hasChildren && isExpanded
        ? folderChildren.map(child => buildFolderTreeNode(child, [...pathSegments, child.name])).join('')
        : '';

    return `
        <div class="tree-row" data-tree-path="${currentPathKey}">
            <div class="flex items-center">
                ${toggleButton}
                <button type="button" class="flex-1 flex items-center space-x-2 px-2 py-1 rounded-md ${isActive ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-blue-50'}" data-tree-action="select" data-path="${currentPathKey}" data-node-type="folder" data-drop-path="${currentPathKey}">
                    <span class="w-6 h-6 rounded-md flex items-center justify-center ${iconStyles}">
                        <i class="fas fa-folder text-xs"></i>
                    </span>
                    <span class="truncate">${safeName}</span>
                </button>
            </div>
            ${hasChildren && isExpanded ? `<div class="ml-6 pl-3 border-l border-gray-200 space-y-1 mt-1">${childHtml}</div>` : ''}
        </div>
    `;
}

function initializeTreeExpansion() {
    fileManagerExpandedNodes = new Set();
    const rootKey = createPathKey([]);
    fileManagerExpandedNodes.add(rootKey);

    if (!fileSystemState || !Array.isArray(fileSystemState.children)) {
        return;
    }

    const firstLevelFolders = fileSystemState.children.filter(child => child.type === 'folder');
    firstLevelFolders.forEach(folder => {
        const firstLevelKey = createPathKey([folder.name]);
        fileManagerExpandedNodes.add(firstLevelKey);

        if (Array.isArray(folder.children)) {
            folder.children
                .filter(child => child.type === 'folder')
                .forEach(grandchild => {
                    const grandchildKey = createPathKey([folder.name, grandchild.name]);
                    fileManagerExpandedNodes.add(grandchildKey);
                });
        }
    });
}

function handleTreeClick(event) {
    const toggleButton = event.target.closest('[data-tree-action="toggle"]');
    if (toggleButton) {
        const pathKey = toggleButton.getAttribute('data-path') || '';
        if (fileManagerExpandedNodes.has(pathKey)) {
            fileManagerExpandedNodes.delete(pathKey);
        } else {
            fileManagerExpandedNodes.add(pathKey);
        }
        renderFileManager();
        return;
    }

    const selectButton = event.target.closest('[data-tree-action="select"]');
    if (!selectButton) {
        return;
    }

    const pathKey = selectButton.getAttribute('data-path') || '';
    const segments = parsePathKey(pathKey);
    fileManagerCurrentPath = segments;
    fileManagerExpandedNodes.add(pathKey);
    expandTreeForPath(segments);
    fileManagerSearchQuery = '';
    renderFileManager();
}

function handleListDragStart(event) {
    const dragSource = event.target.closest('[data-item-path]');
    if (!dragSource) {
        return;
    }

    const pathKey = dragSource.getAttribute('data-item-path');
    const itemType = dragSource.getAttribute('data-item-type');
    if (!pathKey || !itemType) {
        return;
    }

    fileManagerDragData = { pathKey, type: itemType };
    if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', pathKey);
    }
    dragSource.classList.add('opacity-60');
}

function handleListDragEnd(event) {
    const dragSource = event.target.closest('[data-item-path]');
    if (dragSource) {
        dragSource.classList.remove('opacity-60');
    }
    fileManagerDragData = null;
    clearDropIndicators();
}

function handleDropTargetDragEnter(event) {
    const dropTarget = event.target.closest('[data-drop-path]');
    if (!dropTarget || !fileManagerDragData) {
        return;
    }

    const pathKey = dropTarget.getAttribute('data-drop-path');
    if (!canDropOnTarget(fileManagerDragData, pathKey)) {
        return;
    }

    setDropIndicator(dropTarget, true);
}

function handleDropTargetDragOver(event) {
    const dropTarget = event.target.closest('[data-drop-path]');
    if (!dropTarget || !fileManagerDragData) {
        return;
    }

    const pathKey = dropTarget.getAttribute('data-drop-path');
    if (!canDropOnTarget(fileManagerDragData, pathKey)) {
        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = 'none';
        }
        return;
    }

    event.preventDefault();
    if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'move';
    }
    setDropIndicator(dropTarget, true);
}

function handleDropTargetDragLeave(event) {
    const dropTarget = event.target.closest('[data-drop-path]');
    if (!dropTarget || !fileManagerDragData) {
        return;
    }
    if (event.relatedTarget && dropTarget.contains(event.relatedTarget)) {
        return;
    }
    setDropIndicator(dropTarget, false);
}

function handleDropOnTarget(event) {
    const dropTarget = event.target.closest('[data-drop-path]');
    if (!dropTarget || !fileManagerDragData) {
        return;
    }

    const pathKey = dropTarget.getAttribute('data-drop-path');
    if (!canDropOnTarget(fileManagerDragData, pathKey)) {
        clearDropIndicators();
        return;
    }

    event.preventDefault();
    const success = moveItem(fileManagerDragData.pathKey, pathKey);
    if (success) {
        fileManagerDragData = null;
    }
    clearDropIndicators();
}

function setDropIndicator(element, active) {
    if (!element) {
        return;
    }

    if (active) {
        element.classList.add('ring-2', 'ring-blue-400', 'bg-blue-50');
        element.dataset.dropActive = 'true';
    } else {
        element.classList.remove('ring-2', 'ring-blue-400', 'bg-blue-50');
        delete element.dataset.dropActive;
    }
}

function clearDropIndicators() {
    const highlighted = document.querySelectorAll('[data-drop-active="true"]');
    highlighted.forEach(element => setDropIndicator(element, false));
}

function canDropOnTarget(dragData, targetPathKey) {
    if (!dragData || !targetPathKey && targetPathKey !== '') {
        return false;
    }

    const targetSegments = parsePathKey(targetPathKey);
    const targetFolder = getFolderNodeFromPath(targetSegments);
    if (!targetFolder) {
        return false;
    }

    const itemSegments = parsePathKey(dragData.pathKey);
    if (itemSegments.length === 0) {
        return false;
    }

    const parentSegments = itemSegments.slice(0, -1);
    if (pathsEqual(parentSegments, targetSegments)) {
        return false;
    }

    if (dragData.type === 'folder' && isDescendantPath(targetSegments, itemSegments)) {
        return false;
    }

    return true;
}

function moveItem(itemPathKey, targetPathKey) {
    const itemSegments = parsePathKey(itemPathKey);
    const targetSegments = parsePathKey(targetPathKey);

    const itemName = itemSegments[itemSegments.length - 1];
    const sourceSegments = itemSegments.slice(0, -1);
    const sourceFolder = getFolderNodeFromPath(sourceSegments);
    const targetFolder = getFolderNodeFromPath(targetSegments);

    if (!sourceFolder || !targetFolder || !itemName) {
        showToast('Unable to move the selected item.', 'error');
        return false;
    }

    const itemIndex = (sourceFolder.children || []).findIndex(child => child.name === itemName);
    if (itemIndex === -1) {
        showToast('Unable to move the selected item.', 'error');
        return false;
    }

    const itemNode = sourceFolder.children[itemIndex];

    if (itemNode.type === 'folder' && isDescendantPath(targetSegments, itemSegments)) {
        showToast('You cannot move a folder into itself.', 'warning');
        return false;
    }

    const duplicate = (targetFolder.children || []).some(child => child.name.toLowerCase() === itemName.toLowerCase());
    if (duplicate) {
        showToast('The destination already contains an item with this name.', 'warning');
        return false;
    }

    sourceFolder.children.splice(itemIndex, 1);
    if (!Array.isArray(targetFolder.children)) {
        targetFolder.children = [];
    }
    targetFolder.children.push(itemNode);
    sortChildren(targetFolder.children);
    sortChildren(sourceFolder.children);

    if (itemNode.type === 'folder') {
        const previousKey = itemPathKey;
        const newFolderKey = createPathKey([...targetSegments, itemName]);
        if (fileManagerExpandedNodes.has(previousKey)) {
            fileManagerExpandedNodes.delete(previousKey);
            fileManagerExpandedNodes.add(newFolderKey);
        }
    }

    fileManagerExpandedNodes.add(targetPathKey);
    saveFileSystemState(fileSystemState);
    renderFileManager();
    showToast(`Moved "${itemName}" successfully.`, 'success');
    return true;
}

function createPathKey(segments) {
    if (!Array.isArray(segments) || segments.length === 0) {
        return '';
    }
    return segments.map(segment => encodeURIComponent(segment)).join('/');
}

function parsePathKey(pathKey) {
    if (!pathKey) {
        return [];
    }
    return pathKey.split('/').map(part => decodeURIComponent(part));
}

function getFolderNodeFromPath(pathSegments) {
    if (!fileSystemState || !Array.isArray(pathSegments)) {
        return null;
    }

    let node = fileSystemState;
    for (const segment of pathSegments) {
        if (!Array.isArray(node.children)) {
            return null;
        }
        const nextNode = node.children.find(child => child.type === 'folder' && child.name === segment);
        if (!nextNode) {
            return null;
        }
        node = nextNode;
    }
    return node;
}

function pathsEqual(a, b) {
    if (a.length !== b.length) {
        return false;
    }
    return a.every((segment, index) => segment === b[index]);
}

function isDescendantPath(targetSegments, itemSegments) {
    if (targetSegments.length < itemSegments.length) {
        return false;
    }
    for (let index = 0; index < itemSegments.length; index += 1) {
        if (targetSegments[index] !== itemSegments[index]) {
            return false;
        }
    }
    return true;
}

function handleFileListClick(event) {
    const button = event.target.closest('button[data-name]');
    if (!button) {
        return;
    }

    const itemName = decodeURIComponent(button.dataset.name || '');
    const itemType = button.dataset.type;
    const itemPathKey = button.getAttribute('data-item-path') || '';
    const itemPathSegments = parsePathKey(itemPathKey);

    if (itemType === 'folder') {
        fileManagerCurrentPath = itemPathSegments;
        expandTreeForPath(itemPathSegments);
        fileManagerSearchQuery = '';
        renderFileManager();
    } else if (itemType === 'file') {
        const previousPath = [...fileManagerCurrentPath];
        if (itemPathSegments.length > 0) {
            const parentSegments = itemPathSegments.slice(0, -1);
            fileManagerCurrentPath = parentSegments;
        }
        openFilePreviewModal(itemName);
        fileManagerCurrentPath = previousPath;
    }
}

function handleBreadcrumbClick(event) {
    const button = event.target.closest('button[data-index]');
    if (!button) {
        return;
    }

    const index = parseInt(button.dataset.index, 10);
    if (Number.isNaN(index)) {
        return;
    }

    fileManagerCurrentPath = fileManagerCurrentPath.slice(0, index);
    fileManagerSearchQuery = '';
    renderFileManager();
}

function openCreateItemModal(type) {
    const currentFolder = getCurrentFolderNode();
    if (!currentFolder) {
        showToast('Unable to locate the current folder', 'error');
        return;
    }

    const rootName = fileSystemState.name || DEFAULT_FILE_SYSTEM.name;
    const pathLabel = '/' + [rootName, ...fileManagerCurrentPath].join('/');
    const safePath = escapeHtml(pathLabel);
    const isFolder = type === 'folder';
    const modalTitle = isFolder ? 'Create Folder' : 'Create File';
    const placeholder = isFolder ? 'New folder name' : 'New file name (e.g. Notes.md)';
    const helperText = isFolder
        ? 'Folders help you group related notes, documents, and assets.'
        : 'Files are stored as Markdown documents by default.';

    const modalContent = `
        <form id="fileManagerCreateForm" class="space-y-5">
            <div>
                <label for="fileManagerItemName" class="block text-sm font-medium text-gray-700">Name</label>
                <input type="text" id="fileManagerItemName" name="fileManagerItemName"
                       class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                       placeholder="${placeholder}" autocomplete="off">
                <p class="text-xs text-gray-500 mt-2">${helperText}</p>
                <p id="fileManagerNameError" class="text-xs text-red-500 mt-2 hidden"></p>
            </div>
            <div class="bg-gray-50 border border-gray-100 rounded-lg px-4 py-3 text-sm text-gray-600">
                <span class="font-medium text-gray-700">Destination:</span>
                <span class="ml-2 break-words">${safePath}</span>
            </div>
            <div class="flex justify-end space-x-3">
                <button type="button" class="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50" onclick="closeModal()">Cancel</button>
                <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">${modalTitle}</button>
            </div>
        </form>
    `;

    showModal(modalTitle, modalContent);

    const form = document.getElementById('fileManagerCreateForm');
    const nameInput = document.getElementById('fileManagerItemName');
    const errorLabel = document.getElementById('fileManagerNameError');

    if (nameInput) {
        nameInput.focus();
        nameInput.addEventListener('input', () => {
            if (errorLabel) {
                errorLabel.classList.add('hidden');
                errorLabel.textContent = '';
            }
        });
    }

    form.addEventListener('submit', event => {
        event.preventDefault();
        if (!nameInput) {
            return;
        }

        const rawName = nameInput.value.trim();
        if (!rawName) {
            showFieldError(errorLabel, 'Please enter a name.');
            return;
        }

        if (/[\\\/]/.test(rawName)) {
            showFieldError(errorLabel, 'Names cannot include \\ or /.');
            return;
        }

        if (rawName === '.' || rawName === '..') {
            showFieldError(errorLabel, 'Please choose a different name.');
            return;
        }

        const exists = (currentFolder.children || []).some(child => child.name.toLowerCase() === rawName.toLowerCase());
        if (exists) {
            showFieldError(errorLabel, 'An item with this name already exists.');
            return;
        }

        if (!Array.isArray(currentFolder.children)) {
            currentFolder.children = [];
        }

        const newItem = isFolder
            ? { name: rawName, type: 'folder', children: [] }
            : { name: rawName, type: 'file' };

        currentFolder.children.push(newItem);
        sortChildren(currentFolder.children);
        saveFileSystemState(fileSystemState);
        if (isFolder) {
            const newFolderKey = createPathKey([...fileManagerCurrentPath, rawName]);
            fileManagerExpandedNodes.add(newFolderKey);
        }
        closeModal();
        renderFileManager();
        showToast(`${isFolder ? 'Folder' : 'File'} "${rawName}" created successfully`, 'success');
    });
}

function openFilePreviewModal(fileName) {
    const rootName = fileSystemState.name || DEFAULT_FILE_SYSTEM.name;
    const pathSegments = [rootName, ...fileManagerCurrentPath, fileName];
    const relativePath = pathSegments.join('/');
    const encodedPath = encodeURI(relativePath);
    const safePath = escapeHtml(relativePath);
    const safeName = escapeHtml(fileName);

    const modalContent = `
        <div class="space-y-4 text-sm text-gray-600">
            <div class="bg-gray-50 border border-gray-100 rounded-lg px-4 py-3">
                <p class="text-xs uppercase text-gray-400 tracking-wide">File name</p>
                <p class="text-sm text-gray-700 break-words mt-1">${safeName}</p>
            </div>
            <div class="bg-gray-50 border border-gray-100 rounded-lg px-4 py-3">
                <p class="text-xs uppercase text-gray-400 tracking-wide">File path</p>
                <p class="text-sm text-gray-700 break-words mt-1">${safePath}</p>
            </div>
            <p>The file opens in a new browser tab so you can review or edit it with your preferred editor.</p>
            <div class="flex justify-end space-x-3">
                <button type="button" class="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50" onclick="closeModal()">Close</button>
                <a href="${encodedPath}" target="_blank" rel="noopener" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <i class="fas fa-arrow-up-right-from-square mr-2"></i>Open File
                </a>
            </div>
        </div>
    `;

    showModal(`Preview: ${fileName}`, modalContent);
}

function getCurrentFolderNode() {
    if (!fileSystemState) {
        return null;
    }

    let node = fileSystemState;
    for (const segment of fileManagerCurrentPath) {
        if (!Array.isArray(node.children)) {
            return null;
        }

        const nextNode = node.children.find(child => child.type === 'folder' && child.name === segment);
        if (!nextNode) {
            return null;
        }
        node = nextNode;
    }
    return node;
}

function loadFileSystemState() {
    try {
        const stored = getStoredPreference(FILE_SYSTEM_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed && parsed.version === FILE_SYSTEM_STORAGE_VERSION && parsed.tree) {
                return parsed.tree;
            }
        }
    } catch (error) {
        console.warn('Unable to load saved file system state', error);
    }
    return cloneDefaultFileSystem();
}

function saveFileSystemState(tree) {
    try {
        const payload = {
            version: FILE_SYSTEM_STORAGE_VERSION,
            tree
        };
        setStoredPreference(FILE_SYSTEM_STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
        console.warn('Unable to save file system state', error);
    }
}

function cloneDefaultFileSystem() {
    return JSON.parse(JSON.stringify(DEFAULT_FILE_SYSTEM));
}

function sortChildren(children) {
    children.sort((a, b) => {
        if (a.type !== b.type) {
            return a.type === 'folder' ? -1 : 1;
        }
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });
}

function escapeHtml(value) {
    return (value || '').replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function showFieldError(element, message) {
    if (!element) {
        return;
    }
    element.textContent = message;
    element.classList.remove('hidden');
}

