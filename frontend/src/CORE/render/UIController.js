import { stateManager } from "../managers/stateManager";
import { submitAssignment } from "../external-services/moodle-service/moodleService";
import { emitEvent } from "../events/eventBus";
import { getPath } from "../config-parser/getPath";

const registry = {
    audios: new Set(),
    timers: new Set(),
    assetVersion: Date.now(),
    purge() {
        this.audios.forEach(a => {
            if (!a.__transitional) {
                a.pause();
                a.src = "";
                this.audios.delete(a);
            }
        });

        this.timers.forEach(t => clearTimeout(t));
        this.timers.clear();

        this.assetVersion = Date.now();
    }
};
// UIController: puente entre acciones YAML y la aplicación
export const UIController = {

    // ---------------------------------------
    // ELEMENTOS DE UI
    // ---------------------------------------
    showElement(id) {
        const activeElements = stateManager.get("activeElements") || {};
        stateManager.set("activeElements", { ...activeElements, [id]: true });
    },

    hideElement(id) {
        const activeElements = stateManager.get("activeElements") || {};
        stateManager.set("activeElements", { ...activeElements, [id]: false });
    },

    // ---------------------------------------
    // NAVEGACIÓN
    // ---------------------------------------
    previousSlide() {
        registry.purge(); // Detener audios/timers del slide actual
        const currentIndex = stateManager.get("slideIndex") || 0;
        stateManager.set("slideIndex", Math.max(currentIndex - 1, 0));
    },

    nextSlide() {
        registry.purge();
        const currentIndex = stateManager.get("slideIndex") || 0;
        const max = stateManager.get("slideCount") || 0;
        stateManager.set("slideIndex", Math.min(currentIndex + 1, max - 1));
    },

    gotoId(slideId, scene) {
        if (!scene?.slides) return console.warn("gotoId: Escena sin slides");

        const index = scene.slides.findIndex(s => s.id === slideId);
        if (index === -1) return console.warn(`gotoId: Slide ${slideId} no encontrado`);

        registry.purge(); // Limpiar antes de movernos
        stateManager.set("slideIndex", index);
        this.applyVisibilityRules(scene);

        const target = scene.slides[index];
        if (target?.on_enter) this.execute(target.on_enter, scene);
    },

    gotoScene(filename, scene = null) {
        registry.purge();
        const sceneFile = `${filename}.yaml`;

        stateManager.set("currentSceneFile", sceneFile);
        stateManager.set("slideIndex", 0);

        if (scene) {
            this.applyVisibilityRules(scene);
            if (scene.on_enter) this.execute(scene.on_enter, scene);
            if (scene.slides?.[0]?.on_enter) this.execute(scene.slides[0].on_enter, scene);
        }

        emitEvent("scene:request", sceneFile);
    },

    // ---------------------------------------
    // MEDIA
    // ---------------------------------------
    playVideo(videoId) {
        stateManager.set("videoId", videoId);
    },

    playSound(soundId, scene, options = {}) {
        const rawSrc = scene?.assets?.audios?.[soundId]?.src || soundId;
        const path = getPath(rawSrc);
        const url = `${path}${path.includes('?') ? '&' : '?'}v=${registry.assetVersion}`;

        const audio = new Audio(url);
        audio.__transitional = options.transitional === true;

        registry.audios.add(audio);

        const cleanup = () => registry.audios.delete(audio);
        audio.addEventListener('ended', cleanup, { once: true });
        audio.addEventListener('error', cleanup, { once: true });

        audio.play().catch(e => {
            if (e.name !== 'AbortError') {
                console.warn("Audio play error:", e);
            }
        });
    },

    audioFinished() {
        emitEvent("audio_finished");
    },

    // ---------------------------------------
    // TEMPORIZADORES
    // ---------------------------------------
    wait(milliseconds) {
        const delay = parseInt(milliseconds, 10) || 1000;
        const timer = setTimeout(() => {
            emitEvent(`wait:end:${delay}`);
            registry.timers.delete(timer);
        }, delay);
        registry.timers.set(timer);
    },

    // ---------------------------------------
    // SUBIR ARCHIVOS
    // ---------------------------------------
    async uploadFile(action) {
        const file = action.__file;
        if (!file) return console.error("No hay archivo para subir");

        try {
            emitEvent(`upload:start:${action.id}`);
            const result = await submitAssignment(action.assignmentId, file);

            // Actualizar estado de moodle de forma inmutable
            const assignments = stateManager.get("assignments") || [];
            stateManager.set("assignments", assignments.map(a =>
                a.id === action.assignmentId ? { ...a, submissionstatus: "submitted" } : a
            ));

            emitEvent(`upload:success:${action.id}`);
            return result;
        } catch (error) {
            emitEvent(`upload:error:${action.id}`);
            throw error; // Re-lanzar para que el motor de UI sepa que falló
        }
    },

    // ---------------------------------------
    // MARCAR COMPLETADO
    // ---------------------------------------
    markComplete(assignmentId) {
        stateManager.markAssignmentComplete(assignmentId);
        emitEvent(`success:${assignmentId}`);
    },

    // ---------------------------------------
    // VARIABLES DE ESTADO
    // ---------------------------------------

    // Convierte un string a su tipo correcto (número, booleano, etc)
    _parseValue(val) {
        if (val === "true") return true;
        if (val === "false") return false;
        const n = Number(val);
        return (!isNaN(n) && val !== "") ? n : val;
    },

    // Divide un argumento en partes (key, value, etc)
    _parseArgument(arg) {
        if (!arg) return [];
        const str = arg.toString();

        // Buscamos el primer separador (sea coma o dos puntos)
        const match = str.match(/[:|,]/);
        if (!match) return [str.trim()];

        const index = match.index;
        return [
            str.substring(0, index).trim(), // Llave
            str.substring(index + 1).trim() // Todo lo demás (Valor)
        ];
    },

    setStateVariable(arg) {
        const [key, rawVal] = this._parseArgument(arg);
        if (!key || rawVal === undefined) return;

        stateManager.set(key, this._parseValue(rawVal));
    },

    incrementState(arg) {
        const parts = this._parseArgument(arg);
        const key = parts[0];
        const incrementBy = parseInt(parts[1], 10) || 1;
        console.log(key, incrementBy)
        stateManager.set(key, `+${incrementBy}`);
    },

    decrementState(arg) {
        const parts = this._parseArgument(arg);
        const key = parts[0];
        const decrementBy = parseInt(parts[1], 10) || 1;

        stateManager.set(key, `+${-decrementBy}`);
    },

    callMethod(arg) {
        const parts = this._parseArgument(arg);
        const methodName = parts[0];
        const parameter = parts[1];

        // Primero busca en stateManager
        if (typeof stateManager[methodName] === "function") {
            stateManager[methodName](parameter);
            return;
        }

        // Luego busca en UIController
        if (typeof this[methodName] === "function") {
            this[methodName](parameter);
            return;
        }

        console.warn(`callMethod: método "${methodName}" no encontrado`);
    },

    // ---------------------------------------
    // VARIABLES PERSONALIZADAS (localStorage/sessionStorage)
    // ---------------------------------------

    setCustomVariable(arg) {
        const [key, remainder] = this._parseArgument(arg);
        if (!key || remainder === undefined) return;

        let storageType = "local";
        let rawValue = remainder;
        const storagePrefix = remainder.match(/^(local|session)[:|,]/i);

        if (storagePrefix) {
            storageType = storagePrefix[1].toLowerCase();
            rawValue = remainder.substring(storagePrefix[0].length).trim();
        }

        let value;
        try {
            value = (rawValue.startsWith('{') || rawValue.startsWith('['))
                ? JSON.parse(rawValue)
                : this._parseValue(rawValue);
        } catch {
            value = this._parseValue(rawValue);
        }

        stateManager.setCustom(key, value, storageType);
    },

    incrementCustom(arg) {
        const parts = this._parseArgument(arg);
        const key = parts[0];

        let storageType = "local";
        let incrementBy = 1;

        // Detectar si especificaron tipo de storage
        if (parts[1] === "local" || parts[1] === "session") {
            storageType = parts[1];
            incrementBy = Number(parts[2]) || 1;
        } else {
            incrementBy = Number(parts[1]) || 1;
        }

        const currentValue = stateManager.getCustom(key, storageType);
        const currentNumber = typeof currentValue === "number"
            ? currentValue
            : Number(currentValue) || 0;

        const newValue = currentNumber + incrementBy;

        this.setCustomVariable(`${key}:${storageType}:${newValue}`);
    },

    decrementCustom(arg) {
        const parts = this._parseArgument(arg);
        const key = parts[0];

        let storageType = "local";
        let decrementBy = 1;

        if (parts[1] === "local" || parts[1] === "session") {
            storageType = parts[1];
            decrementBy = Number(parts[2]) || 1;
        } else {
            decrementBy = Number(parts[1]) || 1;
        }

        const currentValue = stateManager.getCustom(key, storageType);
        const currentNumber = typeof currentValue === "number"
            ? currentValue
            : Number(currentValue) || 0;

        const newValue = currentNumber - decrementBy;

        this.setCustomVariable(`${key}:${storageType}:${newValue}`);
    },


    // ---------------------------------------
    // EVALUACIÓN DE CONDICIONES
    // ---------------------------------------

    evaluateCondition(expression) {
        if (!expression) return false;
        try {
            const state = stateManager.get() || {};
            const customStore = stateManager.getCustom ? stateManager.getCustom() : {};
            const custom = {
                ...customStore,
                get(key) {
                    return stateManager.getCustom ? stateManager.getCustom(key) : undefined;
                }
            };
            // Creamos un inyector de contexto limpio
            const context = { ...state, state, custom };
            const keys = Object.keys(context);
            const values = Object.values(context);
            // Generamos la función: (keys) => expression
            const evaluator = new Function(...keys, `return Boolean(${expression});`);

            return evaluator(...values);
        } catch (e) {
            console.warn(`Error evaluando: ${expression}`, e);
            return false;
        }
    },

    // ---------------------------------------
    // REGLAS DE VISIBILIDAD
    // ---------------------------------------

    applyVisibilityRules(scene) {
        if (!scene) return;
        const currentIndex = stateManager.get("slideIndex") || 0;
        const elements = scene.slides?.[currentIndex]?.elements || scene.elements || [];
        const process = (el) => {
            if (!el) return;
            const cond = el.visible_if || el.visibleIf || el.visibleIfCondition;

            if (cond && el.id) {
                const isVisible = this.evaluateCondition(cond);
                this[isVisible ? 'showElement' : 'hideElement'](el.id);
            }
            if (Array.isArray(el.elements)) el.elements.forEach(process);
        };

        elements.forEach(process);
    },

    // ---------------------------------------
    // EJECUTOR DE ACCIONES
    // ---------------------------------------

    // Normaliza una acción a formato { type, arg }
    _normalizeAction(action) {
        if (typeof action === "string") {
            const [type, arg] = this._parseArgument(action);
            return { type, arg, raw: action };
        }
        if (action?.type) {
            return {
                type: action.type.replace(/^:/, ""),
                arg: action.arg ?? action.value,
                raw: action
            };
        }
        return null;
    },

    // Dentro del objeto UIController...
    async execute(action, scene = null) {
        if (!action) return;
        const actions = Array.isArray(action) ? action : [action];

        for (const raw of actions) {
            const normalized = this._normalizeAction(raw);
            if (!normalized) continue;

            const { type, arg } = normalized;

            const handlers = {
                "show": () => this.showElement(arg),
                "hide": () => this.hideElement(arg),
                "previous_slide": () => this.previousSlide(),
                "next_slide": () => this.nextSlide(),
                "goto_scene": () => this.gotoScene(arg, scene),
                "goto_id": () => this.gotoId(arg, scene),
                "play_video": () => this.playVideo(arg),
                "play_sound": () => this.playSound(arg, scene),
                "play_sound_transition": () =>
                    this.playSound(arg, scene, { transitional: true }),
                "audio_finished": () => this.audioFinished(),
                "wait": () => this.wait(arg),
                "upload_file": () => this.uploadFile(normalized.raw),
                "mark_complete": () => {
                    stateManager.markAssignmentComplete(arg);
                    emitEvent(`success:${arg}`);
                },
                "end": () => { emitEvent(`end:${arg}`) },
                "set": () => this.setStateVariable(arg),
                "inc": () => this.incrementState(arg),
                "dec": () => this.decrementState(arg),
                "call": () => this.callMethod(arg),
                "custom_set": () => this.setCustomVariable(arg),
                "custom_inc": () => this.incrementCustom(arg),
                "custom_dec": () => this.decrementCustom(arg),
                "if": async () => {
                    if (this.evaluateCondition(arg) && normalized.raw.actions) {
                        await this.execute(normalized.raw.actions, scene);
                    }
                }
            };

            if (handlers[type]) {
                await handlers[type]();
            }
        }

        // Sincronizar visibilidad después de cualquier cambio de estado
        if (scene) this.applyVisibilityRules(scene);
    }
};