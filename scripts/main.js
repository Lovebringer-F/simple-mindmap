/**
 * Simple MindMap Module (Standalone Window Version)
 * Fixed: Square Image Layout for Nodes
 */

const MODULE_ID = 'simple-mindmap';
const SETTING_KEY = 'maps_data';
const LAST_MAP_KEY = 'last_map_id';

/* -------------------------------------------- */
/* 0. Global CSS & Styles                      */
/* -------------------------------------------- */

const MINDMAP_CSS = `
    /* --- Window Styles --- */
    .mindmap-window .window-content { 
        padding: 0; 
        overflow: hidden; 
        background: #1a1a1a; 
    }

    /* --- Main Wrapper --- */
    .mm-wrapper {
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
    }

    /* --- Toolbar --- */
    .mm-toolbar {
        flex: 0 0 36px;
        background: #2a2a2a;
        border-bottom: 1px solid #000;
        display: flex;
        align-items: center;
        padding: 0 10px;
        gap: 10px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        z-index: 50;
    }
    
    .mm-toolbar select {
        height: 24px;
        background: #111;
        color: #eee;
        border: 1px solid #444;
        border-radius: 3px;
    }
    
    #mm-map-selector { flex: 1; max-width: 250px; }
    #mm-line-style { width: 100px; }

    .mm-toolbar-btn {
        background: #444;
        color: #eee;
        border: 1px solid #222;
        border-radius: 3px;
        width: 24px; height: 24px;
        display: flex; align-items: center; justify-content: center;
        cursor: pointer;
        font-size: 12px;
    }
    .mm-toolbar-btn:hover { background: #666; color: #fff; }
    .mm-toolbar-btn.danger:hover { background: #993333; }

    /* --- Editor Canvas --- */
    .mindmap-container {
        flex: 1;
        width: 100%;
        height: 100%;
        background-color: #222;
        position: relative;
        overflow: hidden;
        cursor: grab;
        /* ИЗМЕНЕНО: Изначально фон сетки не виден */
        background-image: none; 
        font-family: 'Signika', sans-serif;
    }
    
    /* НОВОЕ: Сетка появляется только при наличии класса show-grid */
    .mindmap-container.show-grid {
        background-image: radial-gradient(#555 1px, transparent 1px);
        background-size: 25px 25px;
    }

    .mindmap-container.panning { cursor: grabbing; }
    
    .mindmap-content {
        position: absolute;
        top: 0; left: 0; width: 100%; height: 100%;
        transform-origin: 0 0; 
        will-change: transform;
        pointer-events: none; 
    }
    
    /* --- Nodes (UPDATED STYLE) --- */
    .mindmap-node {
        position: absolute;
        background: linear-gradient(to bottom, #f5f5f5, #e0e0e0);
        border: 1px solid #777;
        border-radius: 6px;
        padding: 0; /* Removed padding so image touches edges */
        min-width: 160px;
        max-width: 260px;
        height: 50px; /* Fixed height for the card look */
        color: #222;
        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        cursor: pointer;
        user-select: none;
        z-index: 10;
        display: flex;
        align-items: stretch; /* Stretch children vertically */
        gap: 0;
        font-size: 14px;
        font-weight: bold;
        transition: box-shadow 0.2s, border-color 0.2s, transform 0.1s;
        pointer-events: auto;
        overflow: hidden; /* Clip image at corners */
    }
    .mindmap-node:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(0,0,0,0.6);
        border-color: #aaa;
        z-index: 12;
    }
    .mindmap-node.selected {
        border-color: #ff6400;
        box-shadow: 0 0 0 2px rgba(255, 100, 0, 0.6), 0 6px 12px rgba(0,0,0,0.5);
        z-index: 15;
        background: #fff;
    }
    .mindmap-node.map-link {
        background: linear-gradient(to bottom, #e3f2fd, #bbdefb);
        border-color: #2196f3;
    }
    
    /* Image takes full left side square */
    .mindmap-node img {
        border: none;
        border-right: 1px solid rgba(0,0,0,0.15);
        width: 50px;  /* Square width matching height */
        height: 100%; /* Full height */
        object-fit: cover;
        background: #333;
        border-radius: 0;
        flex-shrink: 0;
        pointer-events: none;
    }

    /* Text container */
    .mindmap-node span {
        padding: 0 12px;
        display: flex;
        align-items: center;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        flex: 1;
        line-height: 1.2;
    }

    /* --- Anchor Points --- */
    .mindmap-container.show-anchors .mindmap-node::after {
        content: '';
        position: absolute;
        top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        width: 10px; height: 10px;
        background: #ff6400;
        border-radius: 50%;
        box-shadow: 0 0 5px rgba(255, 100, 0, 0.8);
        z-index: 20;
        pointer-events: none;
        animation: pulse-anchor 1s infinite;
    }
    @keyframes pulse-anchor {
        0% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; }
        50% { transform: translate(-50%, -50%) scale(1.5); opacity: 0.4; }
        100% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; }
    }

    /* --- SVG Layer --- */
    .mindmap-svg-layer {
        position: absolute;
        top: 0; left: 0; width: 100%; height: 100%;
        pointer-events: none; 
        z-index: 5;
        overflow: visible;
    }
    
    /* --- Connection Handles --- */
    .connection-nodes-layer {
        position: absolute;
        top: 0; left: 0; width: 100%; height: 100%;
        pointer-events: none;
        z-index: 8; 
    }
    
    .connection-handle {
        position: absolute;
        transform: translate(-50%, -50%);
        cursor: pointer;
        pointer-events: auto;
        display: flex;
        justify-content: center;
        align-items: center;
        transition: all 0.2s;
        z-index: 10;
    }

    .connection-handle:not(.has-text) {
        width: 14px; height: 14px;
        background: rgba(255, 255, 255, 0.15);
        border: 1px solid rgba(200, 200, 200, 0.5);
        border-radius: 50%; /* ИЗМЕНЕНО: теперь круглый */
    }
    .connection-handle:not(.has-text):hover {
        background: rgba(255, 255, 255, 0.8);
        border-color: #ff6400;
        box-shadow: 0 0 5px rgba(0,0,0,0.5);
        transform: translate(-50%, -50%) scale(1.2);
        z-index: 20;
    }

    .connection-handle.has-text {
        background: rgba(30, 30, 30, 0.85);
        color: #eee;
        padding: 2px 8px;
        border-radius: 12px;
        border: 1px solid #555;
        font-size: 12px;
        white-space: nowrap;
        box-shadow: 0 2px 5px rgba(0,0,0,0.5);
        min-width: 20px;
    }
    .connection-handle.has-text:hover {
        background: rgba(50, 50, 50, 0.95);
        border-color: #ff6400;
        color: #fff;
        z-index: 20;
        transform: translate(-50%, -50%) scale(1.05);
    }

    /* --- Selection Lasso --- */
    .selection-lasso {
        position: absolute;
        border: 1px dashed #00aaff;
        background: rgba(0, 170, 255, 0.15);
        pointer-events: none;
        z-index: 100;
        display: none;
    }

    /* --- UI Controls (Bottom Left) --- */
    .mindmap-ui {
        position: absolute;
        bottom: 15px; left: 15px;
        z-index: 20;
        background: rgba(30, 30, 30, 0.9);
        backdrop-filter: blur(4px);
        padding: 10px;
        border-radius: 8px;
        color: #eee;
        border: 1px solid #555;
        display: flex;
        flex-direction: column;
        gap: 8px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.5);
        pointer-events: auto;
    }
    .help-text { font-size: 0.8em; color: #bbb; margin-top: 5px; line-height: 1.4; }
    .help-text b { color: #ffaa55; }

    /* --- Dialog Styles --- */
    .mm-dialog-content { display: flex; flex-direction: column; gap: 10px; padding: 10px; }
    .mm-dialog-row { display: flex; align-items: center; gap: 10px; }
    .mm-dialog-row label { flex: 0 0 60px; }
    .mm-dialog-row input, .mm-dialog-row select { flex: 1; }
`;

