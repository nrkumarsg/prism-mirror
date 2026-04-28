/**
 * OmniWSP Clone - Core Logic
 */

class MultiWhatsappApp {
    constructor() {
        this.accounts = this.loadAccounts();
        this.activeAccountId = null;
        this.isEditing = false;
        this.editingId = null;
        this.currentLayout = 1;
        this.slots = { 0: null, 1: null, 2: null, 3: null };
        this.maximizedSlot = null;
        this.currentCaptcha = '';
        this.accountToDelete = null;
        this.settings = this.loadSettings();
        this.webviewPool = {}; // Persistent pool for webview containers

        // DOM Elements
        this.elements = {
            sidebarSwitcher: document.getElementById('sidebarSwitcher'),
            accountList: document.getElementById('accountList'),
            accountCount: document.getElementById('accountCount'),
            addAccountBtn: document.getElementById('addAccountBtn'),
            viewportContent: document.getElementById('viewportContent'),
            activeAccountName: document.getElementById('activeAccountName'),
            editProfileBtn: document.getElementById('editProfileBtn'),
            modalOverlay: document.getElementById('modalOverlay'),
            modalTitle: document.getElementById('modalTitle'),
            accNameInput: document.getElementById('accName'),
            accIconInput: document.getElementById('accIcon'),
            accColorInput: document.getElementById('accColor'),
            saveAccountBtn: document.getElementById('saveAccountBtn'),
            deleteAccountBtn: document.getElementById('deleteAccountBtn'),
            cancelModalBtn: document.getElementById('cancelModal'),
            accountSearch: document.getElementById('accountSearch'),
            togglePanelBtn: document.getElementById('togglePanelBtn'),
            appContainer: document.querySelector('.app-container'),
            aboutModal: document.getElementById('aboutModal'),
            closeAboutBtn: document.getElementById('closeAboutBtn'),
            landingPage: document.getElementById('landingPage'),
            landingGetStartedBtn: document.getElementById('landingGetStartedBtn'),
            settingsModal: document.getElementById('settingsModal'),
            closeSettingsBtn: document.getElementById('closeSettingsBtn'),
            layoutSwitcher: document.getElementById('layoutSwitcher'),
            settingEnableMirror: document.getElementById('settingEnableMirror'),
            settingMaxSlots: document.getElementById('settingMaxSlots'),
            settingWindowGap: document.getElementById('settingWindowGap'),
            settingShowBranding: document.getElementById('settingShowBranding'),
            settingEnableSound: document.getElementById('settingEnableSound'),
            settingsAccountList: document.getElementById('settingsAccountList'),
            resizerSidebar: document.getElementById('resizerSidebar'),
            resizerAccount: document.getElementById('resizerAccount'),
            accountPanel: document.querySelector('.account-panel'),
            helpBtn: document.getElementById('helpBtn'),
            settingsBtn: document.getElementById('globalSettingsBtn'),
            toggleFocusBtn: document.getElementById('toggleFocusBtn'),
            exitFocusBtn: document.getElementById('exitFocusBtn'),
            viewportHeader: document.getElementById('viewportHeader'),
            deleteConfirmModal: document.getElementById('deleteConfirmModal'),
            captchaDisplay: document.getElementById('captchaDisplay'),
            captchaInput: document.getElementById('captchaInput'),
            finalDeleteBtn: document.getElementById('finalDeleteBtn'),
            cancelDeleteBtn: document.getElementById('cancelDeleteBtn'),
            settingRamSaver: document.getElementById('settingRamSaver'),
        };

        this.searchTerm = '';
        this.isPanelCollapsed = localStorage.getItem('panel_collapsed') === 'true';
        this.init();
        this.initResizers();
    }

    init() {
        if (this.isPanelCollapsed) {
            this.elements.appContainer.classList.add('collapsed');
        }
        this.render();
        this.applySettings();
        this.bindEvents();
        this.initDragAndDrop();
        // Pre-load active account if exists
        if (this.accounts.length > 0) {
            this.selectAccount(this.accounts[0].id);
        } else {
            this.renderLayout();
        }
    }

