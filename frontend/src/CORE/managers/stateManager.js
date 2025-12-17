// CORE/state/StateManager.js
import { emitEvent } from "../events/eventBus";
import { getStorageKey } from "../config-parser/getPath";

const STORAGE_KEY = getStorageKey();

const PERSISTENCE_MAP = {
  slideIndex: "session",
  currentSceneFile: "session",
  activeElements: "session",
  videoId: "session",
  assignments: "session",
  score: "local",
  current_role: "local"
};

const storageEngines = {
  local: {
    get: (k) => localStorage.getItem(k),
    set: (k, v) => localStorage.setItem(k, v)
  },
  session: {
    get: (k) => sessionStorage.getItem(k),
    set: (k, v) => sessionStorage.setItem(k, v)
  }
};


class StateManager {
  constructor() {
    this.state = {
      slideIndex: 0,
      currentSceneFile: null,
      activeElements: {},
      videoId: null,
      score: 0,
      current_role: null,
      assignments: []      // siempre array en memoria
    };

    // Almacenes separados para persistencia optimizada
    this.customStorage = {
      local: {},
      session: {}
    };
    
    // Vista unificada para acceso rápido
    this.custom = {};

    this.load();
  }

  get(key) {
    return key ? this.state[key] : this.state;
  }

  getCustom(key) {
    return key ? this.custom[key] : this.custom;
  }
  
  set(key, value) {
    let finalValue = value;

    if (typeof value === "string" && value.startsWith("+")) {
      const add = parseInt(value.substring(1), 10) || 0;
      finalValue = (this.state[key] || 0) + add;
    } else if (value === "true") finalValue = true;
    else if (value === "false") finalValue = false;

    this.state[key] = finalValue;

    emitEvent(`state:${key}:changed`, finalValue);
    emitEvent('state:changed', this.state);
    this.save(key);
  }

  setCustom(key, value, storageType = null) {
    // 1. Actualizar vista unificada
    this.custom[key] = value;
  
    // 2. Actualizar almacenamiento específico si se indica
    if (storageType && (storageType === "local" || storageType === "session")) {
      this.customStorage[storageType][key] = value;
      this.saveCustomStore(storageType);
    }

    // 3. Eventos reactivos
    emitEvent(`custom:${key}:changed`, value);
    emitEvent('custom:changed', this.custom);
  }

  saveCustomStore(type) {
    try {
      const json = JSON.stringify(this.customStorage[type]);
      storageEngines[type].set(`${STORAGE_KEY}:custom_store:${type}`, json);
    } catch (e) {
      console.error(`SM Error al guardar custom_store:${type}`, e);
    }
  }

  markAssignmentComplete(assignmentName, key = "submissionstatus", value = "submitted") {
    const currentList = Array.isArray(this.state.assignments) ? this.state.assignments : [];
    
    // Encontrar índice
    const index = currentList.findIndex(a => a.name === assignmentName);
    
    let newList;

    if (index === -1) {
      // Agregar nuevo (inmutable)
      newList = [
        ...currentList,
        {
          id: assignmentName,
          name: assignmentName,
          [key]: value
        }
      ];
    } else {
      // Actualizar existente (inmutable)
      newList = currentList.map((item, i) => {
        if (i === index) {
          return { ...item, [key]: value };
        }
        return item;
      });
    }

    this.state.assignments = newList;
    this.save("assignments");

    emitEvent("state:assignments:changed", newList);
  }

  save(key) {
    const engine = PERSISTENCE_MAP[key];
    if (!engine) return;

    try {
      const json = JSON.stringify(this.state[key]);
      storageEngines[engine].set(`${STORAGE_KEY}:${key}`, json);
    } catch (e) {
      console.error(`SM Error al guardar ${key}`, e);
    }
  }

  load() {
    // 1. Cargar estado base
    Object.keys(this.state).forEach((key) => {
      const engine = PERSISTENCE_MAP[key];
      if (!engine) return;

      try {
        const raw = storageEngines[engine].get(`${STORAGE_KEY}:${key}`);
        if (raw != null) {
          const parsed = JSON.parse(raw);
          this.state[key] = parsed;
        }
      } catch (e) {
        console.warn(`SM Warning al cargar ${key}`, e);
      }
    });

    // Normalización de assignments
    if (!Array.isArray(this.state.assignments)) {
      this.state.assignments = [];
    }
  
    // 2. Cargar custom stores (Optimizado)
    ["local", "session"].forEach((type) => {
      try {
        const raw = storageEngines[type].get(`${STORAGE_KEY}:custom_store:${type}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          this.customStorage[type] = parsed || {};
        } else {
          this.customStorage[type] = {};
        }
      } catch (e) {
        console.warn(`SM Warning al cargar custom_store:${type}`, e);
        this.customStorage[type] = {};
      }
    });

    // 3. Reconstruir vista unificada
    this.custom = {
      ...this.customStorage.local,
      ...this.customStorage.session
    };
  }
}

export const stateManager = new StateManager();