/* -------------------------------------------- */
/* 1. Data Storage                             */
/* -------------------------------------------- */

class MindMapData {
    static getMaps() { 
        const data = game.settings.get(MODULE_ID, SETTING_KEY);
        return foundry.utils.deepClone(data || {});
    }
    
    static async saveMaps(data) { 
        await game.settings.set(MODULE_ID, SETTING_KEY, foundry.utils.deepClone(data)); 
    }

    static getLastMapId() { return game.settings.get(MODULE_ID, LAST_MAP_KEY); }
    static async setLastMapId(id) { await game.settings.set(MODULE_ID, LAST_MAP_KEY, id); }

    static async createMap(name) {
        const maps = this.getMaps();
        const id = foundry.utils.randomID();
        maps[id] = { id, name, nodes: [], connections: [], lineStyle: 'curve' };
        await this.saveMaps(maps);
        return id;
    }

    static async deleteMap(id) {
        const maps = this.getMaps();
        if (maps[id]) {
            delete maps[id];
            await this.saveMaps(maps);
            if (this.getLastMapId() === id) {
                const keys = Object.keys(maps);
                await this.setLastMapId(keys.length > 0 ? keys[0] : "");
            }
        }
    }

    static async updateMap(id, mapData) {
        const maps = this.getMaps();
        if (!id || !mapData) return;
        maps[id] = mapData;
        await this.saveMaps(maps);
    }
}

/* -------------------------------------------- */
/* 2. Editor Window                            */
/* -------------------------------------------- */

class MindMapEditor extends Application {
    constructor(mapId, options) {
        super(options);
        this.mapId = mapId;
        this._loadMapData();
        
        // State variables
        this.draggingNodes = new Set(); 
        this.connectingNode = null;
        this.dragOffsets = {}; 
        this.selectedNodeIds = new Set(); 
        
        // RMB Tracking
        this.rmbStartNode = null;
        this.rmbStartPos = { x: 0, y: 0 };
        
        // View State
        this.zoom = 1;
        this.pan = { x: 0, y: 0 };
        this.isPanning = false;
        
        // Selection Lasso State
        this.isSelecting = false;
        this.selectionStart = { x: 0, y: 0 };
        this.selectionRect = { x: 0, y: 0, w: 0, h: 0 };

        // Bound handlers
        this._handlers = {};
    }