    showAbout() {
        this.elements.aboutModal.classList.add('active');
    }

    hideAbout() {
        this.elements.aboutModal.classList.remove('active');
    }

    togglePanel() {
        if (this.elements.accountPanel.classList.contains('collapsed')) {
            this.elements.accountPanel.classList.remove('collapsed');
            this.elements.accountPanel.classList.remove('mini');
            this.isPanelCollapsed = false;
        } else if (!this.elements.accountPanel.classList.contains('mini')) {
            this.elements.accountPanel.classList.add('mini');
            this.isPanelCollapsed = false;
        } else {
            this.elements.accountPanel.classList.add('collapsed');
            this.isPanelCollapsed = true;
        }
        localStorage.setItem('panel_collapsed', this.isPanelCollapsed);
    }

    initResizers() {
        const { resizerSidebar, resizerAccount, sidebarSwitcher, accountPanel } = this.elements;
        
        let isResizing = false;
        let currentResizer = null;

        const startResizing = (e, resizer) => {
            isResizing = true;
            currentResizer = resizer;
            resizer.classList.add('dragging');
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        };

        const stopResizing = () => {
            if (!isResizing) return;
            isResizing = false;
            currentResizer.classList.remove('dragging');
            document.body.style.cursor = 'default';
            document.body.style.userSelect = 'auto';
            
            // Save state
            localStorage.setItem('sidebar_width', sidebarSwitcher.style.width);
            localStorage.setItem('account_panel_width', accountPanel.style.width);
        };

        const resize = (e) => {
            if (!isResizing) return;

            if (currentResizer === resizerSidebar) {
                let newWidth = e.clientX;
                if (newWidth < 20) {
                    sidebarSwitcher.classList.add('collapsed');
                    sidebarSwitcher.style.width = '0px';
                } else {
                    sidebarSwitcher.classList.remove('collapsed');
                    sidebarSwitcher.style.width = `${Math.max(50, Math.min(newWidth, 200))}px`;
                }
            } else if (currentResizer === resizerAccount) {
                const sidebarWidth = sidebarSwitcher.offsetWidth;
                let newWidth = e.clientX - sidebarWidth;
                
                if (newWidth < 30) {
                    accountPanel.classList.add('collapsed');
                    accountPanel.classList.remove('mini');
                    accountPanel.style.width = '0px';
                } else if (newWidth < 100) {
                    accountPanel.classList.remove('collapsed');
                    accountPanel.classList.add('mini');
                    accountPanel.style.width = '70px';
                } else {
                    accountPanel.classList.remove('collapsed');
                    accountPanel.classList.remove('mini');
                    accountPanel.style.width = `${Math.max(100, Math.min(newWidth, 500))}px`;
                }
            }
        };

        resizerSidebar.addEventListener('mousedown', (e) => startResizing(e, resizerSidebar));
        resizerAccount.addEventListener('mousedown', (e) => startResizing(e, resizerAccount));
        window.addEventListener('mousemove', resize);
        window.addEventListener('mouseup', stopResizing);

        // Load saved widths
        const savedSidebarWidth = localStorage.getItem('sidebar_width');
        const savedAccountWidth = localStorage.getItem('account_panel_width');
        
        if (savedSidebarWidth) {
            sidebarSwitcher.style.width = savedSidebarWidth;
            if (parseInt(savedSidebarWidth) === 0) sidebarSwitcher.classList.add('collapsed');
        }
        
        if (savedAccountWidth) {
            accountPanel.style.width = savedAccountWidth;
            const w = parseInt(savedAccountWidth);
            if (w === 0) accountPanel.classList.add('collapsed');
            else if (w <= 80) accountPanel.classList.add('mini');
        }
    }

    loadAccounts() {
        const data = localStorage.getItem('omni_accounts');
        return data ? JSON.parse(data) : [];
    }

    saveAccounts() {
        localStorage.setItem('omni_accounts', JSON.stringify(this.accounts));
        this.render();
    }

