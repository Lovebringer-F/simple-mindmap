/**
 * Simple MindMap Module
 * Features: Groups (Fields) with Auto-Magnet, Named Links, Arrow Connections, Tooltips, Visibility Control
 * (View-Only for Players)
 */

const MODULE_ID = 'simple-mindmap';
const SETTING_KEY = 'maps_data';
const LAST_MAP_KEY = 'last_map_id';

/* -------------------------------------------- */
/* 0. Global CSS & Styles                      */
/* -------------------------------------------- */

const MINDMAP_CSS = `
    /* --- CSS Variables for Themes --- */
    .theme-dark {
        --mm-bg: #111111;
        --mm-grid: #333333;
        --mm-text: #eeeeee;
        --mm-border: #555555;
        --mm-panel-bg: rgba(30, 30, 30, 0.95);
        --mm-panel-bg-dark: rgba(20, 20, 20, 0.95);
        --mm-node-bg: #2b2b2b;
        --mm-note-bg: rgba(0, 0, 0, 0.4);
        --mm-text-muted: #888888;
        --mm-btn-bg: #444444;
        --mm-btn-hover: #666666;
    }
    .theme-light {
        --mm-bg: #e5e5e5;
        --mm-grid: #bcbcbc;
        --mm-text: #111111;
        --mm-border: #999999;
        --mm-panel-bg: rgba(240, 240, 240, 0.95);
        --mm-panel-bg-dark: rgba(220, 220, 220, 0.95);
        --mm-node-bg: #fdfdfd;
        --mm-note-bg: rgba(255, 255, 255, 0.5);
        --mm-text-muted: #555555;
        --mm-btn-bg: #cccccc;
        --mm-btn-hover: #aaaaaa;
    }

    /* --- Window Styles --- */
    .mindmap-window .window-content { 
        padding: 0; 
        overflow: hidden; 
        background: var(--mm-bg); 
        display: flex;
        flex-direction: column;
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
        background: var(--mm-panel-bg);
        border-bottom: 1px solid var(--mm-border);
        display: flex;
        align-items: center;
        padding: 0 10px;
        gap: 10px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        z-index: 50;
    }
    
    .mm-toolbar select {
        height: 24px;
        background: var(--mm-panel-bg-dark);
        color: var(--mm-text);
        border: 1px solid var(--mm-border);
        border-radius: 3px;
    }
    
    #mm-map-selector { flex: 1; max-width: 250px; }
    #mm-line-style-select { width: 100px; }

    .mm-toolbar-btn {
        background: var(--mm-btn-bg);
        color: var(--mm-text);
        border: 1px solid var(--mm-border);
        border-radius: 3px;
        width: 24px; height: 24px;
        display: flex; align-items: center; justify-content: center;
        cursor: pointer;
        font-size: 12px;
    }
    .mm-toolbar-btn:hover { background: var(--mm-btn-hover); color: var(--mm-text); }
    .mm-toolbar-btn.danger { color: #ff6400; border-color: #ff6400; }

    /* --- Editor Canvas --- */
    .mindmap-container {
        flex: 1;
        width: 100%;
        height: 100%;
        background-color: var(--mm-bg); 
        color: var(--mm-text);
        position: relative;
        overflow: hidden;
        cursor: grab;
        background-image: none; 
        font-family: var(--mm-font, 'Signika', sans-serif);
    }
    
    .mindmap-container.show-grid {
        background-image: radial-gradient(var(--mm-grid) 1px, transparent 1px);
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
        transition: box-shadow 0.2s, border-radius 0.2s;
    }
    
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
        background: var(--mm-note-bg);
        border-top-left-radius: 8px;
        border-top-right-radius: 8px;
        height: 26px;
    }

    .mindmap-group .group-label {
        font-weight: bold;
        font-size: 16px;
        color: var(--mm-text);
        text-shadow: 0 1px 3px rgba(0,0,0,0.5);
        white-space: nowrap;
        padding-right: 5px;
    }
    
    .group-btn {
        color: var(--mm-text-muted);
        cursor: pointer;
        font-size: 14px;
        border-radius: 50%;
        width: 20px; height: 20px;
        display: flex; align-items: center; justify-content: center;
        transition: color 0.2s;
    }
    .group-btn:hover { color: var(--mm-text); }
    .group-btn.active { color: #ff6400; }
    
    .mindmap-group .group-handle {
        position: absolute;
        top: 0; left: 0;
        width: 24px; height: 24px;
        background: var(--mm-note-bg);
        color: var(--mm-text);
        display: flex; align-items: center; justify-content: center;
        border-bottom-right-radius: 8px;
        cursor: move;
        font-size: 12px;
        opacity: 0;
        transition: opacity 0.2s;
    }
    .mindmap-group:hover .group-handle { opacity: 1; }

    .mindmap-group .group-resize {
        position: absolute;
        bottom: 0; right: 0;
        width: 16px; height: 16px;
        background: var(--mm-note-bg);
        cursor: nwse-resize;
        border-top-left-radius: 8px;
        opacity: 0;
        transition: opacity 0.2s;
    }
    .mindmap-group:hover .group-resize { opacity: 1; }
    
    /* --- Nodes (Generic) --- */
    .mindmap-node {
        position: absolute;
        border: 1px solid var(--mm-border);
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.5);
        cursor: pointer;
        user-select: none;
        z-index: 10;
        display: flex;
        flex-direction: column;
        font-size: 14px;
        transition: box-shadow 0.2s; 
        pointer-events: auto;
        color: var(--mm-text);
        width: max-content;
        min-width: 160px;
        max-width: 260px;
        height: auto;
        overflow: hidden;
    }
    .mindmap-node.hidden { display: none !important; }
    .mindmap-node:hover {
        box-shadow: 0 6px 15px rgba(0,0,0,0.7);
        z-index: 105; 
        border-color: var(--mm-text-muted);
    }
    .mindmap-node.selected {
        box-shadow: 0 0 0 2px #ff6400, 0 6px 15px rgba(0,0,0,0.7);
        z-index: 110;
    }

    /* --- Node Layout & Controls --- */
    .node-layout-wrapper {
        display: flex;
        align-items: stretch;
        width: 100%;
        min-height: 50px;
        flex-shrink: 0;
    }
    
    .node-main-content {
        display: flex;
        align-items: stretch;
        flex: 1;
        overflow: hidden;
    }
    
    .node-controls {
        display: flex;
        flex-direction: column;
        border-left: 1px solid var(--mm-border);
        background: var(--mm-note-bg);
        width: 26px;
        flex-shrink: 0;
    }
    
    .node-control-btn {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--mm-text-muted);
        cursor: pointer;
        transition: color 0.1s, background 0.1s;
        font-size: 11px;
    }
    .node-control-btn:hover { color: var(--mm-text); background: var(--mm-note-bg); }
    .node-control-btn.active { color: #ff6400; }
    
    /* --- Card Node Content --- */
    .mindmap-node.node-card .node-main-content img {
        border: none;
        border-right: 1px solid var(--mm-border);
        width: 50px;
        object-fit: cover;
        background: var(--mm-note-bg);
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

    /* --- Text Node --- */
    .mindmap-node.node-text {
        border: 1px dashed var(--mm-border);
        min-width: 50px;
        width: max-content;
        box-shadow: none;
    }
    .mindmap-node.node-text .node-layout-wrapper {
        min-height: 30px;
    }
    .mindmap-node.node-text .node-main-content {
        padding: 5px 10px;
        justify-content: center;
        align-items: center;
        text-align: center;
    }
    .mindmap-node.node-text:hover {
        border-color: var(--mm-text);
    }
    .mindmap-node.node-text.selected {
        border: 1px solid #ff6400;
    }

    /* --- Comment Section --- */
    .node-comment {
        border-top: 1px solid var(--mm-border);
        padding: 4px 8px;
        font-size: 0.85em;
        color: var(--mm-text);
        background: var(--mm-note-bg);
        word-wrap: break-word;
        white-space: normal;
        flex-shrink: 0;
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
        color: var(--mm-text);
        border-bottom-style: solid;
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

    /* --- SVG Layer & Draggable Connection Endpoints --- */
    .mindmap-svg-layer {
        position: absolute;
        top: 0; left: 0; width: 100%; height: 100%;
        pointer-events: none; 
        z-index: 5;
        overflow: visible;
    }

    .conn-endpoint-svg {
        pointer-events: auto;
        cursor: grab;
        transition: r 0.2s, stroke-width 0.2s;
    }
    .conn-endpoint-svg:hover {
        r: 8px;
        fill: #ff6400;
        stroke: #ffffff;
        stroke-width: 2px;
    }
    .conn-endpoint-svg:active {
        cursor: grabbing;
    }
    
    .connection-svg-path {
        pointer-events: stroke;
        cursor: pointer;
    }
    .connection-svg-path:hover {
        stroke: rgba(255, 100, 0, 0.2);
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
        pointer-events: auto;
        display: flex;
        flex-direction: column;
        align-items: center;
        z-index: 100;
    }
    .connection-handle:hover {
        z-index: 101;
    }

    .conn-inner {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        background: var(--mm-panel-bg);
        border: 1px solid var(--mm-border);
        border-radius: 4px;
        overflow: hidden; 
        color: var(--mm-text);
        box-shadow: 0 2px 5px rgba(0,0,0,0.5);
        font-size: 12px;
        transition: box-shadow 0.1s, border-color 0.1s;
        width: max-content;
    }
    .connection-handle:hover .conn-inner {
        border-color: #ff6400;
        box-shadow: 0 0 5px rgba(0,0,0,0.5);
    }

    .conn-top-row {
        display: flex;
        width: 100%;
    }

    .conn-bottom-row {
        display: none;
        flex-direction: row;
        width: 100%;
        border-top: 1px solid var(--mm-border);
        background: var(--mm-panel-bg-dark);
    }
    .connection-handle:hover .conn-bottom-row {
        display: flex;
    }

    .conn-part-text {
        padding: 6px 12px;
        white-space: nowrap;
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 30px;
        cursor: pointer;
        flex: 1;
        font-weight: bold;
    }
    .conn-part-text:hover { background: var(--mm-note-bg); }
    
    .conn-part-btn {
        padding: 6px 10px;
        border-left: 1px solid var(--mm-border);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--mm-text-muted);
        flex: 1;
        transition: color 0.1s, background 0.1s;
    }
    .conn-part-btn:first-child { border-left: none; }
    .conn-part-btn:hover { background: var(--mm-note-bg); color: var(--mm-text); }
    .conn-part-btn.active { color: #ff6400; }
    .conn-part-btn.disabled { opacity: 0.3; cursor: not-allowed; pointer-events: none; }
    
    .conn-move-handle { cursor: grab; }
    .conn-move-handle:active { cursor: grabbing; }

    .connection-handle.empty-handle .conn-inner {
        width: 14px; height: 14px;
        border-radius: 50%;
        padding: 0;
        background: var(--mm-note-bg);
        min-width: unset;
    }
    .mindmap-container.show-anchors .connection-handle .conn-inner {
         background: #ff6400;
         border-color: #fff;
         transform: scale(1.2);
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
        background: var(--mm-panel-bg);
        backdrop-filter: blur(4px);
        padding: 10px;
        border-radius: 8px;
        color: var(--mm-text);
        border: 1px solid var(--mm-border);
        display: flex;
        flex-direction: column;
        gap: 8px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.5);
        pointer-events: auto;
        align-items: flex-start;
    }
    .mindmap-ui-top { display: flex; gap: 5px; align-items: center; }
    .mm-btn { background: var(--mm-btn-bg); color: var(--mm-text); border: 1px solid var(--mm-border); border-radius: 3px; width: 28px; height: 28px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .mm-btn:hover { background: var(--mm-btn-hover); }
    
    .help-text { display: none; font-size: 0.8em; color: var(--mm-text-muted); margin-top: 5px; line-height: 1.4; white-space: nowrap; }
    .help-text.active { display: block; }
    .help-text b { color: #ffaa55; }

    .mm-dialog-content { display: flex; flex-direction: column; gap: 10px; padding: 10px; }
    .mm-dialog-row { display: flex; align-items: center; gap: 10px; }
    .mm-dialog-row label { flex: 0 0 110px; font-weight: bold; }
    .mm-dialog-row input:not([type="checkbox"]), .mm-dialog-row select, .mm-dialog-row textarea { flex: 1; }
    .mm-dialog-row input[type="checkbox"] { flex: 0 0 auto; width: 18px; height: 18px; }
    .drop-zone { border: 2px dashed var(--mm-border); padding: 10px; text-align: center; color: var(--mm-text-muted); margin-top: 5px; cursor: pointer; transition: border-color 0.2s; }
    .drop-zone.drag-hover { border-color: #ff6400; color: var(--mm-text); }

    /* GM Hidden Visibility Style */
    .gm-hidden-item {
        opacity: 0.4 !important;
        border-style: dashed !important;
        filter: grayscale(50%);
    }

    /* --- Entity Notes --- */
    .entity-notes {
        background: var(--mm-note-bg); border-top: 1px solid var(--mm-border);
        padding: 5px; font-size: 12px; cursor: default; pointer-events: auto; width: 100%; box-sizing: border-box;
    }
    .notes-section-title { font-weight: bold; color: var(--mm-text-muted); margin-top: 3px; font-size: 11px; text-transform: uppercase; border-bottom: 1px solid var(--mm-border); padding-bottom: 2px; margin-bottom: 3px; flex-shrink: 0; }
    .note-item { padding: 2px 0; border-bottom: 1px dotted var(--mm-border); display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-start; gap: 5px; color: var(--mm-text); }
    .note-item span { flex: 1; word-break: break-word; white-space: normal; color: var(--mm-text); }
    .note-item small { color: var(--mm-text-muted); font-style: italic; white-space: nowrap; }
    .delete-note { color: #ff6400; cursor: pointer; opacity: 0.5; margin-left: 5px; }
    .delete-note:hover { opacity: 1; }
    .note-input-row { display: flex; gap: 5px; margin-top: 5px; align-items: center; flex-shrink: 0; }
    .new-note-input { flex: 1; background: var(--mm-panel-bg-dark); border: 1px solid var(--mm-border); color: var(--mm-text); padding: 4px 6px; font-size: 13px; height: 26px; border-radius: 3px; box-sizing: border-box; }
    .add-note-btn { background: var(--mm-btn-bg); border: 1px solid var(--mm-border); color: var(--mm-text); width: 26px; height: 26px; display: flex; justify-content: center; align-items: center; cursor: pointer; border-radius: 3px; box-sizing: border-box; padding: 0; }
    .add-note-btn:hover { background: var(--mm-btn-hover); }
    
    .group-notes-container {
        position: absolute; bottom: 20px; left: 5px; right: 5px;
        max-height: calc(100% - 40px); overflow-y: auto; pointer-events: auto;
    }

    .connection-notes-wrapper {
        position: absolute;
        top: calc(100% + 5px);
        left: 50%;
        transform: translateX(-50%);
        width: 220px;
        z-index: 102;
        cursor: default;
    }

    /* Рамка и фон для заметок связей */
    .connection-notes-wrapper .entity-notes {
        border: 1px solid var(--mm-border);
        border-radius: 6px;
        background: var(--mm-panel-bg);
        box-shadow: 0 4px 15px rgba(0,0,0,0.5);
    }

    /* --- Resize Handle for Nodes --- */
    .mindmap-node .node-resize {
        position: absolute;
        bottom: 0; right: 0;
        width: 14px; height: 14px;
        cursor: nwse-resize;
        opacity: 0;
        transition: opacity 0.2s;
        background: linear-gradient(135deg, transparent 50%, var(--mm-text-muted) 50%);
        border-bottom-right-radius: 4px;
        z-index: 20;
    }
    .mindmap-node:hover .node-resize { opacity: 1; }
`;