    _loadMapData() {
        const maps = MindMapData.getMaps();
        if (maps[this.mapId]) {
            this.mapData = maps[this.mapId];
            if (!this.mapData.lineStyle) this.mapData.lineStyle = 'curve';
            MindMapData.setLastMapId(this.mapId);
        } else {
            const keys = Object.keys(maps);
            if (keys.length > 0) {
                this.mapId = keys[keys.length - 1];
                this.mapData = maps[this.mapId];
                if (!this.mapData.lineStyle) this.mapData.lineStyle = 'curve';
            } else {
                this.mapId = null;
                this.mapData = null;
            }
        }
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "mindmap-editor",
            title: game.i18n.localize("SIMPLE_MINDMAP.WINDOW_TITLE"), // Localized
            width: 1000,
            height: 700,
            resizable: true,
            popOut: true,
            classes: ["mindmap-window"]
        });
    }

    get title() { 
        // Localized title
        const titlePart = game.i18n.localize("SIMPLE_MINDMAP.WINDOW_TITLE");
        const mapNamePart = this.mapData ? this.mapData.name : game.i18n.localize("SIMPLE_MINDMAP.SELECT_MAP");
        return `${titlePart}: ${mapNamePart}`;
    }

    async _renderInner(...args) {
        const maps = MindMapData.getMaps();
        let optionsHtml = "";
        
        if (Object.keys(maps).length === 0) {
            optionsHtml = `<option value="" disabled selected>${game.i18n.localize("SIMPLE_MINDMAP.NO_MAPS")}</option>`; // Localized
        } else {
            for (const [id, map] of Object.entries(maps)) {
                const selected = id === this.mapId ? "selected" : "";
                optionsHtml += `<option value="${id}" ${selected}>${map.name}</option>`;
            }
        }

        const currentStyle = this.mapData?.lineStyle || 'curve';

        const htmlContent = `
        <div class="mm-wrapper">
            <div class="mm-toolbar">
                <select id="mm-map-selector" title="${game.i18n.localize("SIMPLE_MINDMAP.TOOLBAR_SELECT_MAP")}">${optionsHtml}</select>
                <div style="width: 1px; height: 16px; background: #555; margin: 0 5px;"></div>
                <select id="mm-line-style" title="${game.i18n.localize("SIMPLE_MINDMAP.TOOLBAR_LINE_STYLE")}">
                    <option value="curve" ${currentStyle === 'curve' ? 'selected' : ''}>${game.i18n.localize("SIMPLE_MINDMAP.LINE_STYLE_CURVE")}</option>
                    <option value="straight" ${currentStyle === 'straight' ? 'selected' : ''}>${game.i18n.localize("SIMPLE_MINDMAP.LINE_STYLE_STRAIGHT")}</option>
                    <option value="orthogonal" ${currentStyle === 'orthogonal' ? 'selected' : ''}>${game.i18n.localize("SIMPLE_MINDMAP.LINE_STYLE_ORTHOGONAL")}</option>
                </select>
                <div style="width: 1px; height: 16px; background: #555; margin: 0 5px;"></div>
                <button class="mm-toolbar-btn" id="mm-add-link" title="${game.i18n.localize("SIMPLE_MINDMAP.TOOLBAR_ADD_LINK")}"><i class="fas fa-link"></i></button>
                <div style="width: 1px; height: 16px; background: #555; margin: 0 5px;"></div>
                <button class="mm-toolbar-btn" id="mm-new" title="${game.i18n.localize("SIMPLE_MINDMAP.TOOLBAR_NEW")}"><i class="fas fa-plus"></i></button>
                <button class="mm-toolbar-btn" id="mm-rename" title="${game.i18n.localize("SIMPLE_MINDMAP.TOOLBAR_RENAME")}"><i class="fas fa-pen"></i></button>
                <button class="mm-toolbar-btn danger" id="mm-delete" title="${game.i18n.localize("SIMPLE_MINDMAP.TOOLBAR_DELETE")}"><i class="fas fa-trash"></i></button>
            </div>

            <div class="mindmap-container" id="mm-canvas">
                ${!this.mapData ? `<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#777;">${game.i18n.localize("SIMPLE_MINDMAP.CANVAS_HINT")}</div>` : ''}
                <div class="selection-lasso" id="mm-lasso"></div>
                <div class="mindmap-ui">
                    <button class="mm-btn" id="refresh-map" title="${game.i18n.localize("SIMPLE_MINDMAP.HELP_RESET_VIEW")}"><i class="fas fa-compress-arrows-alt"></i></button>
                    <div class="help-text">
                        <b>${game.i18n.localize("SIMPLE_MINDMAP.HELP_TEXT_1")}</b><br>
                        <b>${game.i18n.localize("SIMPLE_MINDMAP.HELP_TEXT_2")}</b><br>
                        <b>${game.i18n.localize("SIMPLE_MINDMAP.HELP_TEXT_3")}</b><br>
                        <b>${game.i18n.localize("SIMPLE_MINDMAP.HELP_TEXT_4")}</b><br>
                        <b>${game.i18n.localize("SIMPLE_MINDMAP.HELP_TEXT_5")}</b><br>
                        <b>${game.i18n.localize("SIMPLE_MINDMAP.HELP_TEXT_6")}</b>
                    </div>
                </div>
                <div class="mindmap-content">
                    <svg class="mindmap-svg-layer"></svg>
                    <div class="connection-nodes-layer"></div>
                    <div class="nodes-layer"></div>
                </div>
            </div>
        </div>`;
        return $(htmlContent);
    }

    activateListeners(html) {
        super.activateListeners(html);
        this._removeGlobalListeners();

        this.container = html.find('#mm-canvas');
        if (!this.container.length) return;

        this.content = this.container.find('.mindmap-content');
        this.nodesLayer = this.container.find('.nodes-layer');
        this.connectionLayer = this.container.find('.connection-nodes-layer');
        this.svgLayer = this.container.find('.mindmap-svg-layer')[0]; 
        this.lasso = html.find('#mm-lasso');
        
        if (this.mapData) {
            this._renderGraph();
            this._updateTransform();
        }

        // Toolbar Actions
        html.find('#mm-map-selector').change((e) => this._switchMap(e.target.value));
        html.find('#mm-line-style').change(async (e) => {
            if (this.mapData) {
                this.mapData.lineStyle = e.target.value;
                await MindMapData.updateMap(this.mapId, this.mapData);
                this._renderGraph();
            }
        });
        html.find('#mm-new').click(() => this._createMapDialog());
        html.find('#mm-rename').click(() => this._renameMapDialog());
        html.find('#mm-delete').click(() => this._deleteMapDialog());
        html.find('#mm-add-link').click(() => this._addMapLinkDialog());
        html.find('#refresh-map').click(() => {
            this.zoom = 1; this.pan = { x: 0, y: 0 };
            this._updateTransform();
        });

        // Interaction Events
        const dropEl = this.container[0]; 
        if (dropEl) {
            dropEl.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; });
            dropEl.addEventListener('drop', this._onDropEntity.bind(this));
        }
        
        this.container.on('wheel', this._onWheel.bind(this));
        this.container.on('contextmenu', (e) => e.preventDefault());
        this.container.on('mousedown', this._onContainerMouseDown.bind(this));
        
        this.container.on('mousedown', '.mindmap-node', this._onNodeMouseDown.bind(this));
        this.container.on('dblclick', '.connection-handle', this._onConnectionDblClick.bind(this));

        // Global Listeners
        this._handlers.mousemove = this._onMouseMove.bind(this);
        this._handlers.mouseup = this._onMouseUp.bind(this);
        this._handlers.keydown = this._onKeyDown.bind(this);
        
        window.addEventListener('mousemove', this._handlers.mousemove);
        window.addEventListener('mouseup', this._handlers.mouseup);
        window.addEventListener('keydown', this._handlers.keydown);
    }

    async close(options) {
        this._removeGlobalListeners();
        return super.close(options);
    }

    _removeGlobalListeners() {
        if (this._handlers.mousemove) window.removeEventListener('mousemove', this._handlers.mousemove);
        if (this._handlers.mouseup) window.removeEventListener('mouseup', this._handlers.mouseup);
        if (this._handlers.keydown) window.removeEventListener('keydown', this._handlers.keydown);
        this._handlers = {};
    }

    /* --- Toolbar Logic --- */

    async _switchMap(newId) {
        if (!newId) return;
        await MindMapData.setLastMapId(newId);
        this.mapId = newId;
        this._loadMapData();
        this.selectedNodeIds.clear();
        this.render(true); 
    }

    _createMapDialog() {
        new Dialog({
            title: game.i18n.localize("SIMPLE_MINDMAP.DIALOG_NEW_MAP_TITLE"), // Localized
            content: `<form><div class="form-group"><label>${game.i18n.localize("SIMPLE_MINDMAP.LABEL_NAME")}</label><input type="text" name="name" autofocus></div></form>`, // Localized
            buttons: {
                ok: {
                    label: game.i18n.localize("SIMPLE_MINDMAP.BUTTON_CREATE"), // Localized
                    icon: '<i class="fas fa-check"></i>',
                    callback: async (html) => {
                        const name = html.find('[name="name"]').val();
                        if (name) {
                            const id = await MindMapData.createMap(name);
                            this._switchMap(id);
                        }
                    }
                }
            },
            default: "ok"
        }).render(true);
    }

    _renameMapDialog() {
        if (!this.mapData) return;
        new Dialog({
            title: game.i18n.localize("SIMPLE_MINDMAP.DIALOG_RENAME_MAP_TITLE"), // Localized
            content: `<form><div class="form-group"><label>${game.i18n.localize("SIMPLE_MINDMAP.LABEL_NEW_NAME")}</label><input type="text" name="name" value="${this.mapData.name}" autofocus></div></form>`, // Localized
            buttons: {
                ok: {
                    label: game.i18n.localize("SIMPLE_MINDMAP.BUTTON_SAVE"), // Localized
                    callback: async (html) => {
                        const name = html.find('[name="name"]').val();
                        if (name) {
                            this.mapData.name = name;
                            await MindMapData.updateMap(this.mapId, this.mapData);
                            this.render(true);
                        }
                    }
                }
            }
        }).render(true);
    }

    _deleteMapDialog() {
        if (!this.mapData) return;
        const content = game.i18n.format("SIMPLE_MINDMAP.CONFIRM_DELETE", { mapName: this.mapData.name }); // Localized with format
        Dialog.confirm({
            title: game.i18n.localize("SIMPLE_MINDMAP.DIALOG_DELETE_MAP_TITLE"), // Localized
            content: `<p>${content}</p>`,
            yes: async () => {
                await MindMapData.deleteMap(this.mapId);
                const maps = MindMapData.getMaps();
                const keys = Object.keys(maps);
                if (keys.length > 0) {
                    this._switchMap(keys[keys.length - 1]);
                } else {
                    this.mapId = null; 
                    this.mapData = null;
                    this.render(true);
                }
            }
        });
    }

    _addMapLinkDialog() {
        if (!this.mapId) return;
        const maps = MindMapData.getMaps();
        let options = "";
        for (const [id, map] of Object.entries(maps)) {
            if (id !== this.mapId) options += `<option value="${id}">${map.name}</option>`;
        }

        if (!options) {
            ui.notifications.warn(game.i18n.localize("SIMPLE_MINDMAP.NOTIFICATION_NO_OTHER_MAPS")); // Localized
            return;
        }

        new Dialog({
            title: game.i18n.localize("SIMPLE_MINDMAP.DIALOG_ADD_LINK_TITLE"), // Localized
            content: `<div class="mm-dialog-content"><div class="mm-dialog-row"><label>${game.i18n.localize("SIMPLE_MINDMAP.LABEL_MAP")}</label><select id="link-map-select">${options}</select></div></div>`, // Localized
            buttons: {
                add: {
                    label: game.i18n.localize("SIMPLE_MINDMAP.BUTTON_ADD"), // Localized
                    icon: '<i class="fas fa-link"></i>',
                    callback: async (html) => {
                        const targetMapId = html.find('#link-map-select').val();
                        const targetMap = maps[targetMapId];
                        if (targetMap) {
                            if (!this.mapData.nodes) this.mapData.nodes = [];
                            const centerX = (this.container.width() / 2 - this.pan.x) / this.zoom;
                            const centerY = (this.container.height() / 2 - this.pan.y) / this.zoom;

                            this.mapData.nodes.push({
                                id: foundry.utils.randomID(),
                                type: 'map',
                                targetId: targetMapId,
                                name: targetMap.name,
                                img: "icons/svg/direction.svg",
                                x: centerX - 75, y: centerY - 25
                            });
                            await MindMapData.updateMap(this.mapId, this.mapData);
                            this._renderGraph();
                        }
                    }
                }
            },
            default: "add"
        }).render(true);
    }

    /* --- Canvas Logic --- */

    _getCanvasCoords(e) {
        if (!this.container[0]) return {x:0, y:0};
        const rect = this.container[0].getBoundingClientRect();
        return {
            x: (e.clientX - rect.left - this.pan.x) / this.zoom,
            y: (e.clientY - rect.top - this.pan.y) / this.zoom
        };
    }
    
    _getScreenCoords(e) {
        if (!this.container[0]) return {x:0, y:0};
        const rect = this.container[0].getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    _updateTransform() {
        if (this.content && this.mapData) {
            this.content.css('transform', `translate(${this.pan.x}px, ${this.pan.y}px) scale(${this.zoom})`);
            
            // НОВАЯ ЛОГИКА: Показать сетку только при зуме > 0.8 (80%)
            if (this.zoom > 0.8) {
                this.container.addClass('show-grid');
                this.container.css({
                    'background-size': `${25 * this.zoom}px ${25 * this.zoom}px`,
                    'background-position': `${this.pan.x}px ${this.pan.y}px`
                });
            } else {
                this.container.removeClass('show-grid');
                this.container.css({
                    'background-size': `25px 25px`, 
                    'background-position': `0px 0px`
                });
            }
        }
    }

    _onWheel(e) {
        e.preventDefault();
        if (!this.mapData) return;
        const ev = e.originalEvent || e;
        const factor = Math.exp((ev.deltaY < 0 ? 1 : -1) * 0.1);
        
        const rect = this.container[0].getBoundingClientRect();
        const mouseX = ev.clientX - rect.left;
        const mouseY = ev.clientY - rect.top;
        const worldX = (mouseX - this.pan.x) / this.zoom;
        const worldY = (mouseY - this.pan.y) / this.zoom;

        this.zoom = Math.max(0.1, Math.min(this.zoom * factor, 5));
        this.pan.x = mouseX - worldX * this.zoom;
        this.pan.y = mouseY - worldY * this.zoom;
        this._updateTransform();
    }

    _onContainerMouseDown(e) {
        if (e.button === 2) {
            this.isPanning = true;
            this.container.addClass('panning');
            return;
        }

        if (e.target.classList.contains('mindmap-container') || e.target.closest('.mindmap-content')) {
            if (!e.shiftKey && !e.ctrlKey) {
                this.selectedNodeIds.clear();
                this._renderSelection();
            }
            this.isSelecting = true;
            const coords = this._getScreenCoords(e);
            this.selectionStart = coords;
            this.lasso.css({ left: coords.x, top: coords.y, width: 0, height: 0, display: 'block' });
        }
    }

    async _onDropEntity(e) {
        e.preventDefault();
        if (!this.mapId || !this.mapData) {
            ui.notifications.warn(game.i18n.localize("SIMPLE_MINDMAP.NOTIFICATION_CREATE_FIRST")); // Localized
            return;
        }
        try {
            let data;
            try { data = JSON.parse(e.dataTransfer.getData('text/plain')); } catch (err) { return; }
            let doc;
            if (data.uuid) doc = await fromUuid(data.uuid);
            else if (data.type === "Actor") doc = game.actors.get(data.id);
            else if (data.type === "Item") doc = game.items.get(data.id);
            else if (data.type === "JournalEntry") doc = game.journal.get(data.id);
            else if (data.type === "Scene") doc = game.scenes.get(data.id);
            
            if (!doc) return ui.notifications.warn(game.i18n.localize("SIMPLE_MINDMAP.NOTIFICATION_UNKNOWN_DOC")); // Localized

            const img = (doc.documentName === "Scene" ? (doc.thumb || doc.img) : (doc.img || doc.texture?.src)) || "icons/svg/book.svg";
            const coords = this._getCanvasCoords(e);
            if (!this.mapData.nodes) this.mapData.nodes = [];
            this.mapData.nodes.push({
                id: foundry.utils.randomID(),
                uuid: doc.uuid,
                name: doc.name,
                img,
                x: coords.x - 75, y: coords.y - 25
            });
            this._renderGraph(); 
            await MindMapData.updateMap(this.mapId, this.mapData); 
        } catch (err) { console.error(err); }
    }

    /* --- Rendering --- */

    _renderGraph() {
        if (!this.svgLayer || !this.nodesLayer) return;
        while (this.svgLayer.firstChild) this.svgLayer.removeChild(this.svgLayer.firstChild);
        this.nodesLayer.empty();
        this.connectionLayer.empty();

        if (!this.mapData) return;

        (this.mapData.nodes || []).forEach(node => {
            const selected = this.selectedNodeIds.has(node.id) ? "selected" : "";
            const mapClass = node.type === 'map' ? 'map-link' : '';
            const el = $(`<div class="mindmap-node ${mapClass} ${selected}" data-id="${node.id}" style="left: ${node.x}px; top: ${node.y}px;">
                <img src="${node.img}" draggable="false"><span>${node.name}</span></div>`);
            this.nodesLayer.append(el);
        });

        (this.mapData.connections || []).forEach(c => {
            if (!c.id) c.id = foundry.utils.randomID();
            const f = this.mapData.nodes.find(n => n.id === c.from);
            const t = this.mapData.nodes.find(n => n.id === c.to);
            if (f && t) this._drawConnection(f, t, c);
        });
    }
    
    _renderSelection() {
        this.nodesLayer.find('.mindmap-node').removeClass('selected');
        this.selectedNodeIds.forEach(id => {
            this.nodesLayer.find(`.mindmap-node[data-id="${id}"]`).addClass('selected');
        });
    }

    _drawConnection(nA, nB, connData, isTemp = false) {
        const [offX_adj, offY_adj] = [80, 25]; // 25 is half of 50px height

        let x1 = nA.x + offX_adj, y1 = nA.y + offY_adj;
        let x2 = (nB.x !== undefined ? nB.x + offX_adj : nB.x);
        let y2 = (nB.y !== undefined ? nB.y + offY_adj : nB.y);
        
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        
        const color = connData.color || "#aaaaaa";
        const style = this.mapData.lineStyle || 'curve';

        let pathD = "";
        let posx = 0, posy = 0;

        if (style === 'straight') {
            pathD = `M ${x1} ${y1} L ${x2} ${y2}`;
            posx = midX; posy = midY;
        } else if (style === 'orthogonal') {
            pathD = `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
            posx = midX; posy = midY;
        } else {
            pathD = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
            const t = 0.5;
            posx = Math.pow(1-t,3)*x1 + 3*Math.pow(1-t,2)*t*midX + 3*(1-t)*Math.pow(t,2)*y2 + Math.pow(t,3)*x2;
            posy = Math.pow(1-t,3)*y1 + 3*Math.pow(1-t,2)*t*y1 + 3*(1-t)*Math.pow(t,2)*y2 + Math.pow(t,3)*y2;
        }

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathD);
        path.setAttribute('stroke', color);
        path.setAttribute('stroke-width', '2');
        path.setAttribute('fill', 'none');
        if (isTemp) {
            path.setAttribute('stroke-dasharray', '5,5');
            path.style.pointerEvents = "none";
        }
        this.svgLayer.appendChild(path);

        if (!isTemp) {
            const hasText = !!connData.text;
            const handle = $(`<div class="connection-handle ${hasText ? 'has-text' : ''}" data-id="${connData.id}"></div>`);
            handle.css({ left: posx, top: posy });
            
            if (hasText) {
                handle.text(connData.text);
            }
            
            this.connectionLayer.append(handle);
        }

        return path;
    }

    /* --- Interaction Events --- */

    _onNodeMouseDown(e) {
        e.stopPropagation(); 
        const el = $(e.currentTarget);
        const id = el.data('id');

        if (e.button === 2) {
            this.rmbStartNode = id;
            this.rmbStartPos = { x: e.clientX, y: e.clientY };
            return this._onContainerMouseDown(e);
        }

        const node = this.mapData.nodes.find(n => n.id === id);
        const pos = this._getCanvasCoords(e);

        if (e.shiftKey) {
            this.connectingNode = node;
            this.tempLine = null;
            this.container.addClass('show-anchors');
            return;
        }

        if (e.ctrlKey) {
            if (this.selectedNodeIds.has(id)) this.selectedNodeIds.delete(id);
            else this.selectedNodeIds.add(id);
        } else {
            if (!this.selectedNodeIds.has(id)) {
                this.selectedNodeIds.clear();
                this.selectedNodeIds.add(id);
            }
        }
        
        this._renderSelection();
        this.draggingNodes = new Set(this.selectedNodeIds);
        this.dragOffsets = {};
        this.draggingNodes.forEach(nodeId => {
            const n = this.mapData.nodes.find(x => x.id === nodeId);
            if (n) this.dragOffsets[nodeId] = { x: pos.x - n.x, y: pos.y - n.y };
        });
    }

    _onMouseMove(e) {
        if (!this.container?.length) return;
        if (this.isPanning) {
            this.pan.x += e.movementX;
            this.pan.y += e.movementY;
            return this._updateTransform();
        }
        if (this.isSelecting) {
            const cur = this._getScreenCoords(e);
            const w = cur.x - this.selectionStart.x;
            const h = cur.y - this.selectionStart.y;
            this.selectionRect = { x: w < 0 ? cur.x : this.selectionStart.x, y: h < 0 ? cur.y : this.selectionStart.y, w: Math.abs(w), h: Math.abs(h) };
            this.lasso.css({ left: this.selectionRect.x, top: this.selectionRect.y, width: this.selectionRect.w, height: this.selectionRect.h });
            return;
        }
        const pos = this._getCanvasCoords(e);
        if (this.draggingNodes.size > 0) {
            this.draggingNodes.forEach(nodeId => {
                const n = this.mapData.nodes.find(x => x.id === nodeId);
                const offset = this.dragOffsets[nodeId];
                if (n && offset) {
                    n.x = pos.x - offset.x;
                    n.y = pos.y - offset.y;
                    this.nodesLayer.find(`[data-id="${nodeId}"]`).css({ left: n.x, top: n.y });
                }
            });
            this._rerenderLinesOnly();
        }
        if (this.connectingNode) {
            if (this.tempLine) this.tempLine.remove();
            this.tempLine = this._drawConnection(this.connectingNode, {x: pos.x - 80, y: pos.y - 25}, {color: "#ff6400"}, true);
        }
    }

    async _onMouseUp(e) {
        if (e.button === 2 && this.rmbStartNode) {
            const dist = Math.hypot(e.clientX - this.rmbStartPos.x, e.clientY - this.rmbStartPos.y);
            if (dist < 5) await this._openNodeDocument(this.rmbStartNode);
            this.rmbStartNode = null;
        }
        if (this.isPanning) { this.isPanning = false; this.container.removeClass('panning'); }
        if (this.isSelecting) {
            this.isSelecting = false;
            this.lasso.hide();
            this._finalizeSelection();
        }
        if (this.draggingNodes.size > 0) { 
            this.draggingNodes.clear(); 
            MindMapData.updateMap(this.mapId, this.mapData); 
            this._renderGraph(); 
        }
        if (this.connectingNode) {
            this.container.removeClass('show-anchors'); 
            if (this.tempLine) this.tempLine.remove();
            const target = $(document.elementFromPoint(e.clientX, e.clientY)).closest('.mindmap-node');
            if (target.length) {
                const tid = target.data('id');
                if (tid !== this.connectingNode.id) {
                    if (!this.mapData.connections) this.mapData.connections = [];
                    this.mapData.connections.push({ 
                        id: foundry.utils.randomID(),
                        from: this.connectingNode.id, 
                        to: tid, 
                        color: "#aaaaaa",
                        text: "" 
                    });
                    MindMapData.updateMap(this.mapId, this.mapData);
                    this._renderGraph();
                }
            }
            this.connectingNode = null;
        }
    }

    async _openNodeDocument(nodeId) {
        const node = this.mapData.nodes.find(n => n.id === nodeId);
        if (!node) return;
        if (node.type === 'map' && node.targetId) {
            const maps = MindMapData.getMaps();
            if (maps[node.targetId]) this._switchMap(node.targetId);
            else ui.notifications.warn(game.i18n.localize("SIMPLE_MINDMAP.NOTIFICATION_MAP_DELETED")); // Localized
            return;
        }
        if (!node.uuid) return;
        try {
            const doc = await fromUuid(node.uuid);
            if (!doc) { 
                const content = game.i18n.format("SIMPLE_MINDMAP.NOTIFICATION_DOC_NOT_FOUND", { docName: node.name }); // Localized with format
                ui.notifications.warn(content); 
                return; 
            }
            if (doc.documentName === "Scene") await doc.view();
            else if (doc.sheet) doc.sheet.render(true);
        } catch (err) { console.error("MindMap | Error opening doc:", err); }
    }

    _finalizeSelection() {
        const rect = this.selectionRect;
        if (rect.w < 2 && rect.h < 2) return;
        const nodes = this.container.find('.mindmap-node');
        const containerRect = this.container[0].getBoundingClientRect();
        const lassoAbs = { l: containerRect.left + rect.x, t: containerRect.top + rect.y, r: containerRect.left + rect.x + rect.w, b: containerRect.top + rect.y + rect.h };
        nodes.each((i, el) => {
            const $el = $(el);
            const nodeRect = el.getBoundingClientRect();
            const overlap = !(nodeRect.right < lassoAbs.l || nodeRect.left > lassoAbs.r || nodeRect.bottom < lassoAbs.t || nodeRect.top > lassoAbs.b);
            if (overlap) this.selectedNodeIds.add($el.data('id'));
        });
        this._renderSelection();
    }

    _rerenderLinesOnly() {
        while (this.svgLayer.firstChild) this.svgLayer.removeChild(this.svgLayer.firstChild);
        this.connectionLayer.empty(); 
        (this.mapData.connections || []).forEach(c => {
            const f = this.mapData.nodes.find(n => n.id === c.from);
            const t = this.mapData.nodes.find(n => n.id === c.to);
            if (f && t) this._drawConnection(f, t, c);
        });
    }

    _onKeyDown(e) {
        if (e.key === "Delete" && this.selectedNodeIds.size > 0) {
            const ids = Array.from(this.selectedNodeIds);
            this.mapData.nodes = this.mapData.nodes.filter(n => !this.selectedNodeIds.has(n.id));
            this.mapData.connections = (this.mapData.connections || []).filter(c => !ids.includes(c.from) && !ids.includes(c.to));
            this.selectedNodeIds.clear();
            this._renderGraph();
            MindMapData.updateMap(this.mapId, this.mapData);
        }
    }

    _onConnectionDblClick(e) {
        e.stopPropagation(); e.preventDefault();
        const connId = e.currentTarget.dataset.id;
        const connection = this.mapData.connections.find(c => c.id === connId);
        if (!connection) return;
        new Dialog({
            title: game.i18n.localize("SIMPLE_MINDMAP.DIALOG_CONN_EDIT_TITLE"), // Localized
            content: `<div class="mm-dialog-content">
                    <div class="mm-dialog-row"><label>${game.i18n.localize("SIMPLE_MINDMAP.LABEL_TEXT")}</label><input type="text" id="conn-text" value="${connection.text || ''}" placeholder="${game.i18n.localize("SIMPLE_MINDMAP.PLACEHOLDER_CAPTION")}"></div>
                    <div class="mm-dialog-row"><label>${game.i18n.localize("SIMPLE_MINDMAP.LABEL_COLOR")}</label><input type="color" id="conn-color" value="${connection.color || '#aaaaaa'}" style="height: 30px; padding: 0;"></div>
                </div>`, // Localized
            buttons: {
                save: {
                    label: game.i18n.localize("SIMPLE_MINDMAP.BUTTON_SAVE"), // Localized
                    icon: '<i class="fas fa-save"></i>',
                    callback: (html) => {
                        connection.text = html.find('#conn-text').val();
                        connection.color = html.find('#conn-color').val();
                        MindMapData.updateMap(this.mapId, this.mapData);
                        this._renderGraph();
                    }
                },
                delete: {
                    label: game.i18n.localize("SIMPLE_MINDMAP.BUTTON_DELETE"), // Localized
                    icon: '<i class="fas fa-trash"></i>',
                    callback: () => {
                        this.mapData.connections = this.mapData.connections.filter(c => c.id !== connId);
                        MindMapData.updateMap(this.mapId, this.mapData);
                        this._renderGraph();
                    }
                }
            },
            default: "save"
        }).render(true);
    }
}

