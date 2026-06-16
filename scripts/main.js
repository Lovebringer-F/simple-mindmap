/**
 * Simple MindMap Module
 * Features: Groups (Fields) with Auto-Magnet, Named Links, Arrow Connections, Tooltips
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
    #mm-line-style-select { width: 100px; }

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
        background-color: #111; 
        position: relative;
        overflow: hidden;
        cursor: grab;
        background-image: none; 
        font-family: 'Signika', sans-serif;
    }
    
    .mindmap-container.show-grid {
        background-image: radial-gradient(#333 1px, transparent 1px);
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

    /* --- Groups (Fields) Layer --- */
    .groups-layer {
        position: absolute;
        top: 0; left: 0; width: 100%; height: 100%;
        z-index: 1; 
        pointer-events: none;
    }

    .mindmap-group {
        position: absolute;
        pointer-events: auto;
        border: 2px solid; 
        border-radius: 8px;
        box-sizing: border-box;
        transition: box-shadow 0.2s, border-radius 0.2s, background 0.2s;
    }
    
    /* Beautiful Collapsed Group (Pill Shape) */
    .mindmap-group.collapsed {
        height: 40px !important;
        border-radius: 20px !important;
        background: var(--group-bg-color) !important;
        border-color: var(--group-color) !important;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 10px rgba(0,0,0,0.5);
    }
    .mindmap-group.collapsed .group-resize { display: none !important; }
    .mindmap-group.collapsed .group-handle { display: none !important; }
    
    .mindmap-group .group-header {
        position: absolute;
        top: -26px;
        left: 0;
        display: flex;
        align-items: center;
        gap: 5px;
        pointer-events: auto;
        cursor: pointer;
        padding: 0 5px;
        background: rgba(0,0,0,0.5);
        border-top-left-radius: 8px;
        border-top-right-radius: 8px;
        height: 26px;
    }

    /* Collapsed Header Adjustments */
    .mindmap-group.collapsed .group-header {
        position: relative;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: transparent;
        border-radius: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 15px;
    }

    .mindmap-group .group-label {
        font-weight: bold;
        font-size: 16px;
        color: #eee;
        text-shadow: 0 2px 4px rgba(0,0,0,0.8);
        white-space: nowrap;
    }
    .mindmap-group.collapsed .group-label {
        margin: 0;
        flex: 1;
        text-align: center;
        font-size: 18px;
    }
    
    /* Toggle Buttons */
    .group-btn {
        color: #888;
        cursor: pointer;
        font-size: 14px;
        border-radius: 50%;
        width: 20px; height: 20px;
        display: flex; align-items: center; justify-content: center;
        transition: color 0.2s;
    }
    .group-btn:hover { color: #fff; }
    
    .mindmap-group.collapsed .group-collapse-toggle {
        position: absolute;
        left: 10px;
    }

    .mindmap-group .group-handle {
        position: absolute;
        top: 0; left: 0;
        width: 24px; height: 24px;
        background: rgba(0,0,0,0.5);
        color: #fff;
        display: flex; align-items: center; justify-content: center;
        border-bottom-right-radius: 8px;
        cursor: move;
        font-size: 12px;
        opacity: 0;
        transition: opacity 0.2s;
    }
    .mindmap-group:not(.collapsed):hover .group-handle { opacity: 1; }

    .mindmap-group .group-resize {
        position: absolute;
        bottom: 0; right: 0;
        width: 16px; height: 16px;
        background: rgba(0,0,0,0.3);
        cursor: nwse-resize;
        border-top-left-radius: 8px;
        opacity: 0;
        transition: opacity 0.2s;
    }
    .mindmap-group:hover .group-resize { opacity: 1; }
    
    /* --- Nodes (Generic) --- */
    .mindmap-node {
        position: absolute;
        border: 1px solid #555;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.8);
        cursor: pointer;
        user-select: none;
        z-index: 10;
        display: flex;
        flex-direction: column;
        font-size: 14px;
        transition: box-shadow 0.2s, transform 0.1s;
        pointer-events: auto;
        background: #2b2b2b; 
        color: #eee;
        width: max-content;
        min-width: 160px;
        max-width: 260px;
        height: auto;
    }
    .mindmap-node.hidden {
        display: none !important;
    }
    .mindmap-node:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 15px rgba(0,0,0,0.9);
        z-index: 105; 
        border-color: #888;
    }
    .mindmap-node.selected {
        box-shadow: 0 0 0 2px #ff6400, 0 6px 15px rgba(0,0,0,0.9);
        z-index: 110;
    }

    /* --- Node Content Wrapper --- */
    .node-main-content {
        display: flex;
        align-items: stretch;
        min-height: 50px;
        width: 100%;
        overflow: hidden;
    }
    
    /* --- Card Node --- */
    .mindmap-node.node-card .node-main-content img {
        border: none;
        border-right: 1px solid rgba(255,255,255,0.1);
        width: 50px;
        object-fit: cover;
        background: rgba(0,0,0,0.2);
        border-radius: 0;
        flex-shrink: 0;
        user-drag: none; 
        -webkit-user-drag: none;
    }
    .mindmap-node.node-card .node-main-content img[draggable="true"] {
        cursor: grab;
        pointer-events: auto;
        user-drag: element;
        -webkit-user-drag: element;
    }

    .mindmap-node.node-card .node-main-content span {
        padding: 8px 12px;
        display: flex;
        align-items: center;
        white-space: normal;
        word-break: break-word;
        overflow: hidden;
        flex: 1;
        line-height: 1.2;
        font-weight: bold;
    }

    /* --- Comment Section --- */
    .node-comment {
        border-top: 1px solid rgba(255,255,255,0.1);
        padding: 4px 8px;
        font-size: 0.85em;
        color: #ccc;
        background: rgba(0,0,0,0.2);
        word-wrap: break-word;
        white-space: normal;
    }
    .comment-link {
        display: inline-block;
        margin-top: 2px;
        color: #66ccff;
        text-decoration: none;
        border-bottom: 1px dotted #66ccff;
        cursor: pointer;
    }
    .comment-link:hover {
        color: #fff;
        border-bottom-style: solid;
    }

    /* --- Text Node --- */
    .mindmap-node.node-text {
        background: transparent;
        border: 1px dashed rgba(255,255,255,0.2);
        padding: 0;
        min-width: 50px;
        width: max-content;
        box-shadow: none;
    }
    .mindmap-node.node-text .node-main-content {
        padding: 5px 10px;
        min-height: auto;
        justify-content: center;
        text-align: center;
    }
    .mindmap-node.node-text:hover {
        border-color: #fff;
        background: rgba(0,0,0,0.5);
    }
    .mindmap-node.node-text.selected {
        border: 1px solid #ff6400;
        background: rgba(0,0,0,0.3);
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
        z-index: 100; 
    }

    .connection-handle:not(.has-text) {
        width: 14px; height: 14px;
        background: rgba(255, 255, 255, 0.3);
        border: 1px solid rgba(200, 200, 200, 0.8);
        border-radius: 50%; 
    }
    .mindmap-container.show-anchors .connection-handle {
         background: #ff6400;
         border-color: #fff;
         transform: translate(-50%, -50%) scale(1.2);
    }
    .connection-handle:not(.has-text):hover {
        background: rgba(255, 255, 255, 0.9);
        border-color: #ff6400;
        box-shadow: 0 0 5px rgba(0,0,0,0.5);
        transform: translate(-50%, -50%) scale(1.3);
        z-index: 101;
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
        z-index: 101;
        transform: translate(-50%, -50%) scale(1.05);
    }

    .selection-lasso {
        position: absolute;
        border: 1px dashed #00aaff;
        background: rgba(0, 170, 255, 0.15);
        pointer-events: none;
        z-index: 100;
        display: none;
    }

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

    .mm-dialog-content { display: flex; flex-direction: column; gap: 10px; padding: 10px; }
    .mm-dialog-row { display: flex; align-items: center; gap: 10px; }
    .mm-dialog-row label { flex: 0 0 110px; font-weight: bold; }
    .mm-dialog-row input, .mm-dialog-row select, .mm-dialog-row textarea { flex: 1; }
    .mm-dialog-row input[type="checkbox"] { flex: 0 0 auto; width: 18px; height: 18px; }
    .drop-zone { border: 2px dashed #555; padding: 10px; text-align: center; color: #888; margin-top: 5px; cursor: pointer; transition: border-color 0.2s; }
    .drop-zone.drag-hover { border-color: #ff6400; color: #eee; }
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
        maps[id] = { id, name, nodes: [], connections: [], groups: [] };
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
    constructor(mapId, options={}) {
        super(options);
        this.mapId = mapId;
        
        if (options.mapData) {
            this.mapData = options.mapData;
        } else {
            this._loadMapData();
        }
        
        this.draggingNodes = new Set(); 
        this.connectingSource = null; 
        this.dragOffsets = {}; 
        this.selectedNodeIds = new Set(); 
        this.isDraggingNode = false;
        
        this.draggingGroup = null;
        this.resizingGroup = null;
        this.groupDragStart = { x: 0, y: 0 };
        this.groupResizeStart = { w: 0, h: 0, x: 0, y: 0 };
        this.draggingGroupNodes = []; 

        this.defaultLineStyle = 'curve'; 
        
        this.zoom = 1;
        this.pan = { x: 0, y: 0 };
        this.isPanning = false;
        this.rmbStartNode = null;
        this.rmbStartPos = {x:0,y:0};
        
        this.isSelecting = false;
        this.selectionStart = { x: 0, y: 0 };
        this.selectionRect = { x: 0, y: 0, w: 0, h: 0 };

        this._handlers = {};
    }

    _loadMapData() {
        const maps = MindMapData.getMaps();
        if (maps[this.mapId]) {
            this.mapData = maps[this.mapId];
            MindMapData.setLastMapId(this.mapId);
        } else {
            const keys = Object.keys(maps);
            if (keys.length > 0) {
                this.mapId = keys[keys.length - 1];
                this.mapData = maps[this.mapId];
            } else {
                this.mapId = null;
                this.mapData = null;
            }
        }
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "mindmap-editor",
            title: game.i18n.localize("SIMPLE_MINDMAP.WINDOW_TITLE"),
            width: 1000,
            height: 700,
            resizable: true,
            popOut: true,
            classes: ["mindmap-window"]
        });
    }

    get title() { 
        const titlePart = game.i18n.localize("SIMPLE_MINDMAP.WINDOW_TITLE");
        const mapNamePart = this.mapData ? this.mapData.name : game.i18n.localize("SIMPLE_MINDMAP.SELECT_MAP");
        return `${titlePart}: ${mapNamePart}`;
    }

    async _renderInner(...args) {
        const maps = MindMapData.getMaps();
        let optionsHtml = "";
        
        if (Object.keys(maps).length === 0) {
            optionsHtml = `<option value="" disabled selected>${game.i18n.localize("SIMPLE_MINDMAP.NO_MAPS")}</option>`;
        } else {
            for (const [id, map] of Object.entries(maps)) {
                const selected = id === this.mapId ? "selected" : "";
                optionsHtml += `<option value="${id}" ${selected}>${map.name}</option>`;
            }
        }

        const htmlContent = `
        <div class="mm-wrapper">
            <div class="mm-toolbar">
                <select id="mm-map-selector" title="${game.i18n.localize("SIMPLE_MINDMAP.TOOLBAR_SELECT_MAP")}">${optionsHtml}</select>
                
                <div style="width: 1px; height: 16px; background: #555; margin: 0 5px;"></div>
                
                <select id="mm-line-style-select" title="${game.i18n.localize("SIMPLE_MINDMAP.TOOLBAR_LINE_STYLE")}">
                    <option value="curve" ${this.defaultLineStyle === 'curve' ? 'selected' : ''}>${game.i18n.localize("SIMPLE_MINDMAP.LINE_STYLE_CURVE")}</option>
                    <option value="straight" ${this.defaultLineStyle === 'straight' ? 'selected' : ''}>${game.i18n.localize("SIMPLE_MINDMAP.LINE_STYLE_STRAIGHT")}</option>
                    <option value="orthogonal" ${this.defaultLineStyle === 'orthogonal' ? 'selected' : ''}>${game.i18n.localize("SIMPLE_MINDMAP.LINE_STYLE_ORTHOGONAL")}</option>
                </select>
                
                <div style="width: 1px; height: 16px; background: #555; margin: 0 5px;"></div>
                
                <button class="mm-toolbar-btn" id="mm-add-group" title="Add Group Field"><i class="fas fa-vector-square"></i></button>
                <button class="mm-toolbar-btn" id="mm-add-text" title="${game.i18n.localize("SIMPLE_MINDMAP.TOOLBAR_ADD_TEXT")}"><i class="fas fa-font"></i></button>
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
                    <div class="groups-layer"></div>
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
        this.groupsLayer = this.container.find('.groups-layer');
        this.nodesLayer = this.container.find('.nodes-layer');
        this.connectionLayer = this.container.find('.connection-nodes-layer');
        this.svgLayer = this.container.find('.mindmap-svg-layer')[0]; 
        this.lasso = html.find('#mm-lasso');
        
        if (this.mapData) {
            this._renderGraph();
            this._updateTransform();
        }

        html.find('#mm-map-selector').change((e) => this._switchMap(e.target.value));
        html.find('#mm-line-style-select').change((e) => { this.defaultLineStyle = e.target.value; });
        html.find('#mm-new').click(() => this._createMapDialog());
        html.find('#mm-rename').click(() => this._renameMapDialog());
        html.find('#mm-delete').click(() => this._deleteMapDialog());
        html.find('#mm-add-link').click(() => this._addMapLinkDialog());
        html.find('#mm-add-text').click(() => this._addTextNodeDialog());
        html.find('#mm-add-group').click(() => this._addGroup());
        html.find('#refresh-map').click(() => {
            this.zoom = 1; this.pan = { x: 0, y: 0 };
            this._updateTransform();
        });
        
        const dropEl = this.container[0]; 
        if (dropEl) {
            dropEl.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; });
            dropEl.addEventListener('drop', this._onDropEntity.bind(this));
        }

        this.container.on('dragstart', '.mindmap-node img', this._onExternalDragStart.bind(this));
        this.container.on('wheel', this._onWheel.bind(this));
        this.container.on('contextmenu', (e) => e.preventDefault());
        this.container.on('mousedown', this._onContainerMouseDown.bind(this));
        this.container.on('mousedown', '.mindmap-node', this._onNodeMouseDown.bind(this));
        
        this.container.on('click', '.comment-link', this._onCommentLinkClick.bind(this));
        
        // Group interactions
        this.container.on('click', '.group-collapse-toggle', this._onGroupCollapseToggle.bind(this));
        // Use both header and handle for dragging, makes it much more convenient
        this.container.on('mousedown', '.group-header, .group-handle', this._onGroupHandleMouseDown.bind(this));
        this.container.on('mousedown', '.group-resize', this._onGroupResizeMouseDown.bind(this));
        
        this.container.on('dblclick', '.mindmap-node', (e) => {
            e.preventDefault(); e.stopPropagation();
            this._onNodeDblClick(e, $(e.currentTarget));
        });

        this.container.on('dblclick', '.connection-handle', (e) => {
            e.preventDefault(); e.stopPropagation();
            this._onConnectionDblClick(e, $(e.currentTarget));
        });

        // Easily trigger double click edit from group header
        this.container.on('dblclick', '.group-header', (e) => {
            e.preventDefault(); e.stopPropagation();
            this._onGroupDblClick(e, $(e.currentTarget));
        });

        this.container.on('mousedown', '.connection-handle', this._onConnectionMouseDown.bind(this));

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
            title: game.i18n.localize("SIMPLE_MINDMAP.DIALOG_NEW_MAP_TITLE"),
            content: `<form><div class="form-group"><label>${game.i18n.localize("SIMPLE_MINDMAP.LABEL_NAME")}</label><input type="text" name="name" autofocus></div></form>`,
            buttons: {
                ok: {
                    label: game.i18n.localize("SIMPLE_MINDMAP.BUTTON_CREATE"),
                    icon: '<i class="fas fa-check"></i>',
                    callback: async (html) => {
                        const name = html.find('[name="name"]').val();
                        if (name) {
                            const id = await MindMapData.createMap(name);
                            this._switchMap(id);
                        }
                    }
                }
            }, default: "ok"
        }).render(true);
    }

    _renameMapDialog() { 
        if (!this.mapData) return;
        new Dialog({
            title: game.i18n.localize("SIMPLE_MINDMAP.DIALOG_RENAME_MAP_TITLE"),
            content: `<form><div class="form-group"><label>${game.i18n.localize("SIMPLE_MINDMAP.LABEL_NEW_NAME")}</label><input type="text" name="name" value="${this.mapData.name}" autofocus></div></form>`,
            buttons: {
                ok: {
                    label: game.i18n.localize("SIMPLE_MINDMAP.BUTTON_SAVE"),
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
        const content = game.i18n.format("SIMPLE_MINDMAP.CONFIRM_DELETE", { mapName: this.mapData.name });
        Dialog.confirm({
            title: game.i18n.localize("SIMPLE_MINDMAP.DIALOG_DELETE_MAP_TITLE"),
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
            ui.notifications.warn(game.i18n.localize("SIMPLE_MINDMAP.NOTIFICATION_NO_OTHER_MAPS"));
            return;
        }

        new Dialog({
            title: game.i18n.localize("SIMPLE_MINDMAP.DIALOG_ADD_LINK_TITLE"),
            content: `<div class="mm-dialog-content"><div class="mm-dialog-row"><label>${game.i18n.localize("SIMPLE_MINDMAP.LABEL_MAP")}</label><select id="link-map-select">${options}</select></div></div>`,
            buttons: {
                add: {
                    label: game.i18n.localize("SIMPLE_MINDMAP.BUTTON_ADD"),
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
                                nodeType: 'card',
                                docType: 'Map', 
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
            }, default: "add"
        }).render(true);
    }

    _addTextNodeDialog() {
        if (!this.mapData) return;
        const centerX = (this.container.width() / 2 - this.pan.x) / this.zoom;
        const centerY = (this.container.height() / 2 - this.pan.y) / this.zoom;
        
        if (!this.mapData.nodes) this.mapData.nodes = [];
        this.mapData.nodes.push({
            id: foundry.utils.randomID(),
            nodeType: 'text',
            name: "New Text",
            x: centerX, y: centerY,
            style: {
                fontSize: 16,
                fontFamily: 'Signika',
                color: '#ffffff'
            }
        });
        this._renderGraph();
        MindMapData.updateMap(this.mapId, this.mapData);
    }

    _addGroup() {
        if (!this.mapData) return;
        const centerX = (this.container.width() / 2 - this.pan.x) / this.zoom;
        const centerY = (this.container.height() / 2 - this.pan.y) / this.zoom;

        if (!this.mapData.groups) this.mapData.groups = [];
        this.mapData.groups.push({
            id: foundry.utils.randomID(),
            name: "New Field",
            x: centerX - 100, y: centerY - 100,
            width: 200, height: 200,
            color: "#333333",
            alpha: 0.5,
            collapsed: false
        });
        this._renderGraph();
        MindMapData.updateMap(this.mapId, this.mapData);
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
            ui.notifications.warn(game.i18n.localize("SIMPLE_MINDMAP.NOTIFICATION_CREATE_FIRST"));
            return;
        }
        try {
            let data;
            const transferEvent = e.dataTransfer || e.originalEvent?.dataTransfer;
            try { data = JSON.parse(transferEvent.getData('text/plain')); } catch (err) { return; }
            let doc;
            if (data.uuid) doc = await fromUuid(data.uuid);
            else if (data.type === "Actor") doc = game.actors.get(data.id);
            else if (data.type === "Item") doc = game.items.get(data.id);
            else if (data.type === "JournalEntry") doc = game.journal.get(data.id);
            else if (data.type === "Scene") doc = game.scenes.get(data.id);
            else if (data.type === "Macro") doc = game.macros.get(data.id);
            
            if (!doc) return ui.notifications.warn(game.i18n.localize("SIMPLE_MINDMAP.NOTIFICATION_UNKNOWN_DOC"));

            const img = (doc.documentName === "Scene" ? (doc.thumb || doc.img) : (doc.img || doc.texture?.src)) || "icons/svg/book.svg";
            const coords = this._getCanvasCoords(e);
            if (!this.mapData.nodes) this.mapData.nodes = [];
            
            this.mapData.nodes.push({
                id: foundry.utils.randomID(),
                nodeType: 'card',
                docType: doc.documentName || 'Default', 
                uuid: doc.uuid,
                name: doc.name,
                img,
                x: coords.x - 75, y: coords.y - 25,
            });
            this._renderGraph(); 
            await MindMapData.updateMap(this.mapId, this.mapData); 
        } catch (err) { console.error(err); }
    }

    _onExternalDragStart(e) {
        const img = $(e.currentTarget);
        const nodeEl = img.closest('.mindmap-node');
        const nodeId = nodeEl.data('id');
        const node = this.mapData.nodes.find(n => n.id === nodeId);

        if (!node || !node.uuid) {
            e.preventDefault();
            return;
        }

        let type = node.docType; 
        if (!type || type === 'Default') {
            if (node.uuid.includes("Actor")) type = "Actor";
            else if (node.uuid.includes("Item")) type = "Item";
            else if (node.uuid.includes("JournalEntry")) type = "JournalEntry";
            else if (node.uuid.includes("Scene")) type = "Scene";
            else if (node.uuid.includes("Macro")) type = "Macro";
            else if (node.uuid.includes("RollTable")) type = "RollTable";
        }

        const dragData = { type: type, uuid: node.uuid };
        const transferEvent = e.originalEvent?.dataTransfer || e.dataTransfer;
        transferEvent.setData("text/plain", JSON.stringify(dragData));
        e.stopPropagation();

        img.one('dragend', () => {
            this.selectedNodeIds.delete(nodeId);
            this._renderSelection();
        });
    }

    /* --- Rendering --- */

    _renderGraph() {
        if (!this.svgLayer || !this.nodesLayer) return;
        while (this.svgLayer.firstChild) this.svgLayer.removeChild(this.svgLayer.firstChild);
        this.nodesLayer.empty();
        this.connectionLayer.empty();
        this.groupsLayer.empty();

        if (!this.mapData) return;

        // Ensure SVGLayer has defs for arrows
        let defs = this.svgLayer.querySelector('defs');
        if (!defs) {
            defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            this.svgLayer.appendChild(defs);
        }

        const hiddenNodes = new Set();
        const hiddenNodeToGroup = new Map();

        // 0. Render Groups & Find hidden nodes from collapsed groups
        (this.mapData.groups || []).forEach(group => {
            const color = group.color || "#333333";
            const alpha = group.alpha !== undefined ? group.alpha : 0.5;
            
            let r=0, g=0, b=0;
            if (color.length === 4) {
                r = parseInt(color[1] + color[1], 16);
                g = parseInt(color[2] + color[2], 16);
                b = parseInt(color[3] + color[3], 16);
            } else if (color.length === 7) {
                r = parseInt(color.substring(1, 3), 16);
                g = parseInt(color.substring(3, 5), 16);
                b = parseInt(color.substring(5, 7), 16);
            }
            const rgba = `rgba(${r},${g},${b},${alpha})`;
            const isCollapsed = group.collapsed === true;

            if (isCollapsed) {
                (this.mapData.nodes || []).forEach(n => {
                    const cx = n.x + 80; 
                    const cy = n.y + 25;
                    // Check bounds based on FULL group dimensions to trap nodes inside
                    if (cx >= group.x && cx <= group.x + group.width && cy >= group.y && cy <= group.y + group.height) {
                        hiddenNodes.add(n.id);
                        hiddenNodeToGroup.set(n.id, group.id);
                    }
                });
            }
            
            const el = $(`
                <div class="mindmap-group ${isCollapsed ? 'collapsed' : ''}" data-id="${group.id}" 
                     style="--group-color: ${color}; --group-bg-color: ${rgba}; left: ${group.x}px; top: ${group.y}px; width: ${group.width}px; height: ${group.height}px; border-color: ${color}; background: ${rgba};">
                     <div class="group-header">
                        <div class="group-btn group-collapse-toggle" title="Collapse/Expand">
                            <i class="fas ${isCollapsed ? 'fa-chevron-down' : 'fa-chevron-up'}"></i>
                        </div>
                        <div class="group-label">${group.name}</div>
                     </div>
                     <div class="group-handle"><i class="fas fa-arrows-alt"></i></div>
                     <div class="group-resize"></div>
                </div>
            `);
            this.groupsLayer.append(el);
        });

        // 1. Render Nodes
        (this.mapData.nodes || []).forEach(node => {
            const isHidden = hiddenNodes.has(node.id);
            const selected = this.selectedNodeIds.has(node.id) ? "selected" : "";
            let el;
            
            if (node.nodeType === 'text') {
                const style = node.style || { fontSize: 16, color: '#ffffff', fontFamily: 'Signika' };
                el = $(`<div class="mindmap-node node-text ${selected} ${isHidden ? 'hidden' : ''}" data-id="${node.id}" 
                        style="left: ${node.x}px; top: ${node.y}px; font-size: ${style.fontSize}px; color: ${style.color}; font-family: ${style.fontFamily}">
                        <div class="node-main-content">${node.name}</div>
                    </div>`);
            } else {
                const bgColorStyle = node.backgroundColor ? `background-color: ${node.backgroundColor};` : '';
                
                let commentHtml = '';
                let linkHtml = '';
                if (node.commentLink) {
                    const linkText = node.commentLinkName || "Open Link";
                    linkHtml = `<a class="comment-link" data-uuid="${node.commentLink}"><i class="fas fa-external-link-alt"></i> ${linkText}</a>`;
                }

                if (node.showTooltip && node.comment) {
                    if (linkHtml) commentHtml = `<div class="node-comment">${linkHtml}</div>`;
                } else if (node.comment || node.commentLink) {
                    commentHtml = `<div class="node-comment">${node.comment || ''}${node.comment && linkHtml ? '<br>' : ''}${linkHtml}</div>`;
                }

                const isDraggable = !!node.uuid;

                el = $(`
                    <div class="mindmap-node node-card ${selected} ${isHidden ? 'hidden' : ''}" data-id="${node.id}" style="left: ${node.x}px; top: ${node.y}px; ${bgColorStyle}">
                        <div class="node-main-content">
                            <img src="${node.img}" draggable="${isDraggable}">
                            <span>${node.name}</span>
                        </div>
                        ${commentHtml}
                    </div>
                `);

                if (node.showTooltip && node.comment) {
                    el.attr('data-tooltip', node.comment);
                }
            }
            
            this.nodesLayer.append(el);
        });

        // 2. Render Connections
        (this.mapData.connections || []).forEach(c => {
            let fromId = hiddenNodeToGroup.has(c.from) ? hiddenNodeToGroup.get(c.from) : c.from;
            let toId = hiddenNodeToGroup.has(c.to) ? hiddenNodeToGroup.get(c.to) : c.to;

            // If a connection connects two elements inside the same collapsed group, it stays hidden
            if (fromId === toId) return;

            const srcBounds = this._getEntityBounds(fromId);
            const dstBounds = this._getEntityBounds(toId);

            const validSrc = this.mapData.nodes.some(n=>n.id===fromId) || this.mapData.groups.some(g=>g.id===fromId) || this.mapData.connections.some(x=>x.id===fromId);
            const validDst = this.mapData.nodes.some(n=>n.id===toId) || this.mapData.groups.some(g=>g.id===toId) || this.mapData.connections.some(x=>x.id===toId);

            if (validSrc && validDst) {
                 this._drawConnection(srcBounds, dstBounds, c);
            }
        });
    }
    
    _renderSelection() {
        this.nodesLayer.find('.mindmap-node').removeClass('selected');
        this.selectedNodeIds.forEach(id => {
            this.nodesLayer.find(`.mindmap-node[data-id="${id}"]`).addClass('selected');
        });
    }

    _getEntityBounds(id, visited = new Set()) {
        if (visited.has(id)) return {x:0, y:0, w:0, h:0};
        visited.add(id);

        const node = this.mapData.nodes.find(n => n.id === id);
        if (node) {
            const el = this.nodesLayer.find(`[data-id="${node.id}"]`);
            if (el.length && !el.hasClass('hidden')) {
                return {
                    x: node.x,
                    y: node.y,
                    w: el.outerWidth(),
                    h: el.outerHeight()
                };
            }
            if (node.nodeType === 'text') return { x: node.x, y: node.y, w: 100, h: 30 };
            return { x: node.x, y: node.y, w: 160, h: 50 };
        }

        const group = (this.mapData.groups || []).find(g => g.id === id);
        if (group) {
            // Строгие математические рамки, чтобы избежать багов с DOM-ренденрингом (высота свернутого поля = 40)
            return { 
                x: group.x, 
                y: group.y, 
                w: group.width, 
                h: group.collapsed ? 40 : group.height 
            };
        }

        const conn = this.mapData.connections.find(c => c.id === id);
        if (conn) {
            const srcBounds = this._getEntityBounds(conn.from, visited);
            const dstBounds = this._getEntityBounds(conn.to, visited);
            
            const x1 = srcBounds.x + srcBounds.w/2, y1 = srcBounds.y + srcBounds.h/2;
            const x2 = dstBounds.x + dstBounds.w/2, y2 = dstBounds.y + dstBounds.h/2;
            
            let posx = (x1 + x2) / 2, posy = (y1 + y2) / 2;
            if (conn.style === 'curve') {
                 const t = 0.5;
                 posx = Math.pow(1-t,3)*x1 + 3*Math.pow(1-t,2)*t*posx + 3*(1-t)*Math.pow(t,2)*posx + Math.pow(t,3)*x2;
                 posy = Math.pow(1-t,3)*y1 + 3*Math.pow(1-t,2)*t*y1 + 3*(1-t)*Math.pow(t,2)*y2 + Math.pow(t,3)*y2;
            }
            return { x: posx, y: posy, w: 14, h: 14 }; 
        }
        
        return {x:0, y:0, w:0, h:0};
    }

    _getEdgePoint(sourcePoint, targetRect) {
        const cx = targetRect.x + targetRect.w / 2;
        const cy = targetRect.y + targetRect.h / 2;
        if (targetRect.w === 0 && targetRect.h === 0) return { x: cx, y: cy };

        const dx = sourcePoint.x - cx;
        const dy = sourcePoint.y - cy;
        if (dx === 0 && dy === 0) return { x: cx, y: cy };

        const hw = targetRect.w / 2;
        const hh = targetRect.h / 2;

        let scaleX = hw / Math.abs(dx || 0.001);
        let scaleY = hh / Math.abs(dy || 0.001);
        let scale = Math.min(scaleX, scaleY);

        return {
            x: cx + dx * scale,
            y: cy + dy * scale
        };
    }

    _drawConnection(boundsA, boundsB, connData, isTemp = false) {
        const cx1 = boundsA.x + boundsA.w/2;
        const cy1 = boundsA.y + boundsA.h/2;
        const cx2 = boundsB.x + boundsB.w/2;
        const cy2 = boundsB.y + boundsB.h/2;

        const p1 = this._getEdgePoint({x: cx2, y: cy2}, boundsA);
        const p2 = this._getEdgePoint({x: cx1, y: cy1}, boundsB);

        const x1 = p1.x, y1 = p1.y;
        const x2 = p2.x, y2 = p2.y;
        
        const midX = (cx1 + cx2) / 2; 
        
        const color = connData.color || "#aaaaaa";
        const style = connData.style || 'curve'; 
        const strokeType = connData.strokeType || 'solid';

        let pathD = "";
        let posx = 0, posy = 0;

        if (style === 'straight') {
            pathD = `M ${x1} ${y1} L ${x2} ${y2}`;
            posx = (x1 + x2) / 2; 
            posy = (y1 + y2) / 2;
        } else if (style === 'orthogonal') {
            pathD = `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
            posx = midX; 
            posy = (y1 + y2) / 2;
        } else {
            pathD = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
            const t = 0.5;
            posx = Math.pow(1-t,3)*x1 + 3*Math.pow(1-t,2)*t*midX + 3*(1-t)*Math.pow(t,2)*midX + Math.pow(t,3)*x2;
            posy = Math.pow(1-t,3)*y1 + 3*Math.pow(1-t,2)*t*y1 + 3*(1-t)*Math.pow(t,2)*y2 + Math.pow(t,3)*y2;
        }

        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathD);
        path.setAttribute('stroke', color);
        path.setAttribute('stroke-width', '2');
        path.setAttribute('fill', 'none');
        
        if (strokeType === 'dashed') path.setAttribute('stroke-dasharray', '8,4');
        else if (strokeType === 'dotted') path.setAttribute('stroke-dasharray', '2,4');
        
        if (connData.arrow && !isTemp) {
            let defs = this.svgLayer.querySelector('defs');
            const markerId = `arrow-${color.replace('#', '')}`;
            if (defs && !defs.querySelector(`#${markerId}`)) {
                const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
                marker.setAttribute('id', markerId);
                marker.setAttribute('viewBox', '0 0 10 10');
                marker.setAttribute('refX', '10');
                marker.setAttribute('refY', '5');
                marker.setAttribute('markerWidth', '6');
                marker.setAttribute('markerHeight', '6');
                marker.setAttribute('orient', 'auto-start-reverse');
                const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                p.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
                p.setAttribute('fill', color);
                marker.appendChild(p);
                defs.appendChild(marker);
            }
            path.setAttribute('marker-end', `url(#${markerId})`);
        }

        if (isTemp) {
            path.setAttribute('stroke-dasharray', '5,5');
            g.style.pointerEvents = "none";
        }
        
        g.appendChild(path);

        // Drawing anchors (dots) at boundary points
        const dot1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot1.setAttribute('cx', x1);
        dot1.setAttribute('cy', y1);
        dot1.setAttribute('r', '4');
        dot1.setAttribute('fill', color);
        g.appendChild(dot1);
        
        if (!connData.arrow || isTemp) {
            const dot2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            dot2.setAttribute('cx', x2);
            dot2.setAttribute('cy', y2);
            dot2.setAttribute('r', '4');
            dot2.setAttribute('fill', color);
            g.appendChild(dot2);
        }

        this.svgLayer.appendChild(g);

        if (!isTemp) {
            const hasText = !!connData.text;
            const handle = $(`<div class="connection-handle ${hasText ? 'has-text' : ''}" data-id="${connData.id}"></div>`);
            handle.css({ left: posx, top: posy });
            if (hasText) handle.text(connData.text);
            this.connectionLayer.append(handle);
        }

        return g;
    }

    /* --- Interaction Events --- */

    _onNodeMouseDown(e) {
        e.stopPropagation(); 
        const el = $(e.currentTarget);
        const id = el.data('id');
        
        this.isDraggingNode = false;

        if (e.button === 2) {
            this.rmbStartNode = id;
            this.rmbStartPos = { x: e.clientX, y: e.clientY };
            return this._onContainerMouseDown(e);
        }

        const node = this.mapData.nodes.find(n => n.id === id);
        const pos = this._getCanvasCoords(e);

        if (e.shiftKey) {
            this.connectingSource = id;
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

        if (e.target.tagName === 'IMG' && node.uuid) return;

        this.draggingNodes = new Set(this.selectedNodeIds);
        this.dragOffsets = {};
        this.draggingNodes.forEach(nodeId => {
            const n = this.mapData.nodes.find(x => x.id === nodeId);
            if (n) this.dragOffsets[nodeId] = { x: pos.x - n.x, y: pos.y - n.y };
        });
    }

    _onConnectionMouseDown(e) {
        if (e.shiftKey) {
             e.stopPropagation();
             e.preventDefault();
             const el = $(e.currentTarget);
             const id = el.data('id');
             this.connectingSource = id;
             this.tempLine = null;
             this.container.addClass('show-anchors');
        }
    }
    
    _onCommentLinkClick(e) {
        e.preventDefault();
        e.stopPropagation();
        const uuid = $(e.currentTarget).data('uuid');
        if (uuid) fromUuid(uuid).then(doc => {
            if (doc.documentName === "JournalEntry" || doc.documentName === "Item" || doc.documentName === "Actor") {
                doc.sheet.render(true, { editable: false });
            } else if (doc.documentName === "Scene") doc.view();
            else if (doc.sheet) doc.sheet.render(true, { editable: false });
        });
    }

    _onGroupCollapseToggle(e) {
        e.preventDefault();
        e.stopPropagation();
        const groupEl = $(e.currentTarget).closest('.mindmap-group');
        const groupId = groupEl.data('id');
        const group = this.mapData.groups.find(g => g.id === groupId);
        if (group) {
            group.collapsed = !group.collapsed; 
            MindMapData.updateMap(this.mapId, this.mapData);
            this._renderGraph();
        }
    }
    
    _onGroupHandleMouseDown(e) {
        if ($(e.target).closest('.group-btn').length) return; // Игнорируем клики по кнопкам управления полем

        e.stopPropagation();
        const groupEl = $(e.currentTarget).closest('.mindmap-group');
        const groupId = groupEl.data('id');
        const group = this.mapData.groups.find(g => g.id === groupId);
        if (!group) return;
        
        this.draggingGroup = group;
        const coords = this._getCanvasCoords(e);
        this.groupDragStart = coords;
        
        this.draggingGroupNodes = [];
        // Все объекты автоматически прилипают к полю, в котором находятся
        (this.mapData.nodes || []).forEach(node => {
            const center = { x: node.x + 80, y: node.y + 25 }; 
            if (center.x >= group.x && center.x <= group.x + group.width &&
                center.y >= group.y && center.y <= group.y + group.height) {
                this.draggingGroupNodes.push(node);
            }
        });
    }

    _onGroupResizeMouseDown(e) {
        e.stopPropagation();
        const groupEl = $(e.currentTarget).closest('.mindmap-group');
        if (groupEl.hasClass('collapsed')) return;
        const groupId = groupEl.data('id');
        const group = this.mapData.groups.find(g => g.id === groupId);
        if (!group) return;
        
        this.resizingGroup = group;
        const coords = this._getCanvasCoords(e);
        this.groupResizeStart = { w: group.width, h: group.height, x: coords.x, y: coords.y };
    }

    _onMouseMove(e) {
        if (!this.container?.length) return;
        
        if (this.isPanning) {
            this.pan.x += e.movementX;
            this.pan.y += e.movementY;
            return this._updateTransform();
        }
        
        const pos = this._getCanvasCoords(e);
        
        if (this.isSelecting) {
            const cur = this._getScreenCoords(e);
            const w = cur.x - this.selectionStart.x;
            const h = cur.y - this.selectionStart.y;
            this.selectionRect = { x: w < 0 ? cur.x : this.selectionStart.x, y: h < 0 ? cur.y : this.selectionStart.y, w: Math.abs(w), h: Math.abs(h) };
            this.lasso.css({ left: this.selectionRect.x, top: this.selectionRect.y, width: this.selectionRect.w, height: this.selectionRect.h });
            return;
        }
        
        if (this.draggingNodes.size > 0) {
            this.isDraggingNode = true; 
            this.draggingNodes.forEach(nodeId => {
                const n = this.mapData.nodes.find(x => x.id === nodeId);
                const offset = this.dragOffsets[nodeId];
                if (n && offset) {
                    n.x = pos.x - offset.x;
                    n.y = pos.y - offset.y;
                    const el = this.nodesLayer.find(`[data-id="${nodeId}"]`);
                    el.css({ left: n.x, top: n.y });
                }
            });
            this._rerenderLinesOnly();
        }
        
        if (this.draggingGroup) {
            const dx = pos.x - this.groupDragStart.x;
            const dy = pos.y - this.groupDragStart.y;
            
            this.draggingGroup.x += dx;
            this.draggingGroup.y += dy;
            this.groupDragStart = pos;
            
            const gEl = this.groupsLayer.find(`[data-id="${this.draggingGroup.id}"]`);
            gEl.css({ left: this.draggingGroup.x, top: this.draggingGroup.y });
            
            this.draggingGroupNodes.forEach(node => {
                node.x += dx;
                node.y += dy;
                const nEl = this.nodesLayer.find(`[data-id="${node.id}"]`);
                nEl.css({ left: node.x, top: node.y });
            });
            
            if (this.draggingGroupNodes.length > 0) this._rerenderLinesOnly();
        }
        
        if (this.resizingGroup) {
            const dx = pos.x - this.groupResizeStart.x;
            const dy = pos.y - this.groupResizeStart.y;
            
            this.resizingGroup.width = Math.max(50, this.groupResizeStart.w + dx);
            this.resizingGroup.height = Math.max(50, this.groupResizeStart.h + dy);
            
            const gEl = this.groupsLayer.find(`[data-id="${this.resizingGroup.id}"]`);
            gEl.css({ width: this.resizingGroup.width, height: this.resizingGroup.height });
        }

        if (this.connectingSource) {
            if (this.tempLine) this.tempLine.remove();
            const srcBounds = this._getEntityBounds(this.connectingSource);
            this.tempLine = this._drawConnection(srcBounds, {x: pos.x, y: pos.y, w:0, h:0}, {color: "#ff6400", style: this.defaultLineStyle}, true);
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
            if (this.isDraggingNode) {
                MindMapData.updateMap(this.mapId, this.mapData); 
                this._renderGraph(); 
            }
            this.isDraggingNode = false;
        }
        
        if (this.draggingGroup || this.resizingGroup) {
            this.draggingGroup = null;
            this.resizingGroup = null;
            this.draggingGroupNodes = [];
            MindMapData.updateMap(this.mapId, this.mapData); 
        }

        if (this.connectingSource) {
            this.container.removeClass('show-anchors'); 
            if (this.tempLine) this.tempLine.remove();
            
            const targetNode = $(document.elementFromPoint(e.clientX, e.clientY)).closest('.mindmap-node');
            const targetConn = $(document.elementFromPoint(e.clientX, e.clientY)).closest('.connection-handle');
            
            let tid = null;
            if (targetNode.length) tid = targetNode.data('id');
            else if (targetConn.length) tid = targetConn.data('id');
            
            if (tid && tid !== this.connectingSource) {
                if (!this.mapData.connections) this.mapData.connections = [];
                this.mapData.connections.push({ 
                    id: foundry.utils.randomID(),
                    from: this.connectingSource, 
                    to: tid, 
                    color: "#aaaaaa",
                    text: "",
                    style: this.defaultLineStyle,
                    strokeType: 'solid',
                    arrow: false
                });
                MindMapData.updateMap(this.mapId, this.mapData);
                this._renderGraph();
            }
            this.connectingSource = null;
        }
    }

    async _openNodeDocument(nodeId) {
        const node = this.mapData.nodes.find(n => n.id === nodeId);
        if (!node) return;
        if (node.type === 'map' && node.targetId) {
            const maps = MindMapData.getMaps();
            if (maps[node.targetId]) this._switchMap(node.targetId);
            else ui.notifications.warn(game.i18n.localize("SIMPLE_MINDMAP.NOTIFICATION_MAP_DELETED"));
            return;
        }
        if (node.nodeType === 'text') return;

        if (!node.uuid) return;
        try {
            const doc = await fromUuid(node.uuid);
            if (!doc) { 
                const content = game.i18n.format("SIMPLE_MINDMAP.NOTIFICATION_DOC_NOT_FOUND", { docName: node.name });
                ui.notifications.warn(content); 
                return; 
            }
            if (doc.documentName === "Macro") return doc.execute();
            if (doc.documentName === "Scene") return doc.view();
            if (doc.documentName === "JournalEntry" || doc.documentName === "Actor" || doc.documentName === "Item") {
                return doc.sheet.render(true, { editable: false });
            }
            if (doc.sheet) doc.sheet.render(true, { editable: false });
        } catch (err) { console.error("MindMap | Error opening doc:", err); }
    }

    _finalizeSelection() {
        const rect = this.selectionRect;
        if (rect.w < 2 && rect.h < 2) return;
        const nodes = this.container.find('.mindmap-node:not(.hidden)');
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
        
        let defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        this.svgLayer.appendChild(defs);

        const hiddenNodes = new Set();
        const hiddenNodeToGroup = new Map();

        (this.mapData.groups || []).forEach(g => {
            if (g.collapsed) {
                (this.mapData.nodes || []).forEach(n => {
                    const cx = n.x + 80; 
                    const cy = n.y + 25;
                    if (cx >= g.x && cx <= g.x + g.width && cy >= g.y && cy <= g.y + g.height) {
                        hiddenNodes.add(n.id);
                        hiddenNodeToGroup.set(n.id, g.id);
                    }
                });
            }
        });
        
        (this.mapData.connections || []).forEach(c => {
            let fromId = hiddenNodeToGroup.has(c.from) ? hiddenNodeToGroup.get(c.from) : c.from;
            let toId = hiddenNodeToGroup.has(c.to) ? hiddenNodeToGroup.get(c.to) : c.to;

            if (fromId === toId) return;

            const srcBounds = this._getEntityBounds(fromId);
            const dstBounds = this._getEntityBounds(toId);
            
            const validSrc = this.mapData.nodes.some(n=>n.id===fromId) || this.mapData.groups.some(g=>g.id===fromId) || this.mapData.connections.some(x=>x.id===fromId);
            const validDst = this.mapData.nodes.some(n=>n.id===toId) || this.mapData.groups.some(g=>g.id===toId) || this.mapData.connections.some(x=>x.id===toId);

            if (validSrc && validDst) {
                 this._drawConnection(srcBounds, dstBounds, c);
            }
        });
    }

    _onKeyDown(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        if (e.key === "Delete") {
            if (this.selectedNodeIds.size > 0) {
                const ids = Array.from(this.selectedNodeIds);
                this.mapData.nodes = this.mapData.nodes.filter(n => !this.selectedNodeIds.has(n.id));
                this.mapData.connections = (this.mapData.connections || []).filter(c => !ids.includes(c.from) && !ids.includes(c.to));
                
                let changed = true;
                while(changed) {
                    changed = false;
                    const validIds = new Set(this.mapData.nodes.map(n=>n.id));
                    const validConnIds = new Set(this.mapData.connections.map(c=>c.id));
                    const initLen = this.mapData.connections.length;
                    this.mapData.connections = this.mapData.connections.filter(c => 
                        (validIds.has(c.from) || validConnIds.has(c.from)) && 
                        (validIds.has(c.to) || validConnIds.has(c.to))
                    );
                    if (this.mapData.connections.length !== initLen) changed = true;
                }

                this.selectedNodeIds.clear();
                this._renderGraph();
                MindMapData.updateMap(this.mapId, this.mapData);
            }
        }
    }

    _onConnectionDblClick(e, target) {
        e.stopPropagation(); e.preventDefault();
        const connId = target.data('id');
        const connection = this.mapData.connections.find(c => c.id === connId);
        if (!connection) return;

        const currentStyle = connection.style || 'curve';
        const currentStroke = connection.strokeType || 'solid';
        const isArrow = connection.arrow === true;

        new Dialog({
            title: game.i18n.localize("SIMPLE_MINDMAP.DIALOG_CONN_EDIT_TITLE"),
            content: `<div class="mm-dialog-content">
                    <div class="mm-dialog-row"><label>${game.i18n.localize("SIMPLE_MINDMAP.LABEL_TEXT")}</label><input type="text" id="conn-text" value="${connection.text || ''}" placeholder="${game.i18n.localize("SIMPLE_MINDMAP.PLACEHOLDER_CAPTION")}"></div>
                    <div class="mm-dialog-row"><label>${game.i18n.localize("SIMPLE_MINDMAP.LABEL_COLOR")}</label><input type="color" id="conn-color" value="${connection.color || '#aaaaaa'}" style="height: 30px; padding: 0;"></div>
                    <div class="mm-dialog-row">
                        <label>${game.i18n.localize("SIMPLE_MINDMAP.LABEL_SHAPE")}</label>
                        <select id="conn-style">
                            <option value="curve" ${currentStyle === 'curve' ? 'selected' : ''}>${game.i18n.localize("SIMPLE_MINDMAP.LINE_STYLE_CURVE")}</option>
                            <option value="straight" ${currentStyle === 'straight' ? 'selected' : ''}>${game.i18n.localize("SIMPLE_MINDMAP.LINE_STYLE_STRAIGHT")}</option>
                            <option value="orthogonal" ${currentStyle === 'orthogonal' ? 'selected' : ''}>${game.i18n.localize("SIMPLE_MINDMAP.LINE_STYLE_ORTHOGONAL")}</option>
                        </select>
                    </div>
                    <div class="mm-dialog-row">
                        <label>${game.i18n.localize("SIMPLE_MINDMAP.LABEL_TYPE")}</label>
                        <select id="conn-stroke">
                            <option value="solid" ${currentStroke === 'solid' ? 'selected' : ''}>Solid</option>
                            <option value="dashed" ${currentStroke === 'dashed' ? 'selected' : ''}>Dashed</option>
                            <option value="dotted" ${currentStroke === 'dotted' ? 'selected' : ''}>Dotted</option>
                        </select>
                    </div>
                    <div class="mm-dialog-row">
                        <label>${game.i18n.localize("SIMPLE_MINDMAP.LABEL_ARROW")}</label>
                        <input type="checkbox" id="conn-arrow" ${isArrow ? 'checked' : ''}>
                    </div>
                </div>`,
            buttons: {
                save: {
                    label: game.i18n.localize("SIMPLE_MINDMAP.BUTTON_SAVE"),
                    icon: '<i class="fas fa-save"></i>',
                    callback: (html) => {
                        connection.text = html.find('#conn-text').val();
                        connection.color = html.find('#conn-color').val();
                        connection.style = html.find('#conn-style').val();
                        connection.strokeType = html.find('#conn-stroke').val();
                        connection.arrow = html.find('#conn-arrow').is(':checked');
                        MindMapData.updateMap(this.mapId, this.mapData);
                        this._renderGraph();
                    }
                },
                delete: {
                    label: game.i18n.localize("SIMPLE_MINDMAP.BUTTON_DELETE"),
                    icon: '<i class="fas fa-trash"></i>',
                    callback: () => {
                        this.mapData.connections = this.mapData.connections.filter(c => c.id !== connId);
                        MindMapData.updateMap(this.mapId, this.mapData);
                        this._renderGraph();
                    }
                }
            }, default: "save"
        }).render(true);
    }

    _onNodeDblClick(e, target) {
        e.stopPropagation(); e.preventDefault();
        const nodeId = target.data('id');
        const node = this.mapData.nodes.find(n => n.id === nodeId);
        if (!node) return;

        if (node.nodeType === 'text') {
            this._onTextNodeDblClick(e, target);
            return;
        }

        const comment = node.comment || "";
        const link = node.commentLink || "";
        const linkName = node.commentLinkName || "";
        const bgColor = node.backgroundColor || "#2b2b2b";
        const isTooltip = node.showTooltip === true;

        const dialogContent = `
            <div class="mm-dialog-content">
                <div class="mm-dialog-row">
                    <label>Name</label>
                    <input type="text" id="node-name" value="${node.name}">
                </div>
                <div class="mm-dialog-row">
                    <label>Background</label>
                    <input type="color" id="node-bg" value="${bgColor}">
                </div>
                <div class="mm-dialog-row" style="align-items: flex-start;">
                    <label>Comment</label>
                    <textarea id="node-comment" rows="3" style="resize:vertical;">${comment}</textarea>
                </div>
                <div class="mm-dialog-row">
                    <label>${game.i18n.localize("SIMPLE_MINDMAP.LABEL_TOOLTIP") || "Tooltip"}</label>
                    <input type="checkbox" id="node-tooltip" ${isTooltip ? 'checked' : ''}>
                </div>
                <div class="mm-dialog-row">
                    <label>Link (UUID)</label>
                    <input type="text" id="node-link" value="${link}" placeholder="Paste UUID here">
                    <input type="hidden" id="node-link-name" value="${linkName}">
                </div>
                <div class="drop-zone" id="drop-zone-link">
                    Drag & Drop Entity Here to Link
                </div>
            </div>
        `;

        const d = new Dialog({
            title: "Node Settings",
            content: dialogContent,
            buttons: {
                save: {
                    label: "Save",
                    icon: '<i class="fas fa-check"></i>',
                    callback: (html) => {
                        node.name = html.find('#node-name').val();
                        node.backgroundColor = html.find('#node-bg').val();
                        node.comment = html.find('#node-comment').val();
                        node.showTooltip = html.find('#node-tooltip').is(':checked');
                        node.commentLink = html.find('#node-link').val();
                        node.commentLinkName = html.find('#node-link-name').val();
                        
                        MindMapData.updateMap(this.mapId, this.mapData);
                        this._renderGraph();
                    }
                },
                delete: {
                    label: "Delete Node",
                    icon: '<i class="fas fa-trash"></i>',
                    callback: () => {
                        this.mapData.nodes = this.mapData.nodes.filter(n => n.id !== nodeId);
                        this.mapData.connections = this.mapData.connections.filter(c => c.from !== nodeId && c.to !== nodeId);
                        MindMapData.updateMap(this.mapId, this.mapData);
                        this._renderGraph();
                    }
                }
            },
            default: "save",
            render: (html) => {
                const dropZone = html.find('#drop-zone-link')[0];
                dropZone.addEventListener('dragenter', () => dropZone.classList.add('drag-hover'));
                dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-hover'));
                dropZone.addEventListener('dragover', (e) => e.preventDefault());
                dropZone.addEventListener('drop', async (ev) => {
                    ev.preventDefault();
                    dropZone.classList.remove('drag-hover');
                    try {
                        const transferEvent = ev.dataTransfer || ev.originalEvent?.dataTransfer;
                        const data = JSON.parse(transferEvent.getData('text/plain'));
                        if (data.uuid) {
                            html.find('#node-link').val(data.uuid);
                            const doc = await fromUuid(data.uuid);
                            if(doc) {
                                dropZone.innerText = `Linked: ${doc.name}`;
                                html.find('#node-link-name').val(doc.name);
                            }
                        }
                    } catch (e) { console.error(e); }
                });
            }
        }).render(true);
    }

    _onTextNodeDblClick(e, target) {
        const nodeId = target.data('id');
        const node = this.mapData.nodes.find(n => n.id === nodeId);
        const style = node.style || { fontSize: 16, fontFamily: 'Signika', color: '#ffffff' };

        new Dialog({
            title: "Edit Text Node",
            content: `
                <div class="mm-dialog-content">
                    <div class="mm-dialog-row"><label>Text</label><input type="text" id="text-content" value="${node.name}"></div>
                    <div class="mm-dialog-row"><label>Size (px)</label><input type="number" id="text-size" value="${style.fontSize}"></div>
                    <div class="mm-dialog-row"><label>Color</label><input type="color" id="text-color" value="${style.color}"></div>
                    <div class="mm-dialog-row"><label>Font</label>
                        <select id="text-font">
                            <option value="Signika" ${style.fontFamily === 'Signika' ? 'selected' : ''}>Signika</option>
                            <option value="Arial" ${style.fontFamily === 'Arial' ? 'selected' : ''}>Arial</option>
                            <option value="Courier New" ${style.fontFamily === 'Courier New' ? 'selected' : ''}>Courier New</option>
                            <option value="Times New Roman" ${style.fontFamily === 'Times New Roman' ? 'selected' : ''}>Times New Roman</option>
                            <option value="Modesto Condensed" ${style.fontFamily === 'Modesto Condensed' ? 'selected' : ''}>Modesto</option>
                        </select>
                    </div>
                </div>
            `,
            buttons: {
                save: {
                    label: "Save",
                    icon: '<i class="fas fa-check"></i>',
                    callback: (html) => {
                        node.name = html.find('#text-content').val();
                        node.style = {
                            fontSize: parseInt(html.find('#text-size').val()) || 16,
                            color: html.find('#text-color').val(),
                            fontFamily: html.find('#text-font').val()
                        };
                        MindMapData.updateMap(this.mapId, this.mapData);
                        this._renderGraph();
                    }
                },
                delete: {
                    label: "Delete",
                    icon: '<i class="fas fa-trash"></i>',
                    callback: () => {
                        this.mapData.nodes = this.mapData.nodes.filter(n => n.id !== nodeId);
                        MindMapData.updateMap(this.mapId, this.mapData);
                        this._renderGraph();
                    }
                }
            }, default: "save"
        }).render(true);
    }

    _onGroupDblClick(e, target) {
        const groupEl = target.closest('.mindmap-group');
        const groupId = groupEl.data('id');
        const group = this.mapData.groups.find(g => g.id === groupId);
        if (!group) return;

        new Dialog({
            title: "Edit Field",
            content: `
                <div class="mm-dialog-content">
                    <div class="mm-dialog-row"><label>Name</label><input type="text" id="group-name" value="${group.name}"></div>
                    <div class="mm-dialog-row"><label>Color</label><input type="color" id="group-color" value="${group.color}"></div>
                    <div class="mm-dialog-row"><label>Opacity</label><input type="number" id="group-alpha" value="${group.alpha}" min="0" max="1" step="0.1"></div>
                </div>
            `,
            buttons: {
                save: {
                    label: "Save",
                    icon: '<i class="fas fa-save"></i>',
                    callback: (html) => {
                        group.name = html.find('#group-name').val();
                        group.color = html.find('#group-color').val();
                        group.alpha = parseFloat(html.find('#group-alpha').val());
                        MindMapData.updateMap(this.mapId, this.mapData);
                        this._renderGraph();
                    }
                },
                delete: {
                    label: "Delete",
                    icon: '<i class="fas fa-trash"></i>',
                    callback: () => {
                        this.mapData.groups = this.mapData.groups.filter(g => g.id !== groupId);
                        MindMapData.updateMap(this.mapId, this.mapData);
                        this._renderGraph();
                    }
                }
            }, default: "save"
        }).render(true);
    }
}