/* -------------------------------------------- */
/* 1. Data Storage & Settings                  */
/* -------------------------------------------- */

class MindMapData {
    static getMaps() { 
        const data = game.settings.get(MODULE_ID, SETTING_KEY);
        return foundry.utils.deepClone(data || {});
    }
    
    static async saveMaps(data) { 
        if (game.user.isGM) {
            await game.settings.set(MODULE_ID, SETTING_KEY, foundry.utils.deepClone(data)); 
        }
    }

    static getLastMapId() { return game.settings.get(MODULE_ID, LAST_MAP_KEY); }
    static async setLastMapId(id) { await game.settings.set(MODULE_ID, LAST_MAP_KEY, id); }

    static async createMap(name) {
        if (!game.user.isGM) return null; 
        const maps = this.getMaps();
        const id = foundry.utils.randomID();
        maps[id] = { id, name, nodes: [], connections: [], groups: [], hidden: false, defaultView: { x: 0, y: 0, zoom: 1 } };
        await this.saveMaps(maps);
        return id;
    }

    static async deleteMap(id) {
        if (!game.user.isGM) return;
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
        if (!game.user.isGM) return;
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
        
        this.zoom = 1;
        this.pan = { x: 0, y: 0 };
        
        if (options.mapData) {
            this.mapData = options.mapData;
            this._applyDefaultView();
        } else {
            this._loadMapData();
            this._applyDefaultView();
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

        this.resizingNode = null;
        this.nodeResizeStart = { w: 0, h: 0, x: 0, y: 0 };
        
        this.draggingConnection = null;
        this.reconnecting = null;

        this.defaultLineStyle = 'curve'; 
        
        this.isPanning = false;
        this.rmbStartNode = null;
        this.rmbStartPos = {x:0,y:0};
        
        this.isSelecting = false;
        this.selectionStart = { x: 0, y: 0 };
        this.selectionRect = { x: 0, y: 0, w: 0, h: 0 };

        this._handlers = {};
        this.isHovered = false;
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "mindmap-editor",
            classes: ["mindmap-window"],
            title: "MindMap Editor",
            resizable: true,
            width: 1000,
            height: 700
        });
    }

    get title() { 
        const titlePart = game.i18n.localize("SIMPLE_MINDMAP.WINDOW_TITLE") || "Редактор MindMap";
        const mapNamePart = this.mapData ? this.mapData.name : (game.i18n.localize("SIMPLE_MINDMAP.SELECT_MAP") || "Выберите карту");
        return `${titlePart}: ${mapNamePart}`;
    }

    _applyDefaultView() {
        if (this.mapData && this.mapData.defaultView) {
            this.pan = { x: this.mapData.defaultView.x, y: this.mapData.defaultView.y };
            this.zoom = this.mapData.defaultView.zoom || 1;
        } else {
            this.pan = { x: 0, y: 0 };
            this.zoom = 1;
        }
    }

    _renderNotesHTML(entity) {
        if (!entity.hasNotes) return '';
        const isGM = game.user.isGM;
        let gmNotesHtml = '';
        let playerNotesHtml = '';
        
        (entity.notes || []).forEach(note => {
            const canDelete = isGM; 
            const noteHtml = `<div class="note-item"><span>${note.text}</span> <small>- ${note.author}</small>${canDelete ? ` <i class="fas fa-times delete-note" data-target="${entity.id}" data-note="${note.id}"></i>` : ''}</div>`;
            
            if (note.isGM) gmNotesHtml += noteHtml;
            else playerNotesHtml += noteHtml;
        });

        // Структура на Flexbox для умного растягивания и появления скролла только когда нужно
        let html = `<div class="entity-notes" data-id="${entity.id}" style="display:flex; flex-direction:column; overflow:hidden; width:100%; height:100%;">`;
        if (isGM) {
            html += `<div class="notes-section-title">${game.i18n.localize("SIMPLE_MINDMAP.NOTES_GM") || "Заметки Мастера"}</div>`;
            html += `<div class="notes-list" style="flex:1; overflow-y:auto; min-height:20px; max-height:none; padding-right: 2px;">${gmNotesHtml || '<div style="color:#666; font-style:italic;">...</div>'}</div>`;
        }
        html += `<div class="notes-section-title">${game.i18n.localize("SIMPLE_MINDMAP.NOTES_PLAYERS") || "Заметки Игроков"}</div>`;
        html += `<div class="notes-list" style="flex:1; overflow-y:auto; min-height:20px; max-height:none; padding-right: 2px;">${playerNotesHtml || '<div style="color:#666; font-style:italic;">...</div>'}</div>`;
        
        if (isGM) {
            html += `<div class="note-input-row">
                <input type="text" class="new-note-input" placeholder="${game.i18n.localize("SIMPLE_MINDMAP.NOTE_PLACEHOLDER") || "Текст заметки..."}">
                <label title="Скрытая заметка GM" style="display:flex; align-items:center; gap:2px; font-size:10px;"><input type="checkbox" class="is-gm-note-cb" style="width:12px; height:12px; margin:0;"> GM</label>
                <button class="add-note-btn"><i class="fas fa-plus"></i></button>
            </div>`;
        }
        html += `</div>`;
        return html;
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

    async _renderInner(...args) {
        const maps = MindMapData.getMaps();
        let optionsHtml = "";
        
        if (Object.keys(maps).length === 0) {
            optionsHtml = `<option value="" disabled selected>${game.i18n.localize("SIMPLE_MINDMAP.NO_MAPS") || "Нет карт"}</option>`;
        } else {
            for (const [id, map] of Object.entries(maps)) {
                if (!game.user.isGM && map.hidden) continue; 
                const selected = id === this.mapId ? "selected" : "";
                optionsHtml += `<option value="${id}" ${selected}>${map.name}</option>`;
            }
            if (optionsHtml === "") optionsHtml = `<option value="" disabled selected>${game.i18n.localize("SIMPLE_MINDMAP.NO_MAPS") || "Нет карт"}</option>`;
        }

        const isGM = game.user.isGM;
        const canEditMap = isGM;
        const isMapHiddenForPlayer = !isGM && this.mapData?.hidden;

        // Загрузка настроек
        const theme = game.settings.get(MODULE_ID, 'theme') || 'dark';
        const font = game.settings.get(MODULE_ID, 'fontFamily') || 'Signika';

        const htmlContent = `
        <div class="mm-wrapper">
            <div class="mm-toolbar">
                <select id="mm-map-selector" title="${game.i18n.localize("SIMPLE_MINDMAP.TOOLBAR_SELECT_MAP")}">${optionsHtml}</select>
                
                ${canEditMap ? `
                <div style="width: 1px; height: 16px; background: #555; margin: 0 5px;"></div>
                <select id="mm-line-style-select" title="${game.i18n.localize("SIMPLE_MINDMAP.TOOLBAR_LINE_STYLE")}">
                    <option value="curve" ${this.defaultLineStyle === 'curve' ? 'selected' : ''}>${game.i18n.localize("SIMPLE_MINDMAP.LINE_STYLE_CURVE") || "Кривая"}</option>
                    <option value="straight" ${this.defaultLineStyle === 'straight' ? 'selected' : ''}>${game.i18n.localize("SIMPLE_MINDMAP.LINE_STYLE_STRAIGHT") || "Прямая"}</option>
                    <option value="orthogonal" ${this.defaultLineStyle === 'orthogonal' ? 'selected' : ''}>${game.i18n.localize("SIMPLE_MINDMAP.LINE_STYLE_ORTHOGONAL") || "Ломаная"}</option>
                </select>
                ` : ''}

                ${canEditMap && !isMapHiddenForPlayer ? `
                <div style="width: 1px; height: 16px; background: #555; margin: 0 5px;"></div>
                <button class="mm-toolbar-btn" id="mm-add-group" title="${game.i18n.localize("SIMPLE_MINDMAP.TOOLBAR_ADD_GROUP") || "Добавить Поле"}"><i class="fas fa-vector-square"></i></button>
                <button class="mm-toolbar-btn" id="mm-add-text" title="${game.i18n.localize("SIMPLE_MINDMAP.TOOLBAR_ADD_TEXT")}"><i class="fas fa-font"></i></button>
                <button class="mm-toolbar-btn" id="mm-add-link" title="${game.i18n.localize("SIMPLE_MINDMAP.TOOLBAR_ADD_LINK")}"><i class="fas fa-link"></i></button>
                ` : ''}
                
                ${isGM ? `
                <div style="width: 1px; height: 16px; background: #555; margin: 0 5px;"></div>
                <button class="mm-toolbar-btn" id="mm-new" title="${game.i18n.localize("SIMPLE_MINDMAP.TOOLBAR_NEW")}"><i class="fas fa-plus"></i></button>
                <button class="mm-toolbar-btn" id="mm-rename" title="${game.i18n.localize("SIMPLE_MINDMAP.TOOLBAR_RENAME")}"><i class="fas fa-pen"></i></button>
                <button class="mm-toolbar-btn danger" id="mm-delete" title="${game.i18n.localize("SIMPLE_MINDMAP.TOOLBAR_DELETE")}"><i class="fas fa-trash"></i></button>
                
                <div style="width: 1px; height: 16px; background: #555; margin: 0 5px;"></div>
                <button class="mm-toolbar-btn ${this.mapData?.hidden ? 'danger' : ''}" id="mm-map-visibility" title="${game.i18n.localize("SIMPLE_MINDMAP.TOOLBAR_TOGGLE_VISIBILITY")}"><i class="fas ${this.mapData?.hidden ? 'fa-eye-slash' : 'fa-eye'}"></i></button>
                ` : ''}
            </div>

            <div class="mindmap-container theme-${theme}" id="mm-canvas" style="--mm-font: '${font}', sans-serif;">
                ${!this.mapData ? `<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#777;">${game.i18n.localize("SIMPLE_MINDMAP.CANVAS_HINT")}</div>` : ''}
                ${isMapHiddenForPlayer ? `<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#777;font-size:20px;">${game.i18n.localize("SIMPLE_MINDMAP.MAP_HIDDEN_GM") || "Карта скрыта Мастером."}</div>` : ''}
                
                ${(!isMapHiddenForPlayer) ? `
                <div class="selection-lasso" id="mm-lasso"></div>
                <div class="mindmap-ui">
                    <div class="mindmap-ui-top">
                        <button class="mm-btn" id="refresh-map" title="${game.i18n.localize("SIMPLE_MINDMAP.HELP_RESET_VIEW") || 'Вернуться к центру'}"><i class="fas fa-compress-arrows-alt"></i></button>
                        ${canEditMap ? `<button class="mm-btn" id="save-view" title="Сохранить текущий вид как центр по умолчанию"><i class="fas fa-crosshairs"></i></button>` : ''}
                        <button class="mm-btn" id="toggle-help" title="${game.i18n.localize("SIMPLE_MINDMAP.TOOLBAR_HELP") || 'Помощь'}"><i class="fas fa-question"></i></button>
                    </div>
                    <div class="help-text" id="help-text-content">
                        <b>${game.i18n.localize("SIMPLE_MINDMAP.HELP_TEXT_1")}</b><br>
                        <b>${game.i18n.localize("SIMPLE_MINDMAP.HELP_TEXT_2")}</b><br>
                        ${canEditMap ? `
                        <b>${game.i18n.localize("SIMPLE_MINDMAP.HELP_TEXT_3")}</b><br>
                        <b>${game.i18n.localize("SIMPLE_MINDMAP.HELP_TEXT_4")}</b><br>
                        <b>${game.i18n.localize("SIMPLE_MINDMAP.HELP_TEXT_5")}</b><br>
                        <b>${game.i18n.localize("SIMPLE_MINDMAP.HELP_TEXT_6")}</b><br>
                        <b>${game.i18n.localize("SIMPLE_MINDMAP.HELP_TEXT_7") || 'Ctrl + Клик: Мультивыделение'}</b><br>
                        <b>${game.i18n.localize("SIMPLE_MINDMAP.HELP_TEXT_8") || 'Delete: Удалить выделенное'}</b>` : ''}
                    </div>
                </div>
                <div class="mindmap-content">
                    <div class="groups-layer"></div>
                    <svg class="mindmap-svg-layer"></svg>
                    <div class="connection-nodes-layer"></div>
                    <div class="nodes-layer"></div>
                </div>
                ` : ''}
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
        
        if (this.mapData && (!this.mapData.hidden || game.user.isGM)) {
            this._renderGraph();
            this._updateTransform();
        }

        html.find('#mm-map-selector').change((e) => {
            this._switchMap(e.target.value);
        });

        // GM / Edit Controls
        if (game.user.isGM) {
            html.find('#mm-line-style-select').change((e) => { this.defaultLineStyle = e.target.value; });
            html.find('#mm-new').click(() => this._createMapDialog());
            html.find('#mm-rename').click(() => this._renameMapDialog());
            html.find('#mm-delete').click(() => this._deleteMapDialog());
            
            html.find('#mm-map-visibility').click(() => {
                if(this.mapData) {
                    this.mapData.hidden = !this.mapData.hidden;
                    MindMapData.updateMap(this.mapId, this.mapData);
                    this.render(true);
                }
            });
            
            html.find('#mm-add-link').click(() => this._addMapLinkDialog());
            html.find('#mm-add-text').click(() => this._addTextNodeDialog());
            html.find('#mm-add-group').click(() => this._addGroup());
            
            html.find('#save-view').click(() => {
                if (this.mapData) {
                    this.mapData.defaultView = { x: this.pan.x, y: this.pan.y, zoom: this.zoom };
                    MindMapData.updateMap(this.mapId, this.mapData);
                    ui.notifications.info("Положение холста сохранено как центр по умолчанию.");
                }
            });
        }

        html.find('#refresh-map').click(() => {
            this._applyDefaultView();
            this._updateTransform();
        });
        
        html.find('#toggle-help').click(() => {
            html.find('#help-text-content').toggleClass('active');
        });
        
        const dropEl = this.container[0]; 
        if (dropEl && game.user.isGM) {
            dropEl.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; });
            dropEl.addEventListener('drop', this._onDropEntity.bind(this));
        }

        this.container.on('dragstart', '.mindmap-node img', this._onExternalDragStart.bind(this));
        this.container.on('wheel', this._onWheel.bind(this));
        this.container.on('contextmenu', (e) => e.preventDefault());
        this.container.on('mousedown', this._onContainerMouseDown.bind(this));
        this.container.on('mousedown', '.mindmap-node', this._onNodeMouseDown.bind(this));
        
        this.container.on('click', '.comment-link', this._onCommentLinkClick.bind(this));
        
        // Разрешаем кликать в заметках и вводить текст, не сдвигая карту
        this.container.on('mousedown dblclick', '.entity-notes', (e) => e.stopPropagation());
        
        this.container.on('click', '.add-note-btn', this._onAddNote.bind(this));
        this.container.on('click', '.delete-note', this._onDeleteNote.bind(this));
        
        this.container.on('keydown', '.new-note-input', (e) => {
            e.stopPropagation();
            if (e.key === 'Enter') {
                e.preventDefault();
                $(e.currentTarget).siblings('.add-note-btn').click();
            }
        });
        
        // Group interactions (GM ONLY)
        if (game.user.isGM) {
            this.container.on('click', '.group-visibility-toggle', this._onGroupVisibilityToggle.bind(this));
            
            this.container.on('click', '.conn-settings-btn', (e) => {
                if (e.shiftKey) return; // Prevent open settings when branching
                const handle = $(e.currentTarget).closest('.connection-handle');
                this._onConnectionDblClick(e, handle);
            });
            
            this.container.on('click', '.node-vis-toggle, .conn-vis-toggle', this._onQuickVisToggle.bind(this));
            this.container.on('click', '.conn-lock-toggle', this._onConnLockToggle.bind(this));
            
            this.container.on('mousedown', '.conn-move-handle', (e) => {
                e.stopPropagation();
                if ($(e.currentTarget).hasClass('disabled')) return; 
                const handle = $(e.currentTarget).closest('.connection-handle');
                this.draggingConnection = handle.data('id');
            });

            // Отрыв и переподключение связи
            this.container.on('mousedown', '.conn-endpoint-svg', (e) => {
                e.stopPropagation();
                if (e.button !== 0) return;
                const connId = $(e.currentTarget).attr('data-conn-id');
                const end = $(e.currentTarget).attr('data-end');
                
                const c = this.mapData.connections.find(x => x.id === connId);
                if (!c) return;

                this.reconnecting = { 
                    connId: c.id, 
                    end: end, 
                    fixedNode: end === 'to' ? c.from : c.to,
                    connData: {...c}
                };
                
                // Временно убираем связь, чтобы отрисовать линию к курсору
                this.mapData.connections = this.mapData.connections.filter(x => x.id !== connId);
                this.connectingSource = this.reconnecting.fixedNode;
                this.container.addClass('show-anchors');
                this._renderGraph();
            });

            // Редактирование голых линий связи
            this.container.on('dblclick', '.connection-svg-path', (e) => {
                e.preventDefault(); e.stopPropagation();
                const connId = $(e.currentTarget).attr('data-conn-id');
                const target = this.connectionLayer.find(`[data-id="${connId}"]`);
                if (target.length) {
                    this._onConnectionDblClick(e, target);
                } else {
                    // Если у связи нет HTML блока, создаем фейковый элемент для передачи ID
                    this._onConnectionDblClick(e, $(`<div data-id="${connId}"></div>`));
                }
            });
            
            this.container.on('mousedown dblclick', '.node-controls, .conn-part-btn:not(.conn-move-handle)', (e) => e.stopPropagation());
            
            this.container.on('mousedown', '.group-header, .group-handle', this._onGroupHandleMouseDown.bind(this));
            this.container.on('mousedown', '.group-resize', this._onGroupResizeMouseDown.bind(this));
            this.container.on('mousedown', '.node-resize', this._onNodeResizeMouseDown.bind(this));

            this.container.on('dblclick', '.mindmap-node', (e) => {
                e.preventDefault(); e.stopPropagation();
                this._onNodeDblClick(e, $(e.currentTarget));
            });

            this.container.on('dblclick', '.connection-handle', (e) => {
                e.preventDefault(); e.stopPropagation();
                this._onConnectionDblClick(e, $(e.currentTarget));
            });

            this.container.on('dblclick', '.group-header', (e) => {
                e.preventDefault(); e.stopPropagation();
                const groupEl = $(e.currentTarget).closest('.mindmap-group');
                this._onGroupDblClick(e, $(e.currentTarget));
            });

            this.container.on('mousedown', '.connection-handle', (e) => {
                // If shift key is pressed, we allow clicking anywhere on the connection to start a branch
                if (e.shiftKey) {
                    this._onConnectionMouseDown(e);
                    return;
                }
                if ($(e.target).closest('.conn-part-btn, .conn-part-text, .entity-notes').length) return; 
                this._onConnectionMouseDown(e);
            });
        }

        // БАЗОВАЯ РАБОТА С ГЛОБАЛЬНЫМИ СОБЫТИЯМИ
        this._handlers.mousemove = this._onMouseMove.bind(this);
        this._handlers.mouseup = this._onMouseUp.bind(this);
        this._handlers.keydown = this._onKeyDown.bind(this);
        this._handlers.globalMousedown = this._onGlobalMousedown.bind(this);
        
        window.addEventListener('mousemove', this._handlers.mousemove);
        window.addEventListener('mouseup', this._handlers.mouseup);
        window.addEventListener('keydown', this._handlers.keydown);
        window.addEventListener('mousedown', this._handlers.globalMousedown);

        this.element.on('mouseenter', () => this.isHovered = true);
        this.element.on('mouseleave', () => this.isHovered = false);
    }

    async close(options={}) {
        this._removeGlobalListeners();
        return super.close(options);
    }

    _removeGlobalListeners() {
        if (this._handlers.mousemove) window.removeEventListener('mousemove', this._handlers.mousemove);
        if (this._handlers.mouseup) window.removeEventListener('mouseup', this._handlers.mouseup);
        if (this._handlers.keydown) window.removeEventListener('keydown', this._handlers.keydown);
        if (this._handlers.globalMousedown) window.removeEventListener('mousedown', this._handlers.globalMousedown);
        this._handlers = {};
    }

    /* --- Toolbar Logic --- */

    async _switchMap(newId) {
        if (!newId) return;
        await MindMapData.setLastMapId(newId);
        this.mapId = newId;
        this._loadMapData();
        this._applyDefaultView();
        this.selectedNodeIds.clear();
        this.render(true); 
    }

    _createMapDialog() { 
        new Dialog({
            title: game.i18n.localize("SIMPLE_MINDMAP.DIALOG_NEW_MAP_TITLE") || "Создать новую карту",
            content: `<form><div class="form-group"><label>${game.i18n.localize("SIMPLE_MINDMAP.LABEL_NAME") || "Название карты"}</label><input type="text" name="name" autofocus></div></form>`,
            buttons: {
                ok: {
                    label: game.i18n.localize("SIMPLE_MINDMAP.BUTTON_CREATE") || "Создать",
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
            title: game.i18n.localize("SIMPLE_MINDMAP.DIALOG_RENAME_MAP_TITLE") || "Переименовать карту",
            content: `<form><div class="form-group"><label>${game.i18n.localize("SIMPLE_MINDMAP.LABEL_NEW_NAME") || "Новое название"}</label><input type="text" name="name" value="${this.mapData.name}" autofocus></div></form>`,
            buttons: {
                ok: {
                    label: game.i18n.localize("SIMPLE_MINDMAP.BUTTON_SAVE") || "Сохранить",
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
        const content = (game.i18n.localize("SIMPLE_MINDMAP.CONFIRM_DELETE") || "Вы уверены, что хотите удалить карту {mapName}?").replace('{mapName}', this.mapData.name);
        Dialog.confirm({
            title: game.i18n.localize("SIMPLE_MINDMAP.DIALOG_DELETE_MAP_TITLE") || "Удаление карты",
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
            if (id !== this.mapId && (game.user.isGM || !map.hidden)) {
                options += `<option value="${id}">${map.name}</option>`;
            }
        }

        if (!options) {
            ui.notifications.warn(game.i18n.localize("SIMPLE_MINDMAP.NOTIFICATION_NO_OTHER_MAPS") || "Нет других карт.");
            return;
        }

        new Dialog({
            title: game.i18n.localize("SIMPLE_MINDMAP.DIALOG_ADD_LINK_TITLE") || "Ссылка на другую карту",
            content: `<div class="mm-dialog-content"><div class="mm-dialog-row"><label>${game.i18n.localize("SIMPLE_MINDMAP.LABEL_MAP") || "Целевая карта"}</label><select id="link-map-select">${options}</select></div></div>`,
            buttons: {
                add: {
                    label: game.i18n.localize("SIMPLE_MINDMAP.BUTTON_ADD") || "Добавить ссылку",
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
                                x: centerX - 75, y: centerY - 25,
                                hidden: false,
                                backgroundColor: ""
                            });
                            await MindMapData.updateMap(this.mapId, this.mapData);
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
        const font = game.settings.get(MODULE_ID, 'fontFamily') || 'Signika';
        
        if (!this.mapData.nodes) this.mapData.nodes = [];
        this.mapData.nodes.push({
            id: foundry.utils.randomID(),
            nodeType: 'text',
            name: "Новый текст",
            x: centerX, y: centerY,
            hidden: false,
            backgroundColor: "transparent",
            style: {
                fontSize: 16,
                fontFamily: font,
                color: '#ffffff'
            }
        });
        MindMapData.updateMap(this.mapId, this.mapData);
    }

    _addGroup() {
        if (!this.mapData) return;
        const centerX = (this.container.width() / 2 - this.pan.x) / this.zoom;
        const centerY = (this.container.height() / 2 - this.pan.y) / this.zoom;

        if (!this.mapData.groups) this.mapData.groups = [];
        this.mapData.groups.push({
            id: foundry.utils.randomID(),
            name: "Новое Поле",
            x: centerX - 100, y: centerY - 100,
            width: 200, height: 200,
            color: "#333333",
            alpha: 0.5,
            hidden: false,
            bgImage: ""
        });
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
            if (!game.user.isGM) return;

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
                hidden: false,
                backgroundColor: ""
            });
            await MindMapData.updateMap(this.mapId, this.mapData); 
        } catch (err) { console.error(err); }
    }

    _onExternalDragStart(e) {
        const img = $(e.currentTarget);
        const nodeEl = img.closest('.mindmap-node');
        const nodeId = nodeEl.data('id');
        const node = this.mapData.nodes.find(n => n.id === nodeId);
        
        if (!game.user.isGM) { e.preventDefault(); return; }
        if (!node || !node.uuid) { e.preventDefault(); return; }

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

        const isGM = game.user.isGM;

        // Ensure SVGLayer has defs for arrows
        let defs = this.svgLayer.querySelector('defs');
        if (!defs) {
            defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            this.svgLayer.appendChild(defs);
        }

        const explicitlyHiddenGroups = new Set();
        const explicitlyHiddenNodes = new Set();

        // Pass 1: Find all hidden groups & hidden nodes
        (this.mapData.groups || []).forEach(g => { if (g.hidden) explicitlyHiddenGroups.add(g.id); });
        (this.mapData.nodes || []).forEach(n => { if (n.hidden) explicitlyHiddenNodes.add(n.id); });

        // Pass 2: Trapping nodes inside groups for cascading hides
        (this.mapData.nodes || []).forEach(n => {
            const elWidth = n.width || (n.nodeType === 'text' ? 100 : 160);
            const elHeight = n.height || (n.nodeType === 'text' ? 30 : 50);
            const cx = n.x + elWidth / 2; 
            const cy = n.y + elHeight / 2;
            
            for (const gid of explicitlyHiddenGroups) {
                const g = this.mapData.groups.find(x => x.id === gid);
                const gHeight = g ? g.height : 0;
                if (g && cx >= g.x && cx <= g.x + g.width && cy >= g.y && cy <= g.y + gHeight) {
                    explicitlyHiddenNodes.add(n.id); 
                    break;
                }
            }
        });

        // 0. Render Groups
        (this.mapData.groups || []).forEach(group => {
            if (!isGM && group.hidden) return; 
            
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
            
            const gmHiddenClass = (isGM && group.hidden) ? 'gm-hidden-item' : '';
            const bgImageStyle = (group.bgImage) ? `background-image: url('${group.bgImage}'); background-size: cover; background-position: center; background-blend-mode: overlay;` : '';

            const gmControls = isGM ? `
                <div class="group-btn group-visibility-toggle ${group.hidden ? 'active' : ''}" title="${game.i18n.localize("SIMPLE_MINDMAP.TOOLBAR_TOGGLE_VISIBILITY") || "Видимость"}">
                    <i class="fas ${group.hidden ? 'fa-eye-slash' : 'fa-eye'}"></i>
                </div>
            ` : '';

            const el = $(`
                <div class="mindmap-group ${gmHiddenClass}" data-id="${group.id}" 
                     style="--group-color: ${color}; --group-bg-color: ${rgba}; left: ${group.x}px; top: ${group.y}px; width: ${group.width}px; height: ${group.height}px; border-color: ${color}; background-color: ${rgba}; ${bgImageStyle}">
                     <div class="group-header">
                        <div class="group-label">${group.name}</div>
                        ${gmControls}
                     </div>
                     <div class="group-handle"><i class="fas fa-arrows-alt"></i></div>
                     <div class="group-resize"></div>
                     <div class="group-notes-container">${this._renderNotesHTML(group)}</div>
                </div>
            `);
            this.groupsLayer.append(el);
        });

        // 1. Render Nodes
        (this.mapData.nodes || []).forEach(node => {
            if (!isGM && explicitlyHiddenNodes.has(node.id)) return;

            const gmHiddenClass = (isGM && explicitlyHiddenNodes.has(node.id)) ? 'gm-hidden-item' : '';
            const selected = this.selectedNodeIds.has(node.id) ? "selected" : "";
            
            const widthStyle = node.width ? `width: ${node.width}px;` : '';
            const heightStyle = node.height ? `height: ${node.height}px;` : '';
            const sizeStyle = widthStyle + heightStyle;
            const bgColorStyle = node.backgroundColor ? `background-color: ${node.backgroundColor};` : 'background-color: transparent;';

            let controlsHtml = '';
            if (isGM) {
                controlsHtml = `
                <div class="node-controls">
                    <div class="node-control-btn node-vis-toggle ${node.hidden ? 'active' : ''}" data-id="${node.id}" title="Скрыть/Показать">
                        <i class="fas ${node.hidden ? 'fa-eye-slash' : 'fa-eye'}"></i>
                    </div>
                </div>`;
            }

            let el;
            
            if (node.nodeType === 'text') {
                const style = node.style || { fontSize: 16, color: '#ffffff', fontFamily: 'Signika' };
                el = $(`<div class="mindmap-node node-text ${selected} ${gmHiddenClass}" data-id="${node.id}" 
                        style="left: ${node.x}px; top: ${node.y}px; ${sizeStyle} ${bgColorStyle} font-size: ${style.fontSize}px; color: ${style.color}; font-family: ${style.fontFamily || 'var(--mm-font)'}">
                        <div class="node-layout-wrapper">
                            <div class="node-main-content" style="justify-content:center; align-items:center;">${node.name}</div>
                            ${controlsHtml}
                        </div>
                        ${this._renderNotesHTML(node)}
                        <div class="node-resize"></div>
                    </div>`);
            } else {
                const cardBgColor = node.backgroundColor || 'var(--mm-node-bg)';
                
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

                const isDraggable = !!node.uuid && isGM;

                el = $(`
                    <div class="mindmap-node node-card ${selected} ${gmHiddenClass}" data-id="${node.id}" style="left: ${node.x}px; top: ${node.y}px; background-color: ${cardBgColor}; ${sizeStyle}">
                        <div class="node-layout-wrapper">
                            <div class="node-main-content">
                                <img src="${node.img}" draggable="${isDraggable}">
                                <span>${node.name}</span>
                            </div>
                            ${controlsHtml}
                        </div>
                        ${commentHtml}
                        ${this._renderNotesHTML(node)}
                        <div class="node-resize"></div>
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
            let fromId = c.from;
            let toId = c.to;

            if (fromId === toId) return;

            // Cascading Connection Hiding
            const isConnExplicitlyHidden = c.hidden;
            const fromIsHidden = explicitlyHiddenNodes.has(c.from) || explicitlyHiddenGroups.has(c.from);
            const toIsHidden = explicitlyHiddenNodes.has(c.to) || explicitlyHiddenGroups.has(c.to);
            const isConnFullyHidden = isConnExplicitlyHidden || fromIsHidden || toIsHidden;

            if (!isGM && isConnFullyHidden) return;

            const srcBounds = this._getEntityBounds(fromId);
            const dstBounds = this._getEntityBounds(toId);

            const validSrc = this.mapData.nodes.some(n=>n.id===fromId) || this.mapData.groups.some(g=>g.id===fromId) || this.mapData.connections.some(x=>x.id===fromId);
            const validDst = this.mapData.nodes.some(n=>n.id===toId) || this.mapData.groups.some(g=>g.id===toId) || this.mapData.connections.some(x=>x.id===toId);

            if (validSrc && validDst) {
                 const g = this._drawConnection(srcBounds, dstBounds, c, false, isConnFullyHidden);
                 if (isGM && isConnFullyHidden) g.classList.add('gm-hidden-item');
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
            if (node.nodeType === 'text') return { x: node.x, y: node.y, w: node.width || 100, h: node.height || 30 };
            return { x: node.x, y: node.y, w: node.width || 160, h: node.height || 50 };
        }

        const group = (this.mapData.groups || []).find(g => g.id === id);
        if (group) {
            return { 
                x: group.x, 
                y: group.y, 
                w: group.width, 
                h: group.height 
            };
        }

        const conn = this.mapData.connections.find(c => c.id === id);
        if (conn) {
            const srcBounds = this._getEntityBounds(conn.from, visited);
            const dstBounds = this._getEntityBounds(conn.to, visited);
            
            const x1 = srcBounds.x + srcBounds.w/2, y1 = srcBounds.y + srcBounds.h/2;
            const x2 = dstBounds.x + dstBounds.w/2, y2 = dstBounds.y + dstBounds.h/2;
            
            let posx, posy;
            if (conn.pinned && conn.cx !== undefined && conn.cy !== undefined) {
                posx = conn.cx;
                posy = conn.cy;
            } else {
                if (conn.style === 'curve') {
                     const t = 0.5;
                     const midX = (x1 + x2) / 2;
                     posx = Math.pow(1-t,3)*x1 + 3*Math.pow(1-t,2)*t*midX + 3*(1-t)*Math.pow(t,2)*midX + Math.pow(t,3)*x2;
                     posy = Math.pow(1-t,3)*y1 + 3*Math.pow(1-t,2)*t*y1 + 3*(1-t)*Math.pow(t,2)*y2 + Math.pow(t,3)*y2;
                } else {
                     posx = (x1 + x2) / 2; 
                     posy = (y1 + y2) / 2;
                }
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

    _drawConnection(boundsA, boundsB, connData, isTemp = false, isConnFullyHidden = false) {
        const cx1 = boundsA.x + boundsA.w/2;
        const cy1 = boundsA.y + boundsA.h/2;
        const cx2 = boundsB.x + boundsB.w/2;
        const cy2 = boundsB.y + boundsB.h/2;

        const hx_approx = (connData.pinned && connData.cx !== undefined) ? connData.cx : (cx1 + cx2) / 2;
        const hy_approx = (connData.pinned && connData.cy !== undefined) ? connData.cy : (cy1 + cy2) / 2;

        const p1 = this._getEdgePoint({x: hx_approx, y: hy_approx}, boundsA);
        const p2 = this._getEdgePoint({x: hx_approx, y: hy_approx}, boundsB);

        const x1 = p1.x, y1 = p1.y;
        const x2 = p2.x, y2 = p2.y;
        
        const color = connData.color || "#aaaaaa";
        const style = connData.style || 'curve'; 
        const strokeType = connData.strokeType || 'solid';

        let pathD = "";
        let posx = hx_approx, posy = hy_approx;

        if (style === 'straight') {
            if (!connData.pinned) {
                pathD = `M ${x1} ${y1} L ${x2} ${y2}`;
                posx = (x1 + x2) / 2;
                posy = (y1 + y2) / 2;
            } else {
                pathD = `M ${x1} ${y1} L ${hx_approx} ${hy_approx} L ${x2} ${y2}`;
            }
        } else if (style === 'orthogonal') {
            if (!connData.pinned) {
                const midX = (x1 + x2) / 2;
                pathD = `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
                posx = midX;
                posy = (y1 + y2) / 2;
            } else {
                pathD = `M ${x1} ${y1} L ${hx_approx} ${y1} L ${hx_approx} ${hy_approx} L ${x2} ${hy_approx} L ${x2} ${y2}`;
            }
        } else {
            if (!connData.pinned) {
                const midX = (x1 + x2) / 2;
                pathD = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
                const t = 0.5;
                posx = Math.pow(1-t,3)*x1 + 3*Math.pow(1-t,2)*t*midX + 3*(1-t)*Math.pow(t,2)*midX + Math.pow(t,3)*x2;
                posy = Math.pow(1-t,3)*y1 + 3*Math.pow(1-t,2)*t*y1 + 3*(1-t)*Math.pow(t,2)*y2 + Math.pow(t,3)*y2;
            } else {
                const ctrlX = 2 * hx_approx - 0.5 * (x1 + x2);
                const ctrlY = 2 * hy_approx - 0.5 * (y1 + y2);
                pathD = `M ${x1} ${y1} Q ${ctrlX} ${ctrlY} ${x2} ${y2}`;
            }
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

        // Интерактивная зона для двойного клика (чтобы голая линия была кликабельной)
        const clickPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        clickPath.setAttribute('d', pathD);
        clickPath.setAttribute('stroke', 'transparent');
        clickPath.setAttribute('stroke-width', '15');
        clickPath.setAttribute('fill', 'none');
        if (game.user.isGM && !isTemp) {
            clickPath.setAttribute('class', 'connection-svg-path');
            clickPath.setAttribute('data-conn-id', connData.id);
        }
        g.appendChild(clickPath);

        const dot1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot1.setAttribute('cx', x1);
        dot1.setAttribute('cy', y1);
        dot1.setAttribute('r', '4');
        dot1.setAttribute('fill', color);
        if (game.user.isGM && !isTemp) {
            dot1.setAttribute('class', 'conn-endpoint-svg');
            dot1.setAttribute('data-conn-id', connData.id);
            dot1.setAttribute('data-end', 'from');
        }
        g.appendChild(dot1);
        
        if (!connData.arrow || isTemp) {
            const dot2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            dot2.setAttribute('cx', x2);
            dot2.setAttribute('cy', y2);
            dot2.setAttribute('r', '4');
            dot2.setAttribute('fill', color);
            if (game.user.isGM && !isTemp) {
                dot2.setAttribute('class', 'conn-endpoint-svg');
                dot2.setAttribute('data-conn-id', connData.id);
                dot2.setAttribute('data-end', 'to');
            }
            g.appendChild(dot2);
        } else {
            // Даже если есть стрелка, добавим невидимую точку для драг-н-дропа
            const invisDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            invisDot.setAttribute('cx', x2);
            invisDot.setAttribute('cy', y2);
            invisDot.setAttribute('r', '4');
            invisDot.setAttribute('fill', 'transparent');
            if (game.user.isGM && !isTemp) {
                invisDot.setAttribute('class', 'conn-endpoint-svg');
                invisDot.setAttribute('data-conn-id', connData.id);
                invisDot.setAttribute('data-end', 'to');
            }
            g.appendChild(invisDot);
        }

        this.svgLayer.appendChild(g);

        // Условие скрытия блока: если это ветка И у нее нет текста И нет заметок, то блок HTML не создаем!
        const isBranch = this.mapData.connections.some(x => x.id === connData.from) || this.mapData.connections.some(x => x.id === connData.to);
        const shouldHideHTML = isBranch && !connData.text && !connData.hasNotes;

        if (!isTemp && !shouldHideHTML) {
            let handleHtml = '';
            const gmHiddenClass = (game.user.isGM && (connData.hidden || isConnFullyHidden)) ? 'gm-hidden-item' : '';
            if (game.user.isGM) {
                handleHtml = `
                <div class="connection-handle gm-handle ${gmHiddenClass}" data-id="${connData.id}" style="left: ${posx}px; top: ${posy}px;">
                    <div class="conn-inner">
                        <div class="conn-top-row">
                            <div class="conn-part-text conn-settings-btn" title="Shift+Клик - Новая ветка, Даблклик - Настройки">${connData.text || '<i class="fas fa-link"></i>'}</div>
                        </div>
                        <div class="conn-bottom-row">
                            <div class="conn-part-btn conn-vis-toggle ${connData.hidden ? 'active' : ''}" data-id="${connData.id}" title="Видимость">
                                <i class="fas ${connData.hidden ? 'fa-eye-slash' : 'fa-eye'}"></i>
                            </div>
                            <div class="conn-part-btn conn-lock-toggle ${connData.pinned ? 'active' : ''}" data-id="${connData.id}" title="Закрепить позицию (Булавка)">
                                <i class="fas fa-thumbtack"></i>
                            </div>
                            <div class="conn-part-btn conn-move-handle ${connData.pinned ? '' : 'disabled'}" data-id="${connData.id}" title="Переместить (требуется булавка)">
                                <i class="fas fa-arrows-alt"></i>
                            </div>
                        </div>
                    </div>
                    ${connData.hasNotes ? `<div class="connection-notes-wrapper">${this._renderNotesHTML(connData)}</div>` : ''}
                </div>`;
            } else {
                if (connData.text) {
                    handleHtml = `
                    <div class="connection-handle player-handle" data-id="${connData.id}" style="left: ${posx}px; top: ${posy}px;">
                        <div class="conn-inner">
                            <div class="conn-top-row">
                                <div class="conn-part-text">${connData.text}</div>
                            </div>
                        </div>
                        ${connData.hasNotes ? `<div class="connection-notes-wrapper">${this._renderNotesHTML(connData)}</div>` : ''}
                    </div>`;
                } else {
                    handleHtml = `
                    <div class="connection-handle player-handle empty-handle" data-id="${connData.id}" style="left: ${posx}px; top: ${posy}px;">
                        <div class="conn-inner"></div>
                        ${connData.hasNotes ? `<div class="connection-notes-wrapper">${this._renderNotesHTML(connData)}</div>` : ''}
                    </div>`;
                }
            }
            
            const handle = $(handleHtml);
            this.connectionLayer.append(handle);
        }

        return g;
    }

    /* --- Interaction Events --- */

    _onNodeMouseDown(e) {
        if (!game.user.isGM) {
            if (e.button === 2) {
                this.rmbStartNode = $(e.currentTarget).data('id');
                this.rmbStartPos = { x: e.clientX, y: e.clientY };
            }
            return;
        }

        e.stopPropagation(); 
        const el = $(e.currentTarget);
        const id = el.data('id');
        const node = this.mapData.nodes.find(n => n.id === id);
        
        if ($(e.target).closest('.node-control-btn, .entity-notes').length) return; 

        // Игнорируем нажатие, если это картинка (чтобы HTML5 dragstart мог вытащить портрет на сцену)
        if (e.target.tagName === 'IMG' && node.uuid) return;

        this.isDraggingNode = false;

        if (e.button === 2) {
            this.rmbStartNode = id;
            this.rmbStartPos = { x: e.clientX, y: e.clientY };
            return this._onContainerMouseDown(e);
        }

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

        this.draggingNodes = new Set();
        this.dragOffsets = {};
        this.selectedNodeIds.forEach(nodeId => {
            const n = this.mapData.nodes.find(x => x.id === nodeId);
            if (n) {
                this.draggingNodes.add(nodeId);
                this.dragOffsets[nodeId] = { x: pos.x - n.x, y: pos.y - n.y };
            }
        });
    }

    _onConnectionMouseDown(e) {
        if (!game.user.isGM) return;

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
            if (!doc) return;
            if (doc.documentName === "JournalEntry" || doc.documentName === "Item" || doc.documentName === "Actor") {
                doc.sheet.render(true, { editable: false });
            } else if (doc.documentName === "Scene") doc.view();
            else if (doc.sheet) doc.sheet.render(true, { editable: false });
        });
    }

    _onGroupVisibilityToggle(e) {
        e.preventDefault();
        e.stopPropagation();
        const groupEl = $(e.currentTarget).closest('.mindmap-group');
        const groupId = groupEl.data('id');
        const group = this.mapData.groups.find(g => g.id === groupId);
        if (group) {
            group.hidden = !group.hidden;
            MindMapData.updateMap(this.mapId, this.mapData);
        }
    }
    
    _onGroupHandleMouseDown(e) {
        if ($(e.target).closest('.group-btn').length) return; 

        e.stopPropagation();
        const groupEl = $(e.currentTarget).closest('.mindmap-group');
        const groupId = groupEl.data('id');
        const group = this.mapData.groups.find(g => g.id === groupId);
        if (!group) return;
        
        if (!game.user.isGM) return;
        
        this.draggingGroup = group;
        const coords = this._getCanvasCoords(e);
        this.groupDragStart = coords;
        
        const gHeight = group.height;
        this.draggingGroupNodes = [];
        (this.mapData.nodes || []).forEach(node => {
            const center = { x: node.x + (node.width || 160)/2, y: node.y + (node.height || 50)/2 }; 
            if (center.x >= group.x && center.x <= group.x + group.width &&
                center.y >= group.y && center.y <= group.y + gHeight) {
                this.draggingGroupNodes.push(node);
            }
        });
    }

    _onGroupResizeMouseDown(e) {
        e.stopPropagation();
        const groupEl = $(e.currentTarget).closest('.mindmap-group');
        const groupId = groupEl.data('id');
        const group = this.mapData.groups.find(g => g.id === groupId);
        if (!group) return;
        
        if (!game.user.isGM) return;

        this.resizingGroup = group;
        const coords = this._getCanvasCoords(e);
        this.groupResizeStart = { w: group.width, h: group.height, x: coords.x, y: coords.y };
    }

    _onNodeResizeMouseDown(e) {
        e.stopPropagation();
        const nodeEl = $(e.currentTarget).closest('.mindmap-node');
        if (nodeEl.length === 0) return;
        const nodeId = nodeEl.data('id');
        const node = this.mapData.nodes.find(n => n.id === nodeId);
        if (!node) return;
        
        if (!game.user.isGM) return;

        this.resizingNode = node;
        const coords = this._getCanvasCoords(e);
        this.nodeResizeStart = { w: nodeEl.outerWidth(), h: nodeEl.outerHeight(), x: coords.x, y: coords.y };
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

        if (this.resizingNode) {
            const dx = pos.x - this.nodeResizeStart.x;
            const dy = pos.y - this.nodeResizeStart.y;
            
            this.resizingNode.width = Math.max(50, this.nodeResizeStart.w + dx);
            this.resizingNode.height = Math.max(30, this.nodeResizeStart.h + dy);
            
            const nEl = this.nodesLayer.find(`[data-id="${this.resizingNode.id}"]`);
            nEl.css({ width: this.resizingNode.width, height: this.resizingNode.height });
            this._rerenderLinesOnly();
        }

        // Логика перемещения маркера связи
        if (this.draggingConnection) {
            const c = this.mapData.connections.find(x => x.id === this.draggingConnection);
            if (c) {
                c.cx = pos.x;
                c.cy = pos.y;
                c.pinned = true; 
                this._rerenderLinesOnly();
            }
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
        
        if (this.draggingGroup || this.resizingGroup || this.resizingNode || this.draggingConnection) {
            this.draggingGroup = null;
            this.resizingGroup = null;
            this.resizingNode = null;
            this.draggingConnection = null;
            this.draggingGroupNodes = [];
            MindMapData.updateMap(this.mapId, this.mapData); 
        }

        if (this.connectingSource) {
            this.container.removeClass('show-anchors'); 
            if (this.tempLine) this.tempLine.remove();
            
            const targetNode = $(document.elementFromPoint(e.clientX, e.clientY)).closest('.mindmap-node');
            const targetConn = $(document.elementFromPoint(e.clientX, e.clientY)).closest('.connection-handle');
            const targetGroup = $(document.elementFromPoint(e.clientX, e.clientY)).closest('.mindmap-group');
            const targetPath = $(document.elementFromPoint(e.clientX, e.clientY)).closest('.connection-svg-path');
            
            let tid = null;
            if (targetNode.length) tid = targetNode.data('id');
            else if (targetConn.length) tid = targetConn.data('id');
            else if (targetGroup.length) tid = targetGroup.data('id');
            else if (targetPath.length) tid = targetPath.attr('data-conn-id');
            
            if (tid && tid !== this.connectingSource) {
                if (this.reconnecting) {
                    // Восстанавливаем оторванную связь с новым концом
                    let restored = this.reconnecting.connData;
                    if (this.reconnecting.end === 'to') restored.to = tid;
                    else restored.from = tid;
                    this.mapData.connections.push(restored);
                } else {
                    // Создаем совершенно новую связь
                    if (!this.mapData.connections) this.mapData.connections = [];
                    this.mapData.connections.push({ 
                        id: foundry.utils.randomID(),
                        from: this.connectingSource, 
                        to: tid, 
                        color: "#aaaaaa",
                        text: "",
                        style: this.defaultLineStyle,
                        strokeType: 'solid',
                        arrow: false,
                        hidden: false
                    });
                }
            }
            // Если отпустили связь на пустое место (ни один tid не найден) И мы сейчас тянули оторванный конец
            // Мы просто ничего не сохраняем (она была временно удалена, так что связь остается разорванной).

            this.reconnecting = null;
            this.connectingSource = null;
            MindMapData.updateMap(this.mapId, this.mapData);
            this._renderGraph();
        }
    }

    async _openNodeDocument(nodeId) {
        const node = this.mapData.nodes.find(n => n.id === nodeId);
        if (!node) return;
        if (node.type === 'map' && node.targetId) {
            const maps = MindMapData.getMaps();
            if (maps[node.targetId]) {
                if (!game.user.isGM && maps[node.targetId].hidden) return ui.notifications.warn(game.i18n.localize("SIMPLE_MINDMAP.MAP_HIDDEN_GM"));
                this._switchMap(node.targetId);
            }
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

    _onGlobalMousedown(e) {
        // Очищаем выделение, если клик был вне окна MindMap
        if (this.element && !$(e.target).closest(this.element).length) {
            if ($(e.target).closest('.dialog, .filepicker, .tox').length) return; // Игнорируем клики по модалкам Фаундри
            
            if (this.selectedNodeIds.size > 0) {
                this.selectedNodeIds.clear();
                this._renderSelection();
            }
        }
    }

    _rerenderLinesOnly() {
        while (this.svgLayer.firstChild) this.svgLayer.removeChild(this.svgLayer.firstChild);
        this.connectionLayer.empty(); 
        
        let defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        this.svgLayer.appendChild(defs);

        const isGM = game.user.isGM;
        
        (this.mapData.connections || []).forEach(c => {
            let fromId = c.from;
            let toId = c.to;

            if (fromId === toId) return;

            const isConnExplicitlyHidden = c.hidden;
            const fromIsHidden = this.mapData.nodes.some(n=>n.id===c.from && n.hidden) || this.mapData.groups.some(g=>g.id===c.from && g.hidden);
            const toIsHidden = this.mapData.nodes.some(n=>n.id===c.to && n.hidden) || this.mapData.groups.some(g=>g.id===c.to && g.hidden);
            const isConnFullyHidden = isConnExplicitlyHidden || fromIsHidden || toIsHidden;

            if (!isGM && isConnFullyHidden) return;

            const srcBounds = this._getEntityBounds(fromId);
            const dstBounds = this._getEntityBounds(toId);
            
            const validSrc = this.mapData.nodes.some(n=>n.id===fromId) || this.mapData.groups.some(g=>g.id===fromId) || this.mapData.connections.some(x=>x.id===fromId);
            const validDst = this.mapData.nodes.some(n=>n.id===toId) || this.mapData.groups.some(g=>g.id===toId) || this.mapData.connections.some(x=>x.id===toId);

            if (validSrc && validDst) {
                 const g = this._drawConnection(srcBounds, dstBounds, c, false, isConnFullyHidden);
                 if (isGM && isConnFullyHidden) g.classList.add('gm-hidden-item');
            }
        });
    }

    _onKeyDown(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        if (e.key === "Delete") {
            if (!game.user.isGM) return;
            
            // Защита: удаляем только если мышка находится над окном модуля
            if (!this.isHovered) return;

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
                MindMapData.updateMap(this.mapId, this.mapData);
                this._renderGraph();
            }
        }
    }

    _onConnectionDblClick(e, target) {
        e.stopPropagation(); e.preventDefault();
        if (!game.user.isGM) return;

        const connId = target.data('id');
        const connection = this.mapData.connections.find(c => c.id === connId);
        if (!connection) return;

        const currentStyle = connection.style || 'curve';
        const currentStroke = connection.strokeType || 'solid';
        const isArrow = connection.arrow === true;
        const isHidden = connection.hidden === true;
        const hasNotes = connection.hasNotes === true;
        const isPinned = connection.pinned === true;

        new Dialog({
            title: game.i18n.localize("SIMPLE_MINDMAP.DIALOG_CONN_EDIT_TITLE") || "Настройки связи",
            content: `<div class="mm-dialog-content">
                    <div class="mm-dialog-row"><label>${game.i18n.localize("SIMPLE_MINDMAP.LABEL_TEXT") || "Текст"}</label><input type="text" id="conn-text" value="${connection.text || ''}" placeholder="${game.i18n.localize("SIMPLE_MINDMAP.PLACEHOLDER_CAPTION") || "Подпись..."}"></div>
                    <div class="mm-dialog-row"><label>${game.i18n.localize("SIMPLE_MINDMAP.LABEL_COLOR") || "Цвет"}</label><input type="color" id="conn-color" value="${connection.color || '#aaaaaa'}" style="height: 30px; padding: 0;"></div>
                    <div class="mm-dialog-row">
                        <label>${game.i18n.localize("SIMPLE_MINDMAP.LABEL_SHAPE") || "Форма"}</label>
                        <select id="conn-style">
                            <option value="curve" ${currentStyle === 'curve' ? 'selected' : ''}>${game.i18n.localize("SIMPLE_MINDMAP.LINE_STYLE_CURVE") || "Кривая"}</option>
                            <option value="straight" ${currentStyle === 'straight' ? 'selected' : ''}>${game.i18n.localize("SIMPLE_MINDMAP.LINE_STYLE_STRAIGHT") || "Прямая"}</option>
                            <option value="orthogonal" ${currentStyle === 'orthogonal' ? 'selected' : ''}>${game.i18n.localize("SIMPLE_MINDMAP.LINE_STYLE_ORTHOGONAL") || "Ломаная"}</option>
                        </select>
                    </div>
                    <div class="mm-dialog-row">
                        <label>${game.i18n.localize("SIMPLE_MINDMAP.LABEL_TYPE") || "Тип"}</label>
                        <select id="conn-stroke">
                            <option value="solid" ${currentStroke === 'solid' ? 'selected' : ''}>Сплошная</option>
                            <option value="dashed" ${currentStroke === 'dashed' ? 'selected' : ''}>Пунктир</option>
                            <option value="dotted" ${currentStroke === 'dotted' ? 'selected' : ''}>Точки</option>
                        </select>
                    </div>
                    <div class="mm-dialog-row">
                        <label>${game.i18n.localize("SIMPLE_MINDMAP.LABEL_ARROW") || "Стрелка"}</label>
                        <input type="checkbox" id="conn-arrow" ${isArrow ? 'checked' : ''}>
                    </div>
                    <div class="mm-dialog-row">
                        <label>${game.i18n.localize("SIMPLE_MINDMAP.LABEL_PINNED") || "Закрепить (Замок)"}</label>
                        <input type="checkbox" id="conn-pinned" ${isPinned ? 'checked' : ''}>
                    </div>
                    <div class="mm-dialog-row">
                        <label>${game.i18n.localize("SIMPLE_MINDMAP.LABEL_ENABLE_NOTES") || "Включить Заметки"}</label>
                        <input type="checkbox" id="conn-has-notes" ${hasNotes ? 'checked' : ''}>
                    </div>
                    ${game.user.isGM ? `
                    <div class="mm-dialog-row">
                        <label>${game.i18n.localize("SIMPLE_MINDMAP.LABEL_HIDDEN") || "Скрыть от игроков"}</label>
                        <input type="checkbox" id="conn-hidden" ${isHidden ? 'checked' : ''}>
                    </div>` : ''}
                </div>
            `,
            buttons: {
                save: {
                    label: game.i18n.localize("SIMPLE_MINDMAP.BUTTON_SAVE") || "Сохранить",
                    icon: '<i class="fas fa-check"></i>',
                    callback: (html) => {
                        connection.text = html.find('#conn-text').val();
                        connection.color = html.find('#conn-color').val();
                        connection.style = html.find('#conn-style').val();
                        connection.strokeType = html.find('#conn-stroke').val();
                        connection.arrow = html.find('#conn-arrow').is(':checked');
                        connection.hasNotes = html.find('#conn-has-notes').is(':checked');
                        
                        const newPinned = html.find('#conn-pinned').is(':checked');
                        if (newPinned && !connection.pinned) {
                            const handle = this.connectionLayer.find(`[data-id="${connId}"]`);
                            if (handle.length) {
                                connection.cx = parseFloat(handle.css('left'));
                                connection.cy = parseFloat(handle.css('top'));
                            }
                        }
                        connection.pinned = newPinned;

                        if (game.user.isGM) connection.hidden = html.find('#conn-hidden').is(':checked');
                        MindMapData.updateMap(this.mapId, this.mapData);
                        this._renderGraph();
                    }
                },
                delete: {
                    label: game.i18n.localize("SIMPLE_MINDMAP.BUTTON_DELETE") || "Удалить",
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
        if (!game.user.isGM) return;

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
        const bgColor = node.backgroundColor || "";
        const isTooltip = node.showTooltip === true;
        const isHidden = node.hidden === true;
        const hasNotes = node.hasNotes === true;

        const dialogContent = `
            <div class="mm-dialog-content">
                <div class="mm-dialog-row">
                    <label>Название</label>
                    <input type="text" id="node-name" value="${node.name}">
                </div>
                <div class="mm-dialog-row">
                    <label>Цвет фона</label>
                    <div style="display:flex; flex:1; gap:5px; align-items:center;">
                        <input type="color" id="node-bg" value="${bgColor === '' ? '#2b2b2b' : bgColor}" style="flex:1;">
                        <label style="flex: 0 0 auto; display:flex; align-items:center; gap:3px; font-weight: normal; font-size: 12px;">
                            <input type="checkbox" id="node-bg-default" ${bgColor === '' ? 'checked' : ''}>
                            По умолчанию
                        </label>
                    </div>
                </div>
                <div class="mm-dialog-row" style="align-items: flex-start;">
                    <label>Комментарий</label>
                    <textarea id="node-comment" rows="3" style="resize:vertical;">${comment}</textarea>
                </div>
                <div class="mm-dialog-row">
                    <label>${game.i18n.localize("SIMPLE_MINDMAP.LABEL_TOOLTIP") || "Текст как подсказка"}</label>
                    <input type="checkbox" id="node-tooltip" ${isTooltip ? 'checked' : ''}>
                </div>
                <div class="mm-dialog-row">
                    <label>${game.i18n.localize("SIMPLE_MINDMAP.LABEL_ENABLE_NOTES") || "Включить Заметки"}</label>
                    <input type="checkbox" id="node-has-notes" ${hasNotes ? 'checked' : ''}>
                </div>
                ${game.user.isGM ? `
                <div class="mm-dialog-row">
                    <label>${game.i18n.localize("SIMPLE_MINDMAP.LABEL_HIDDEN") || "Скрыть от игроков"}</label>
                    <input type="checkbox" id="node-hidden" ${isHidden ? 'checked' : ''}>
                </div>` : ''}
                <div class="mm-dialog-row">
                    <label>UUID ссылки</label>
                    <input type="text" id="node-link" value="${link}" placeholder="Вставьте UUID...">
                    <input type="hidden" id="node-link-name" value="${linkName}">
                </div>
                <div class="drop-zone" id="drop-zone-link">
                    Бросьте сюда объект для ссылки
                </div>
            </div>
        `;

        new Dialog({
            title: "Настройки Карточки",
            content: dialogContent,
            buttons: {
                save: {
                    label: "Сохранить",
                    icon: '<i class="fas fa-check"></i>',
                    callback: (html) => {
                        node.name = html.find('#node-name').val();
                        
                        if (html.find('#node-bg-default').is(':checked')) {
                            node.backgroundColor = "";
                        } else {
                            node.backgroundColor = html.find('#node-bg').val();
                        }
                        
                        node.comment = html.find('#node-comment').val();
                        node.showTooltip = html.find('#node-tooltip').is(':checked');
                        node.hasNotes = html.find('#node-has-notes').is(':checked');
                        node.commentLink = html.find('#node-link').val();
                        node.commentLinkName = html.find('#node-link-name').val();
                        if (game.user.isGM) {
                            node.hidden = html.find('#node-hidden').is(':checked');
                        }
                        
                        MindMapData.updateMap(this.mapId, this.mapData);
                        this._renderGraph();
                    }
                },
                delete: {
                    label: "Удалить Узел",
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
                                dropZone.innerText = `Связано: ${doc.name}`;
                                html.find('#node-link-name').val(doc.name);
                            }
                        }
                    } catch (e) { console.error(e); }
                });
            }
        }).render(true);
    }

    _onTextNodeDblClick(e, target) {
        if (!game.user.isGM) return;
        const nodeId = target.data('id');
        const node = this.mapData.nodes.find(n => n.id === nodeId);
        const style = node.style || { fontSize: 16, fontFamily: 'Signika', color: '#ffffff' };
        const isHidden = node.hidden === true;
        const hasNotes = node.hasNotes === true;
        const bgColor = node.backgroundColor || "transparent";

        new Dialog({
            title: "Настройки Текста",
            content: `
                <div class="mm-dialog-content">
                    <div class="mm-dialog-row"><label>Текст</label><input type="text" id="text-content" value="${node.name}"></div>
                    <div class="mm-dialog-row"><label>Размер (px)</label><input type="number" id="text-size" value="${style.fontSize}"></div>
                    <div class="mm-dialog-row"><label>Цвет текста</label><input type="color" id="text-color" value="${style.color}"></div>
                    <div class="mm-dialog-row"><label>Цвет фона</label>
                        <div style="display:flex; flex:1; gap:5px; align-items:center;">
                            <input type="color" id="text-bg-color" value="${bgColor === 'transparent' ? '#000000' : bgColor}" style="flex:1;">
                            <label style="flex: 0 0 auto; display:flex; align-items:center; gap:3px;">
                                <input type="checkbox" id="text-bg-transparent" ${bgColor === 'transparent' ? 'checked' : ''}>
                                Прозр.
                            </label>
                        </div>
                    </div>
                    <div class="mm-dialog-row"><label>Шрифт</label>
                        <select id="text-font">
                            <option value="Signika" ${style.fontFamily === 'Signika' ? 'selected' : ''}>Signika</option>
                            <option value="Arial" ${style.fontFamily === 'Arial' ? 'selected' : ''}>Arial</option>
                            <option value="Courier New" ${style.fontFamily === 'Courier New' ? 'selected' : ''}>Courier New</option>
                            <option value="Times New Roman" ${style.fontFamily === 'Times New Roman' ? 'selected' : ''}>Times New Roman</option>
                            <option value="Modesto Condensed" ${style.fontFamily === 'Modesto Condensed' ? 'selected' : ''}>Modesto</option>
                        </select>
                    </div>
                    <div class="mm-dialog-row">
                        <label>${game.i18n.localize("SIMPLE_MINDMAP.LABEL_ENABLE_NOTES") || "Включить Заметки"}</label>
                        <input type="checkbox" id="text-has-notes" ${hasNotes ? 'checked' : ''}>
                    </div>
                    ${game.user.isGM ? `
                    <div class="mm-dialog-row">
                        <label>${game.i18n.localize("SIMPLE_MINDMAP.LABEL_HIDDEN") || "Скрыть от игроков"}</label>
                        <input type="checkbox" id="text-hidden" ${isHidden ? 'checked' : ''}>
                    </div>` : ''}
                </div>
            `,
            buttons: {
                save: {
                    label: "Сохранить",
                    icon: '<i class="fas fa-check"></i>',
                    callback: (html) => {
                        node.name = html.find('#text-content').val();
                        node.style = {
                            fontSize: parseInt(html.find('#text-size').val()) || 16,
                            color: html.find('#text-color').val(),
                            fontFamily: html.find('#text-font').val()
                        };
                        
                        if (html.find('#text-bg-transparent').is(':checked')) {
                            node.backgroundColor = "transparent";
                        } else {
                            node.backgroundColor = html.find('#text-bg-color').val();
                        }
                        
                        node.hasNotes = html.find('#text-has-notes').is(':checked');
                        if (game.user.isGM) {
                            node.hidden = html.find('#text-hidden').is(':checked');
                        }
                        MindMapData.updateMap(this.mapId, this.mapData);
                        this._renderGraph();
                    }
                },
                delete: {
                    label: "Удалить",
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
        if (!game.user.isGM) return;
        const groupEl = target.closest('.mindmap-group');
        const groupId = groupEl.data('id');
        const group = this.mapData.groups.find(g => g.id === groupId);
        if (!group) return;
        const hasNotes = group.hasNotes === true;

        new Dialog({
            title: "Настройки Поля",
            content: `
                <div class="mm-dialog-content">
                    <div class="mm-dialog-row"><label>Название</label><input type="text" id="group-name" value="${group.name}"></div>
                    <div class="mm-dialog-row"><label>Цвет</label><input type="color" id="group-color" value="${group.color}"></div>
                    <div class="mm-dialog-row"><label>Прозрачность</label><input type="number" id="group-alpha" value="${group.alpha}" min="0" max="1" step="0.1"></div>
                    <div class="mm-dialog-row">
                        <label>${game.i18n.localize("SIMPLE_MINDMAP.LABEL_BG_IMAGE") || "Фон"}</label>
                        <div style="display: flex; flex: 1; gap: 5px;">
                            <input type="text" id="group-bg-image" value="${group.bgImage || ''}">
                            ${game.user.isGM ? `<button type="button" class="file-picker" data-type="image" data-target="group-bg-image" title="Browse Files" style="flex: 0 0 30px;"><i class="fas fa-file-import fa-fw"></i></button>` : ''}
                        </div>
                    </div>
                    <div class="mm-dialog-row">
                        <label>${game.i18n.localize("SIMPLE_MINDMAP.LABEL_ENABLE_NOTES") || "Включить Заметки"}</label>
                        <input type="checkbox" id="group-has-notes" ${hasNotes ? 'checked' : ''}>
                    </div>
                </div>
            `,
            buttons: {
                save: {
                    label: "Сохранить",
                    icon: '<i class="fas fa-save"></i>',
                    callback: (html) => {
                        group.name = html.find('#group-name').val();
                        group.color = html.find('#group-color').val();
                        group.alpha = parseFloat(html.find('#group-alpha').val());
                        group.bgImage = html.find('#group-bg-image').val();
                        group.hasNotes = html.find('#group-has-notes').is(':checked');
                        MindMapData.updateMap(this.mapId, this.mapData);
                        this._renderGraph();
                    }
                },
                delete: {
                    label: "Удалить",
                    icon: '<i class="fas fa-trash"></i>',
                    callback: () => {
                        this.mapData.groups = this.mapData.groups.filter(g => g.id !== groupId);
                        MindMapData.updateMap(this.mapId, this.mapData);
                        this._renderGraph();
                    }
                }
            }, 
            default: "save",
            render: (html) => {
                html.find('.file-picker').click(ev => {
                    ev.preventDefault();
                    const target = $(ev.currentTarget).data('target');
                    new FilePicker({
                        type: "image",
                        callback: path => { html.find(`#${target}`).val(path); }
                    }).render(true);
                });
            }
        }).render(true);
    }

    async _onAddNote(e) {
        e.stopPropagation();
        if (!game.user.isGM) return; // Раз игроки больше не редактируют

        const btn = $(e.currentTarget);
        const container = btn.closest('.entity-notes');
        const id = container.data('id');
        const input = container.find('.new-note-input').val().trim();
        
        const cb = container.find('.is-gm-note-cb');
        const isGmNote = cb.length ? cb.is(':checked') : false;
        
        if (!input) return;
        
        const newNote = {
            id: foundry.utils.randomID(),
            text: input,
            author: game.user.name,
            userId: game.user.id,
            isGM: isGmNote
        };
        
        let entity = (this.mapData.nodes || []).find(n => n.id === id) || 
                     (this.mapData.groups || []).find(g => g.id === id) || 
                     (this.mapData.connections || []).find(c => c.id === id);
                     
        if (!entity) return;
        
        if (!entity.notes) entity.notes = [];
        entity.notes.push(newNote);
        
        await MindMapData.updateMap(this.mapId, this.mapData);
        this._renderGraph(); 
    }
    
    async _onDeleteNote(e) {
        e.stopPropagation();
        if (!game.user.isGM) return; // Раз игроки больше не редактируют

        const id = $(e.currentTarget).data('target');
        const noteId = $(e.currentTarget).data('note');
        
        let entity = (this.mapData.nodes || []).find(n => n.id === id) || 
                     (this.mapData.groups || []).find(g => g.id === id) || 
                     (this.mapData.connections || []).find(c => c.id === id);
                     
        if (!entity || !entity.notes) return;
        
        entity.notes = entity.notes.filter(n => n.id !== noteId);
        await MindMapData.updateMap(this.mapId, this.mapData);
        this._renderGraph();
    }

    _onQuickVisToggle(e) {
        e.stopPropagation();
        if (!game.user.isGM) return;
        const btn = $(e.currentTarget);
        const id = btn.data('id');
        
        let entity = this.mapData.nodes.find(n => n.id === id) || this.mapData.connections.find(c => c.id === id);
        if (entity) {
            entity.hidden = !entity.hidden;
            MindMapData.updateMap(this.mapId, this.mapData);
            this._renderGraph();
        }
    }

    _onConnLockToggle(e) {
        e.stopPropagation();
        if (!game.user.isGM) return; 
        
        const btn = $(e.currentTarget);
        const id = btn.data('id');
        
        let entity = this.mapData.connections.find(c => c.id === id);
        if (entity) {
            entity.pinned = !entity.pinned;
            if (entity.pinned) {
                const handle = this.connectionLayer.find(`[data-id="${id}"]`);
                if (handle.length) {
                    entity.cx = parseFloat(handle.css('left'));
                    entity.cy = parseFloat(handle.css('top'));
                }
            } else {
                entity.cx = undefined;
                entity.cy = undefined;
            }
            MindMapData.updateMap(this.mapId, this.mapData);
            this._renderGraph();
        }
    }
}

/* -------------------------------------------- */
/* 3. Integration & App Launch                  */
/* -------------------------------------------- */

async function startMindMap() {
    const maps = MindMapData.getMaps();
    const lastId = MindMapData.getLastMapId();
    const mapIds = Object.keys(maps);
    let targetId = null;
    
    if (lastId && maps[lastId]) targetId = lastId;
    else if (mapIds.length > 0) targetId = mapIds[0];

    // Открываем редактор (Foundry сам управляет ui.windows)
    const existing = Object.values(ui.windows).find(w => w.id === "mindmap-editor" || w instanceof MindMapEditor);
    if (existing) {
        existing.mapId = targetId;
        existing._loadMapData();
        existing._applyDefaultView();
        existing.render(true);
        existing.bringToTop();
    } else {
        new MindMapEditor(targetId).render(true);
    }
}

Hooks.once('init', () => {
    console.log("Simple MindMap | Init");
    
    game.settings.register(MODULE_ID, SETTING_KEY, { 
        name: game.i18n.localize("SIMPLE_MINDMAP.TITLE") || "Simple MindMap", 
        scope: "world", 
        config: false,
        restricted: false, 
        type: Object, 
        default: {},
        onChange: () => {
            for (const w of Object.values(ui.windows)) {
                if (w.id === "mindmap-editor" || w instanceof MindMapEditor) {
                    w._loadMapData();
                    w.render(true);
                }
            }
        }
    }); 
    
    game.settings.register(MODULE_ID, LAST_MAP_KEY, { 
        name: game.i18n.localize("SIMPLE_MINDMAP.LAST_MAP_ID_SETTING") || "Last Opened Map ID", 
        scope: "client", 
        config: false, 
        type: String, 
        default: "" 
    });

    game.settings.register(MODULE_ID, 'theme', {
        name: "Тема оформления",
        hint: "Светлая или Темная тема для холста MindMap.",
        scope: "client",
        config: true,
        type: String,
        choices: {
            "dark": "Темная",
            "light": "Светлая"
        },
        default: "dark",
        onChange: () => {
            for (const w of Object.values(ui.windows)) {
                if (w.id === "mindmap-editor" || w instanceof MindMapEditor) w.render(true);
            }
        }
    });

    game.settings.register(MODULE_ID, 'fontFamily', {
        name: "Шрифт интерфейса",
        hint: "Шрифт, который будет применяться к узлам и тексту на карте.",
        scope: "client",
        config: true,
        type: String,
        choices: {
            "Signika": "Signika",
            "Arial": "Arial",
            "Courier New": "Courier",
            "Times New Roman": "Times",
            "Modesto Condensed": "Modesto"
        },
        default: "Signika",
        onChange: () => {
            for (const w of Object.values(ui.windows)) {
                if (w.id === "mindmap-editor" || w instanceof MindMapEditor) w.render(true);
            }
        }
    });

    game.settings.register(MODULE_ID, 'resetFloatingButton', {
        name: "Вернуть кнопку в центр",
        hint: "Поставьте галочку и сохраните, если вы потеряли плавающую кнопку MindMap (она вернётся в центр экрана).",
        scope: "client",
        config: true,
        type: Boolean,
        default: false,
        onChange: (val) => {
            if (val) {
                const w = (window.innerWidth / 2) - 23;
                const h = (window.innerHeight / 2) - 23;
                localStorage.setItem('simple-mindmap-btn-pos', JSON.stringify({ left: w + 'px', top: h + 'px' }));
                const btn = $('#simple-mindmap-floating-btn');
                if (btn.length) {
                    btn.css({ left: w + 'px', top: h + 'px', bottom: 'auto' });
                }
                setTimeout(() => game.settings.set(MODULE_ID, 'resetFloatingButton', false), 200);
            }
        }
    });

    if (!$('#simple-mindmap-css').length) $('head').append(`<style id="simple-mindmap-css">${MINDMAP_CSS}</style>`);
    
    window.SimpleMindMap = { open: startMindMap };
    window.SimpleMindMapManager = class { render(force) { startMindMap(); } };
});

Hooks.once("ready", () => {
    // --- ПЛАВАЮЩАЯ КНОПКА ---
    if ($('#simple-mindmap-floating-btn').length === 0) {
        const title = game.i18n.localize("SIMPLE_MINDMAP.TITLE") || "Simple MindMap";
        const btn = $(`
            <div id="simple-mindmap-floating-btn" title="${title}" style="
                position: fixed;
                left: 15px;
                top: 85vh; /* Initial top, will be overridden by saved pos */
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
                transition: transform 0.2s ease-in-out, border-color 0.2s, color 0.2s, background 0.2s;
            ">
                <i class="fas fa-project-diagram"></i>
            </div>
        `);

        // Загрузка сохраненной позиции с защитой от вылета за границы экрана
        const savedPosStr = localStorage.getItem('simple-mindmap-btn-pos');
        if (savedPosStr) {
            try {
                const savedPos = JSON.parse(savedPosStr);
                let left = parseInt(savedPos.left);
                let top = parseInt(savedPos.top);
                
                // Защита от вылета за границы (например, при ресайзе окна)
                if (left < 0) left = 15;
                if (top < 0) top = 15;
                if (left > window.innerWidth - 50) left = window.innerWidth - 60;
                if (top > window.innerHeight - 50) top = window.innerHeight - 60;
                
                btn.css({ left: left + 'px', top: top + 'px', bottom: 'auto' });
            } catch(e) { }
        }

        btn.hover(
            function() { 
                if (!$(this).hasClass('dragging')) {
                    $(this).css({ transform: 'scale(1.1) translateY(-2px)', borderColor: '#ff6400', color: '#fff', background: 'rgba(50, 50, 50, 0.95)' }); 
                }
            },
            function() { 
                if (!$(this).hasClass('dragging')) {
                    $(this).css({ transform: 'scale(1) translateY(0)', borderColor: '#555', color: '#ff6400', background: 'rgba(30, 30, 30, 0.85)' }); 
                }
            }
        );

        let isDragging = false;
        let dragThresholdMet = false;
        let startX, startY, initialLeft, initialTop;

        btn.on('mousedown', (e) => {
            if (e.button !== 0) return; // Только левый клик
            isDragging = true;
            dragThresholdMet = false;
            startX = e.clientX;
            startY = e.clientY;
            const pos = btn.position();
            initialLeft = pos.left;
            initialTop = pos.top;

            const onMouseMove = (ev) => {
                if (!isDragging) return;
                if (Math.abs(ev.clientX - startX) > 3 || Math.abs(ev.clientY - startY) > 3) {
                    dragThresholdMet = true;
                    btn.addClass('dragging');
                    btn.css({ 
                        left: initialLeft + (ev.clientX - startX), 
                        top: initialTop + (ev.clientY - startY), 
                        bottom: 'auto',
                        cursor: 'grabbing',
                        transform: 'scale(1) translateY(0)'
                    });
                }
            };

            const onMouseUp = (ev) => {
                isDragging = false;
                $(document).off('mousemove', onMouseMove);
                $(document).off('mouseup', onMouseUp);
                btn.removeClass('dragging');
                btn.css('cursor', 'pointer');
                if (dragThresholdMet) {
                    localStorage.setItem('simple-mindmap-btn-pos', JSON.stringify({ left: btn.css('left'), top: btn.css('top') }));
                }
            };

            $(document).on('mousemove', onMouseMove);
            $(document).on('mouseup', onMouseUp);
        });

        btn.on('click', (e) => {
            if (dragThresholdMet) { 
                e.preventDefault(); 
                e.stopPropagation();
                dragThresholdMet = false;
                return; 
            }
            startMindMap();
        });

        $('body').append(btn);
    }
});