/* -------------------------------------------- */
/* 3. Settings and Macro Logic                  */
/* -------------------------------------------- */

async function createMindMapMacro() {
    const macroName = "Simple_MindMap";
    // Команда макроса с использованием локализованного сообщения об ошибке
    const macroContent = `// Этот макрос запускает MindMap Manager, обращаясь к глобально доступному классу.
// Класс SimpleMindMapManager был прикреплен к window.SimpleMindMapManager в main.js
if (typeof SimpleMindMapManager !== 'undefined') {
    new SimpleMindMapManager().render(true);
} else {
    // Если модуль еще не загружен или класс не доступен
    ui.notifications.error(game.i18n.localize("SIMPLE_MINDMAP.MACRO_NOT_FOUND_ERROR"));
}`;

    const existingMacro = game.macros.getName(macroName);

    if (existingMacro) {
        // Если макрос существует, обновим его команду
        await existingMacro.update({ command: macroContent });
        ui.notifications.info(game.i18n.localize("SIMPLE_MINDMAP.MACRO_UPDATED"));
    } else {
        // Если макрос не существует, создадим новый
        await Macro.create({
            name: macroName,
            type: "script",
            img: "icons/svg/direction.svg", 
            command: macroContent
        });
        ui.notifications.info(game.i18n.localize("SIMPLE_MINDMAP.MACRO_CREATED"));
    }
}