    loadSettings() {
        const defaults = {
            enableMirror: true,
            maxSlots: 4,
            windowGap: 8,
            showBranding: true,
            enableSound: true,
            ramSaver: false
        };
        const saved = localStorage.getItem('omni_settings');
        return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    }

    saveSettings() {
        localStorage.setItem('omni_settings', JSON.stringify(this.settings));
        this.applySettings();
    }

    applySettings() {
        // Apply window gap
        document.documentElement.style.setProperty('--window-gap', `${this.settings.windowGap}px`);
        
        // Show/Hide branding
        const badges = document.querySelectorAll('.brand-badge');
        badges.forEach(b => b.style.display = this.settings.showBranding ? 'inline-block' : 'none');
        
        // Show/Hide layout switcher
        this.elements.layoutSwitcher.style.display = this.settings.enableMirror ? 'flex' : 'none';
        
        // Update switcher buttons based on max slots
        const btns = this.elements.layoutSwitcher.querySelectorAll('.layout-btn');
        btns.forEach(btn => {
            const l = parseInt(btn.dataset.layout);
            btn.style.display = l <= this.settings.maxSlots ? 'flex' : 'none';
        });

        // Sync inputs
        if (this.elements.settingEnableMirror) {
            this.elements.settingEnableMirror.checked = this.settings.enableMirror;
            this.elements.settingMaxSlots.value = this.settings.maxSlots;
            this.elements.settingWindowGap.value = this.settings.windowGap;
            this.elements.settingShowBranding.checked = this.settings.showBranding;
            this.elements.settingEnableSound.checked = this.settings.enableSound;
            this.elements.settingRamSaver.checked = this.settings.ramSaver;
        }

        // Apply audio settings to all webviews
        const webviews = document.querySelectorAll('webview');
        webviews.forEach(wv => {
            const accId = wv.closest('.webview-container').dataset.accId;
            const account = this.accounts.find(a => a.id === accId);
            
            // Global mute OR per-account mute
            const isMuted = !this.settings.enableSound || (account && account.isMuted);
            wv.setAudioMuted(isMuted);
        });
        
        this.renderSettingsAccountList();
    }

    renderSettingsAccountList() {
        if (!this.elements.settingsAccountList) return;
        
        this.elements.settingsAccountList.innerHTML = '';
        this.accounts.forEach(acc => {
            const item = document.createElement('div');
            item.className = 'setting-item';
            item.style.marginBottom = '12px';
            item.style.paddingBottom = '8px';
            item.style.borderBottom = '1px solid rgba(255,255,255,0.02)';
            
            item.innerHTML = `
                <div class="setting-info">
                    <span class="setting-label" style="font-size: 0.85rem;">${acc.icon} ${acc.name}</span>
                </div>
                <div style="display: flex; gap: 16px; align-items: center;">
                    <i class="fas ${acc.isMuted ? 'fa-volume-mute' : 'fa-volume-up'}" 
                       style="cursor: pointer; color: ${acc.isMuted ? 'var(--text-secondary)' : 'var(--accent-primary)'}"
                       onclick="window.app.toggleAccountMute('${acc.id}')"
                       title="Toggle Mute"></i>
                    <i class="fas ${acc.notificationsDisabled ? 'fa-bell-slash' : 'fa-bell'}" 
                       style="cursor: pointer; color: ${acc.notificationsDisabled ? 'var(--text-secondary)' : 'var(--accent-primary)'}"
                       onclick="window.app.toggleAccountNotifications('${acc.id}')"
                       title="Toggle Notifications"></i>
                </div>
            `;
            this.elements.settingsAccountList.appendChild(item);
        });
    }

    toggleAccountMute(id) {
        const acc = this.accounts.find(a => a.id === id);
        if (acc) {
            acc.isMuted = !acc.isMuted;
            this.saveAccounts();
            this.applySettings();
        }
    }

    toggleAccountNotifications(id) {
        const acc = this.accounts.find(a => a.id === id);
        if (acc) {
            acc.notificationsDisabled = !acc.notificationsDisabled;
            this.saveAccounts();
            this.applySettings();
            
            // Reload webview to apply notification permission change if necessary, 
            // or we can inject a script to block window.Notification
        }
    }

