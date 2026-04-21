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
        this.settings = this.loadSettings();

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
        };

        this.searchTerm = '';
        this.isPanelCollapsed = localStorage.getItem('panel_collapsed') === 'true';
        this.init();
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
        this.isPanelCollapsed = !this.isPanelCollapsed;
        this.elements.appContainer.classList.toggle('collapsed');
        localStorage.setItem('panel_collapsed', this.isPanelCollapsed);
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
            enableSound: true
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
        this.elements.editProfileBtn.onclick = () => this.handleEditProfile();
        
        this.elements.togglePanelBtn.onclick = () => this.togglePanel();
        
        this.elements.helpBtn.onclick = () => this.showSettings();
        this.elements.closeAboutBtn.onclick = () => this.hideAbout();
        this.elements.closeSettingsBtn.onclick = () => this.handleSaveSettings();
        
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

        // Close modal on overlay click
        this.elements.modalOverlay.onclick = (e) => {
            if (e.target === this.elements.modalOverlay) this.hideModal();
        };
    }

    showModal(editData = null) {
        if (editData) {
            this.isEditing = true;
            this.editingId = editData.id;
            this.elements.modalTitle.innerText = "Edit Profile";
            this.elements.accNameInput.value = editData.name;
            this.elements.accIconInput.value = editData.icon;
            this.elements.accColorInput.value = editData.color;
        } else {
            this.isEditing = false;
            this.editingId = null;
            this.elements.modalTitle.innerText = "Add New Account";
            this.elements.accNameInput.value = "";
            this.elements.accIconInput.value = "";
            this.elements.accColorInput.value = "#10b981";
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

    showSettings() {
        this.elements.settingsModal.classList.add('active');
    }

    handleSaveSettings() {
        this.settings = {
            enableMirror: this.elements.settingEnableMirror.checked,
            maxSlots: parseInt(this.elements.settingMaxSlots.value),
            windowGap: parseInt(this.elements.settingWindowGap.value),
            showBranding: this.elements.settingShowBranding.checked,
            enableSound: this.elements.settingEnableSound.checked
        };
        this.saveSettings();
        this.elements.settingsModal.classList.remove('active');
    }

    setLayout(layout) {
        if (layout > this.settings.maxSlots) return;
        this.currentLayout = layout;
        
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
            }
        });

        this.elements.accountList.addEventListener('dragend', (e) => {
            const item = e.target.closest('.account-item');
            if (item) item.style.opacity = '1';
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
        // Clear all except landing page
        const containers = this.elements.viewportContent.querySelectorAll('.webview-container');
        containers.forEach(c => c.remove());

        const numSlots = this.currentLayout;
        for (let i = 0; i < numSlots; i++) {
            const slotId = this.slots[i];
            const container = this.createSlotContainer(i, slotId);
            this.elements.viewportContent.appendChild(container);
        }
        
        if (numSlots > 0 && this.elements.landingPage) {
            this.elements.landingPage.style.display = 'none';
        }
    }

    createSlotContainer(index, accId) {
        const container = document.createElement('div');
        container.className = 'webview-container';
        container.dataset.index = index;
        container.dataset.accId = accId || '';
        container.style.height = '100%';
        container.style.position = 'relative';
        container.style.border = '1px solid var(--glass-border)';
        container.style.borderRadius = '8px';
        container.style.overflow = 'hidden';

        if (!accId) {
            container.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: var(--text-secondary); background: var(--bg-secondary);">
                    <i class="fas fa-plus-circle" style="font-size: 2rem; margin-bottom: 12px; opacity: 0.3;"></i>
                    <span style="font-size: 0.8rem;">Drag account here</span>
                </div>
            `;
            return container;
        }

        const account = this.accounts.find(a => a.id === accId);
        container.innerHTML = `
            <div class="qr-split-view" style="flex-direction: ${this.currentLayout === 1 ? 'row' : 'column'}">
                <div class="qr-instructions" style="padding: ${this.currentLayout === 4 ? '20px' : '40px'}; font-size: ${this.currentLayout === 4 ? '0.8rem' : '1rem'}">
                    <h2 style="font-size: ${this.currentLayout === 4 ? '1.2rem' : '1.8rem'}">Scan to log in</h2>
                    <ul class="instruction-list">
                        <li><div class="instruction-num">1</div> <span>Scan QR with phone</span></li>
                        <li><div class="instruction-num">2</div> <span>Tap link in WhatsApp</span></li>
                        <li><div class="instruction-num">3</div> <span>Scan again to link</span></li>
                    </ul>
                </div>
                <div class="qr-webview-container">
                    <div class="loading-overlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: white; z-index: 1;">
                        <div class="spinner" style="width: 30px; height: 30px; border: 2px solid #f3f3f3; border-top: 2px solid var(--whatsapp-green); border-radius: 50%; animation: spin 1s linear infinite;"></div>
                    </div>
                    <webview 
                        src="https://web.whatsapp.com" 
                        partition="persist:${account.session}" 
                        style="width: 100%; height: 100%; border: none;"
                        useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
                    ></webview>
                </div>
            </div>
        `;

        const wv = container.querySelector('webview');
        wv.addEventListener('did-finish-load', () => {
            container.querySelector('.loading-overlay').style.display = 'none';
            
            // Set initial audio state
            const account = this.accounts.find(a => a.id === accId);
            const isMuted = !this.settings.enableSound || (account && account.isMuted);
            wv.setAudioMuted(isMuted);

            wv.insertCSS(`
                ._akau { display: none !important; } 
                .landing-header { display: none !important; }
                .landing-window { background: white !important; box-shadow: none !important; width: 100% !important; max-width: none !important; }
                .landing-main { padding: 0 !important; width: 100% !important; }
                ._akav { margin: 0 !important; width: 100% !important; display: flex !important; justify-content: center !important; }
            `);

            // Inject notification blocker if needed
            if (account && account.notificationsDisabled) {
                wv.executeJavaScript(`
                    window.Notification = function() { 
                        console.log('Notifications blocked for this account'); 
                        return { close: function() {}, onclick: null, onclose: null, onerror: null, onshow: null }; 
                    };
                    window.Notification.permission = 'denied';
                    window.Notification.requestPermission = () => Promise.resolve('denied');
                `);
            }
        });

        return container;
    }

    handleEditProfile() {
        const account = this.accounts.find(a => a.id === this.activeAccountId);
        if (account) this.showModal(account);
    }

    selectAccount(id) {
        this.activeAccountId = id;
        
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
                <div class="account-avatar" style="color: ${acc.color}; border: 2px solid ${acc.color}33">
                    ${acc.icon}
                </div>
                <div class="account-info">
                    <span class="account-name">${acc.name}</span>
                    <span class="account-status">${acc.status}</span>
                </div>
                ${acc.id === this.activeAccountId ? '<i class="fas fa-chevron-right" style="font-size: 0.8rem; color: var(--accent-primary)"></i>' : ''}
            `;
            this.elements.accountList.appendChild(item);
        });

        // Render Sidebar Switcher
        const existingItems = this.elements.sidebarSwitcher.querySelectorAll('.switcher-item:not(#globalSettingsBtn)');
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
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    window.app = new MultiWhatsappApp();
});