/* -------------------------------------------- */
/* 3. Integration & App Launch                  */
/* -------------------------------------------- */

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
    
    game.settings.register(MODULE_ID, SETTING_KEY, { 
        name: game.i18n.localize("SIMPLE_MINDMAP.TITLE"), 
        scope: "world", 
        config: false, 
        type: Object, 
        default: {} 
    }); 
    
    game.settings.register(MODULE_ID, LAST_MAP_KEY, { 
        name: game.i18n.localize("SIMPLE_MINDMAP.LAST_MAP_ID_SETTING"), 
        scope: "client", 
        config: false, 
        type: String, 
        default: "" 
    });

    if (!$('#simple-mindmap-css').length) $('head').append(`<style id="simple-mindmap-css">${MINDMAP_CSS}</style>`);
    
    // Экспортируем функцию для тех, кто всё равно захочет макрос
    window.SimpleMindMap = { open: startMindMap };
    window.SimpleMindMapManager = class { render(force) { startMindMap(); } };
});

/* --- Плавающая кнопка запуска (Независимая от интерфейса Foundry) --- */
Hooks.on("ready", () => {
    if ($('#simple-mindmap-floating-btn').length === 0) {
        const title = game.i18n.localize("SIMPLE_MINDMAP.TITLE") || "Simple MindMap";
        const btn = $(`
            <div id="simple-mindmap-floating-btn" title="${title}" style="
                position: fixed;
                left: 15px;
                bottom: 85px;
                width: 46px;
                height: 46px;
                background: rgba(30, 30, 30, 0.85);
                border: 2px solid #555;
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #ff6400;
                cursor: pointer;
                box-shadow: 0 4px 15px rgba(0,0,0,0.6);
                z-index: 100;
                font-size: 22px;
                backdrop-filter: blur(4px);
                transition: all 0.2s ease-in-out;
            ">
                <i class="fas fa-project-diagram"></i>
            </div>
        `);

        btn.hover(
            function() { 
                $(this).css({ 
                    transform: 'scale(1.1) translateY(-2px)', 
                    borderColor: '#ff6400', 
                    color: '#fff', 
                    background: 'rgba(50, 50, 50, 0.95)' 
                }); 
            },
            function() { 
                $(this).css({ 
                    transform: 'scale(1) translateY(0)', 
                    borderColor: '#555', 
                    color: '#ff6400', 
                    background: 'rgba(30, 30, 30, 0.85)' 
                }); 
            }
        );

        btn.on('click', () => {
            startMindMap();
        });

        $('body').append(btn);
    }
});