async function startMindMap() {
    const maps = MindMapData.getMaps();
    const lastId = MindMapData.getLastMapId();
    const mapIds = Object.keys(maps);
    if (lastId && maps[lastId]) new MindMapEditor(lastId).render(true);
    else if (mapIds.length > 0) new MindMapEditor(mapIds[0]).render(true);
    else new MindMapEditor(null).render(true);
}

Hooks.once('init', () => {
    console.log("Simple MindMap | Init");
    
    // 1. Настройка для данных карт (скрытая)
    game.settings.register(MODULE_ID, SETTING_KEY, { 
        name: game.i18n.localize("SIMPLE_MINDMAP.TITLE"), 
        scope: "world", 
        config: false, 
        type: Object, 
        default: {} 
    }); 
    
    // 2. Настройка для ID последней открытой карты (скрытая)
    game.settings.register(MODULE_ID, LAST_MAP_KEY, { 
        name: game.i18n.localize("SIMPLE_MINDMAP.LAST_MAP_ID_SETTING"), 
        scope: "client", 
        config: false, 
        type: String, 
        default: "" 
    });
    
    // 3. Настройка-кнопка для создания макроса
    game.settings.register(MODULE_ID, 'createMacro', {
        name: game.i18n.localize('SIMPLE_MINDMAP.SETTING_MACRO_NAME'),
        hint: game.i18n.localize('SIMPLE_MINDMAP.SETTING_MACRO_HINT'),
        scope: 'world',
        config: true,
        type: Boolean, // Используется для отображения кнопки
        default: false,
        requiresReload: false,
        onChange: (value) => {
            // При нажатии на кнопку (значение меняется на true)
            if (value) {
                createMindMapMacro();
                // Сбрасываем значение, чтобы кнопка снова была доступна для нажатия
                game.settings.set(MODULE_ID, 'createMacro', false);
            }
        }
    });

    if (!$('#simple-mindmap-css').length) $('head').append(`<style id="simple-mindmap-css">${MINDMAP_CSS}</style>`);
    window.SimpleMindMap = { open: startMindMap };
});

window.SimpleMindMapManager = class { render(force) { startMindMap(); } };