    bindEvents() {
        this.elements.addAccountBtn.onclick = () => this.showModal();
        this.elements.cancelModalBtn.onclick = () => this.hideModal();
        this.elements.saveAccountBtn.onclick = () => this.handleSaveAccount();
        this.elements.deleteAccountBtn.onclick = () => this.handleDeleteAccount();
        this.elements.editProfileBtn.onclick = () => this.handleEditProfile();
        
        this.elements.togglePanelBtn.onclick = () => this.togglePanel();
        
        this.elements.settingsBtn.addEventListener('click', () => this.showSettings());
        this.elements.helpBtn.addEventListener('click', () => this.showAbout());
        this.elements.closeAboutBtn.addEventListener('click', () => this.hideAbout());
        this.elements.closeSettingsBtn.addEventListener('click', () => this.handleSaveSettings());
        this.elements.toggleFocusBtn.onclick = () => this.toggleFocusMode(true);
        this.elements.exitFocusBtn.onclick = () => this.toggleFocusMode(false);
        
        this.elements.cancelDeleteBtn.onclick = () => this.hideDeleteModal();
        this.elements.finalDeleteBtn.onclick = () => this.executeDelete();
        this.elements.captchaInput.oninput = (e) => this.validateCaptcha(e.target.value);
        
        if (this.elements.landingGetStartedBtn) {
            this.elements.landingGetStartedBtn.onclick = () => this.showModal();
        }

        // Layout Switcher Events
        const layoutBtns = this.elements.layoutSwitcher.querySelectorAll('.layout-btn');
        layoutBtns.forEach(btn => {
            btn.onclick = () => this.setLayout(parseInt(btn.dataset.layout));
        });

        this.elements.accountSearch.oninput = (e) => {
            this.searchTerm = e.target.value.toLowerCase();
            this.render();
        };

        // Close modals on overlay click
        [this.elements.modalOverlay, this.elements.aboutModal, this.elements.settingsModal, this.elements.deleteConfirmModal].forEach(modal => {
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        modal.classList.remove('active');
                        if (modal === this.elements.deleteConfirmModal) this.accountToDelete = null;
                    }
                });
            }
        });
    }

    showModal(editData = null) {
        if (editData) {
            this.isEditing = true;
            this.editingId = editData.id;
            this.elements.modalTitle.innerText = "Edit Profile";
            this.elements.accNameInput.value = editData.name;
            this.elements.accIconInput.value = editData.icon;
            this.elements.accColorInput.value = editData.color;
            this.elements.deleteAccountBtn.style.display = 'block';
        } else {
            this.isEditing = false;
            this.editingId = null;
            this.elements.modalTitle.innerText = "Add New Account";
            this.elements.accNameInput.value = "";
            this.elements.accIconInput.value = "";
            this.elements.accColorInput.value = "#10b981";
            this.elements.deleteAccountBtn.style.display = 'none';
        }
        this.elements.modalOverlay.classList.add('active');
    }

    hideModal() {
        this.elements.modalOverlay.classList.remove('active');
    }

    handleSaveAccount() {
        const name = this.elements.accNameInput.value.trim();
        const icon = this.elements.accIconInput.value.trim() || name.charAt(0);
        const color = this.elements.accColorInput.value;

        if (!name) return alert("Please enter an account name");

        let savedAccount = null;
        if (this.isEditing) {
            const index = this.accounts.findIndex(a => a.id === this.editingId);
            if (index !== -1) {
                this.accounts[index] = { ...this.accounts[index], name, icon, color };
                savedAccount = this.accounts[index];
            }
        } else {
            savedAccount = {
                id: Date.now().toString(),
                name,
                icon,
                color,
                status: 'Active',
                session: `session_${Date.now()}`,
                isMuted: false,
                notificationsDisabled: false
            };
            this.accounts.push(savedAccount);
        }

        this.saveAccounts();
        this.hideModal();
        
        if (savedAccount && !this.isEditing) {
            this.selectAccount(savedAccount.id);
        }
    }

    handleDeleteAccount() {
        if (!this.editingId) return;
        this.showDeleteModal(this.editingId);
    }

    showDeleteModal(id) {
        this.accountToDelete = id;
        this.currentCaptcha = Math.random().toString(36).substring(2, 8).toUpperCase();
        this.elements.captchaDisplay.innerText = this.currentCaptcha;
        this.elements.captchaInput.value = '';
        this.elements.finalDeleteBtn.style.opacity = '0.5';
        this.elements.finalDeleteBtn.style.pointerEvents = 'none';
        this.elements.deleteConfirmModal.classList.add('active');
        
        // Hide edit modal if open
        this.hideModal();
    }

    hideDeleteModal() {
        this.elements.deleteConfirmModal.classList.remove('active');
        this.accountToDelete = null;
    }

    validateCaptcha(value) {
        if (value.toUpperCase() === this.currentCaptcha) {
            this.elements.finalDeleteBtn.style.opacity = '1';
            this.elements.finalDeleteBtn.style.pointerEvents = 'all';
        } else {
            this.elements.finalDeleteBtn.style.opacity = '0.5';
            this.elements.finalDeleteBtn.style.pointerEvents = 'none';
        }
    }

    executeDelete() {
        if (this.accountToDelete) {
            this.deleteAccount(this.accountToDelete);
            this.hideDeleteModal();
        }
    }

    deleteAccount(id) {
        this.accounts = this.accounts.filter(a => a.id !== id);
        
        // Clear slots
        for (let i in this.slots) {
            if (this.slots[i] === id) this.slots[i] = null;
        }
        
        if (this.activeAccountId === id) {
            this.activeAccountId = this.accounts.length > 0 ? this.accounts[0].id : null;
        }
        
        this.saveAccounts();
        
        // Clean up webview pool if account deleted
        if (this.webviewPool[id]) {
            this.webviewPool[id].remove();
            delete this.webviewPool[id];
        }

        this.renderLayout();
    }

    showSettings() {
        this.elements.settingsModal.classList.add('active');
    }

    handleSaveSettings() {
        this.settings = {
            enableMirror: this.elements.settingEnableMirror.checked,
            maxSlots: parseInt(this.elements.settingMaxSlots.value),
            windowGap: parseInt(this.elements.settingWindowGap.value),
            showBranding: this.elements.settingShowBranding.checked,
            enableSound: this.elements.settingEnableSound.checked,
            ramSaver: this.elements.settingRamSaver.checked
        };
        this.saveSettings();
        this.renderLayout(); // Refresh layout in case max slots changed
        this.elements.settingsModal.classList.remove('active');
    }

    setLayout(layout) {
        if (layout > 2) return;
        this.currentLayout = layout;
        this.maximizedSlot = null; // Reset maximization on layout change
        
        // Update buttons
        const btns = this.elements.layoutSwitcher.querySelectorAll('.layout-btn');
        btns.forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.layout) === layout);
        });

        // Update grid class
        this.elements.viewportContent.className = `viewport-content grid-${layout}`;
        
        // If we switched to 1-window mode, ensure the active account is in slot 0
        if (layout === 1 && this.activeAccountId) {
            this.slots[0] = this.activeAccountId;
        }

        this.renderLayout();
    }

    initDragAndDrop() {
        this.elements.accountList.addEventListener('dragstart', (e) => {
            const item = e.target.closest('.account-item');
            if (item) {
                e.dataTransfer.setData('text/plain', item.dataset.id);
                item.style.opacity = '0.5';
                this.elements.viewportContent.classList.add('dragging-active');
            }
        });

        this.elements.accountList.addEventListener('dragend', (e) => {
            const item = e.target.closest('.account-item');
            if (item) item.style.opacity = '1';
            this.elements.viewportContent.classList.remove('dragging-active');
        });

        this.elements.viewportContent.addEventListener('dragover', (e) => {
            e.preventDefault();
            const slot = e.target.closest('.webview-container');
            if (slot) slot.classList.add('drag-over');
        });

        this.elements.viewportContent.addEventListener('dragleave', (e) => {
            const slot = e.target.closest('.webview-container');
            if (slot) slot.classList.remove('drag-over');
        });

        this.elements.viewportContent.addEventListener('drop', (e) => {
            e.preventDefault();
            const accId = e.dataTransfer.getData('text/plain');
            const slotElement = e.target.closest('.webview-container');
            
            if (slotElement && accId) {
                slotElement.classList.remove('drag-over');
                const slotIndex = parseInt(slotElement.dataset.index);
                this.assignAccountToSlot(accId, slotIndex);
            }
        });
    }

    toggleSlotMaximize(index) {
        if (this.maximizedSlot === index) {
            this.maximizedSlot = null;
        } else {
            this.maximizedSlot = index;
        }
        this.renderLayout();
    }

    assignAccountToSlot(accId, slotIndex) {
        // Remove account from other slots if present
        for (let i in this.slots) {
            if (this.slots[i] === accId) this.slots[i] = null;
        }
        
        this.slots[slotIndex] = accId;
        this.activeAccountId = accId; // Mark as active for sidebar highlighting
        this.render();
        this.renderLayout();
        this.applySettings(); // Re-apply audio states
    }

    renderLayout() {
        const numSlots = this.currentLayout;
        const activeSlotIds = new Set();
        
        // Determine which accounts are active in slots
        for (let i = 0; i < numSlots; i++) {
            if (this.slots[i]) activeSlotIds.add(this.slots[i]);
        }

        // Ensure all active slot accounts have a webview in the pool
        activeSlotIds.forEach(accId => this.ensureWebviewInPool(accId));

        // Clear placeholders but keep webviews
        const placeholders = this.elements.viewportContent.querySelectorAll('.slot-placeholder');
        placeholders.forEach(p => p.remove());

        // Update all webview containers in pool
        Object.keys(this.webviewPool).forEach(accId => {
            const container = this.webviewPool[accId];
            let slotIndex = -1;
            
            // Find which slot this account is in
            for (let i = 0; i < numSlots; i++) {
                if (this.slots[i] === accId) {
                    slotIndex = i;
                    break;
                }
            }

            if (slotIndex !== -1 && (this.maximizedSlot === null || this.maximizedSlot === slotIndex)) {
                // Account is visible in a slot
                container.style.display = 'block';
                container.classList.toggle('maximized', this.maximizedSlot === slotIndex);
                container.dataset.index = slotIndex;
                
                // Set grid position based on layout and slot index
                this.applyGridPosition(container, slotIndex);
                
                if (container.parentElement !== this.elements.viewportContent) {
                    this.elements.viewportContent.appendChild(container);
                }
            } else {
                // Account is not in an active slot or is hidden by maximization
                if (this.settings.ramSaver) {
                    // RAM Saver: Destroy webviews that are not visible
                    container.remove();
                    delete this.webviewPool[accId];
                } else {
                    // Standard: Just hide them
                    container.style.display = 'none';
                    container.classList.remove('maximized');
                }
            }
        });

        // Add placeholders for empty slots
        for (let i = 0; i < numSlots; i++) {
            if (!this.slots[i] && (this.maximizedSlot === null || this.maximizedSlot === i)) {
                const placeholder = this.createSlotPlaceholder(i);
                this.applyGridPosition(placeholder, i);
                this.elements.viewportContent.appendChild(placeholder);
            }
        }
        
        if (numSlots > 0 && this.elements.landingPage) {
            const hasAnyAccount = Object.values(this.slots).some(s => s !== null);
            this.elements.landingPage.style.display = hasAnyAccount ? 'none' : 'flex';
        }
    }

    applyGridPosition(element, index) {
        if (this.maximizedSlot !== null) {
            element.style.gridColumn = '1';
            element.style.gridRow = '1';
            return;
        }

        if (this.currentLayout === 1) {
            element.style.gridColumn = '1';
            element.style.gridRow = '1';
        } else if (this.currentLayout === 2) {
            element.style.gridColumn = (index + 1).toString();
            element.style.gridRow = '1';
        } else if (this.currentLayout === 4) {
            element.style.gridColumn = (index % 2 + 1).toString();
            element.style.gridRow = (Math.floor(index / 2) + 1).toString();
        }
    }

    createSlotPlaceholder(index) {
        const placeholder = document.createElement('div');
        placeholder.className = 'webview-container slot-placeholder';
        placeholder.dataset.index = index;
        placeholder.style.height = '100%';
        placeholder.style.position = 'relative';
        placeholder.style.border = '1px solid var(--glass-border)';
        placeholder.style.borderRadius = '8px';
        placeholder.style.overflow = 'hidden';
        placeholder.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: var(--text-secondary); background: var(--bg-secondary);">
                <i class="fas fa-plus-circle" style="font-size: 2rem; margin-bottom: 12px; opacity: 0.3;"></i>
                <span style="font-size: 0.8rem;">Drag account here</span>
            </div>
        `;
        return placeholder;
    }

    ensureWebviewInPool(accId) {
        if (this.webviewPool[accId]) return this.webviewPool[accId];

        const account = this.accounts.find(a => a.id === accId);
        if (!account) return null;

        const container = document.createElement('div');
        container.className = 'webview-container';
        container.dataset.accId = accId;
        container.style.height = '100%';
        container.style.position = 'relative';
        container.style.border = '1px solid var(--glass-border)';
        container.style.borderRadius = '8px';
        container.style.overflow = 'hidden';

        container.innerHTML = `
            <div class="loading-overlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #f0f2f5; z-index: 1;">
                <div class="spinner" style="width: 40px; height: 40px; border: 3px solid #f3f3f3; border-top: 3px solid var(--whatsapp-green); border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <div style="margin-top: 15px; color: #667781; font-size: 0.9rem;">Connecting to WhatsApp...</div>
            </div>
            <div class="webview-toolbar" style="position: absolute; top: 8px; right: 8px; z-index: 10; display: flex; gap: 8px;">
                <button class="slot-tool-btn" onclick="window.app.toggleSlotMaximizeFromElement(this)" title="Toggle Maximize">
                    <i class="fas fa-expand-arrows-alt"></i>
                </button>
            </div>
            <webview 
                src="https://web.whatsapp.com" 
                partition="persist:${account.session}" 
                style="width: 100%; height: 100%; border: none;"
                useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
            ></webview>
        `;

        const wv = container.querySelector('webview');
        wv.addEventListener('did-finish-load', () => {
            container.querySelector('.loading-overlay').style.display = 'none';
            
            // Set initial audio state
            const acc = this.accounts.find(a => a.id === accId);
            const isMuted = !this.settings.enableSound || (acc && acc.isMuted);
            wv.setAudioMuted(isMuted);

            wv.insertCSS(`
                ._akau { display: none !important; } 
                .landing-header { display: none !important; }
                .landing-window { background: white !important; box-shadow: none !important; width: 100% !important; max-width: none !important; }
                .landing-main { padding: 0 !important; width: 100% !important; }
                ._akav { margin: 0 !important; width: 100% !important; display: flex !important; justify-content: center !important; }
            `);

            // Inject notification blocker if needed
            if (acc && acc.notificationsDisabled) {
                wv.executeJavaScript(`
                    window.Notification = function() { 
                        return { close: function() {}, onclick: null, onclose: null, onerror: null, onshow: null }; 
                    };
                    window.Notification.permission = 'denied';
                `);
            }
        });

        this.webviewPool[accId] = container;
        return container;
    }

    toggleSlotMaximizeFromElement(btn) {
        const container = btn.closest('.webview-container');
        const index = parseInt(container.dataset.index);
        this.toggleSlotMaximize(index);
    }

    handleEditProfile() {
        const account = this.accounts.find(a => a.id === this.activeAccountId);
        if (account) this.showModal(account);
    }

    selectAccount(id) {
        this.activeAccountId = id;
        
        const account = this.accounts.find(a => a.id === id);
        if (account) {
            this.elements.activeAccountName.innerText = account.name;
            this.elements.editProfileBtn.style.display = 'flex';
        } else {
            this.elements.activeAccountName.innerText = "Choose an account to start";
            this.elements.editProfileBtn.style.display = 'none';
        }

        if (this.currentLayout === 1) {
            this.slots[0] = id;
            this.renderLayout();
        }
        
        this.render();
    }

    render() {
        // Update count
        this.elements.accountCount.innerText = `${this.accounts.length} accounts active`;

        // Filter accounts
        const filteredAccounts = this.accounts.filter(acc => 
            acc.name.toLowerCase().includes(this.searchTerm)
        );

        // Render List
        this.elements.accountList.innerHTML = '';
        filteredAccounts.forEach(acc => {
            const item = document.createElement('div');
            item.className = `account-item ${acc.id === this.activeAccountId ? 'active' : ''}`;
            item.draggable = true;
            item.dataset.id = acc.id;
            item.onclick = () => this.selectAccount(acc.id);
            
            item.innerHTML = `
                <div class="account-avatar ${acc.id === this.activeAccountId ? 'pulse-active' : ''}" style="color: ${acc.color}; border: 2px solid ${acc.color}33">
                    ${acc.icon}
                </div>
                <div class="account-info">
                    <span class="account-name">${acc.name}</span>
                    <span class="account-status">${acc.status}</span>
                </div>
                <div class="account-actions" style="display: flex; gap: 8px; align-items: center;">
                    <i class="fas fa-trash-alt delete-icon" title="Remove Account" 
                       onclick="event.stopPropagation(); window.app.showDeleteModal('${acc.id}')"></i>
                    ${acc.id === this.activeAccountId ? '<i class="fas fa-chevron-right" style="font-size: 0.8rem; color: var(--accent-primary)"></i>' : ''}
                </div>
            `;
            this.elements.accountList.appendChild(item);
        });

        // Render Sidebar Switcher
        const existingItems = this.elements.sidebarSwitcher.querySelectorAll('.switcher-item:not(#globalSettingsBtn):not(#togglePanelBtn):not(#helpBtn)');
        existingItems.forEach(i => i.remove());

        this.accounts.forEach(acc => {
            const item = document.createElement('div');
            item.className = `switcher-item ${acc.id === this.activeAccountId ? 'active' : ''}`;
            item.title = acc.name;
            item.style.borderColor = acc.id === this.activeAccountId ? acc.color : 'transparent';
            item.onclick = () => this.selectAccount(acc.id);
            item.innerHTML = `<span>${acc.icon}</span>`;
            
            this.elements.sidebarSwitcher.insertBefore(item, document.getElementById('globalSettingsBtn'));
        });
    }

    toggleFocusMode(enable) {
        if (enable) {
            this.elements.sidebarSwitcher.classList.add('collapsed');
            this.elements.accountPanel.classList.add('collapsed');
            this.elements.viewportHeader.style.display = 'none';
            this.elements.exitFocusBtn.style.display = 'block';
            this.elements.sidebarSwitcher.style.width = '0px';
            this.elements.accountPanel.style.width = '0px';
            
            // Hide resizers
            this.elements.resizerSidebar.style.display = 'none';
            this.elements.resizerAccount.style.display = 'none';
        } else {
            this.elements.sidebarSwitcher.classList.remove('collapsed');
            this.elements.accountPanel.classList.remove('collapsed');
            this.elements.viewportHeader.style.display = 'flex';
            this.elements.exitFocusBtn.style.display = 'none';
            
            // Restore widths
            this.elements.sidebarSwitcher.style.width = localStorage.getItem('sidebar_width') || '70px';
            this.elements.accountPanel.style.width = localStorage.getItem('account_panel_width') || '280px';
            
            // Show resizers
            this.elements.resizerSidebar.style.display = 'block';
            this.elements.resizerAccount.style.display = 'block';
        }
    }
    clearAllPool() {
        Object.keys(this.webviewPool).forEach(id => {
            this.webviewPool[id].remove();
        });
        this.webviewPool = {};
        this.renderLayout();
    }
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    window.app = new MultiWhatsappApp();
});
