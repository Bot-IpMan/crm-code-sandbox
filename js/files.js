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

function showFiles() {
    showView('files');
    setPageHeader('files');
    initializeFileManager();
}

function initializeFileManager() {
    if (!fileSystemState) {
        fileSystemState = loadFileSystemState();
    }

    if (!fileManagerInitialized) {
        buildFileManagerLayout();
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
            <div class="flex items-center justify-between">
                <div>
                    <h3 class="text-lg font-semibold text-gray-800">Vault Explorer</h3>
                    <p class="text-sm text-gray-500" id="filesCurrentFolder"></p>
                    <p class="text-xs text-gray-400 mt-1" id="filesFolderSummary"></p>
                </div>
                <div class="flex items-center space-x-3">
                    <button id="filesCreateFolderBtn" class="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
                        <i class="fas fa-folder-plus mr-2"></i>New Folder
                    </button>
                    <button id="filesCreateFileBtn" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        <i class="fas fa-file-circle-plus mr-2"></i>New File
                    </button>
                </div>
            </div>
            <div id="filesBreadcrumbs" class="mt-4 flex items-center flex-wrap gap-2 text-sm text-gray-600"></div>
            <div id="filesList" class="mt-4 border border-gray-100 rounded-lg divide-y divide-gray-100 overflow-hidden"></div>
        </div>
    `;

    filesView.querySelector('#filesCreateFolderBtn').addEventListener('click', () => openCreateItemModal('folder'));
    filesView.querySelector('#filesCreateFileBtn').addEventListener('click', () => openCreateItemModal('file'));
    filesView.querySelector('#filesList').addEventListener('click', handleFileListClick);
    filesView.querySelector('#filesBreadcrumbs').addEventListener('click', handleBreadcrumbClick);
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

    renderBreadcrumbs(rootName);
    renderFileList(currentNode);
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

    listContainer.innerHTML = children.map(child => {
        const encodedName = encodeURIComponent(child.name);
        const safeName = escapeHtml(child.name);
        const isFolder = child.type === 'folder';
        const icon = isFolder ? 'fa-folder' : 'fa-file-lines';
        const iconStyles = isFolder ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-100 text-blue-600';
        const description = isFolder ? `${child.children.length} item${child.children.length === 1 ? '' : 's'}` : 'Markdown file';
        const actionLabel = isFolder ? 'Open' : 'Preview';

        return `
            <button type="button" class="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-blue-50 focus:outline-none focus:bg-blue-100 transition"
                    data-name="${encodedName}" data-type="${child.type}">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 rounded-lg flex items-center justify-center ${iconStyles}">
                        <i class="fas ${icon}"></i>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-gray-800">${safeName}</p>
                        <p class="text-xs text-gray-500">${description}</p>
                    </div>
                </div>
                <div class="flex items-center space-x-2 text-gray-400">
                    <span class="text-xs font-medium uppercase tracking-wide">${actionLabel}</span>
                    <i class="fas fa-chevron-right"></i>
                </div>
            </button>
        `;
    }).join('');
}

function handleFileListClick(event) {
    const button = event.target.closest('button[data-name]');
    if (!button) {
        return;
    }

    const itemName = decodeURIComponent(button.dataset.name || '');
    const itemType = button.dataset.type;

    if (itemType === 'folder') {
        fileManagerCurrentPath.push(itemName);
        renderFileManager();
    } else if (itemType === 'file') {
        openFilePreviewModal(itemName);
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

