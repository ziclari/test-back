import { stateManager } from "../managers/stateManager";
import { submitAssignment } from "../external-services/moodle-service/moodleService";
import { emitEvent } from "../events/eventBus";
import { getPath } from "../config-parser/getPath";

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
        const currentIndex = stateManager.get("slideIndex") || 0;
        const newIndex = Math.max(currentIndex - 1, 0);
        stateManager.set("slideIndex", newIndex);
    },

    nextSlide() {
        const currentIndex = stateManager.get("slideIndex") || 0;
        const maxSlides = stateManager.get("slideCount") || 0;
        const newIndex = Math.min(currentIndex + 1, maxSlides - 1);
        stateManager.set("slideIndex", newIndex);
    },

    gotoId(slideId, scene) {
        if (!scene || !Array.isArray(scene.slides)) {
            console.warn("gotoId: escena inválida");
            return;
        }
    
        const slideIndex = scene.slides.findIndex(slide => slide.id === slideId);
        
        if (slideIndex === -1) {
            console.warn(`gotoId: no se encontró el slide "${slideId}"`);
            return;
        }
    
        stateManager.set("slideIndex", slideIndex);
        this.applyVisibilityRules(scene);
        
        const targetSlide = scene.slides[slideIndex];
        if (targetSlide?.on_enter) {
            this.execute(targetSlide.on_enter, scene);
        }
    },

    gotoScene(filename, scene = null) {
        const sceneFile = `${filename}.yaml`;
        
        stateManager.set("currentSceneFile", sceneFile);
        stateManager.set("slideIndex", 0);
        
        if (scene) {
            this.applyVisibilityRules(scene);
            
            if (scene?.on_enter) {
                this.execute(scene.on_enter, scene);
            }
            
            const firstSlide = scene.slides?.[0];
            if (firstSlide?.on_enter) {
                this.execute(firstSlide.on_enter, scene);
            }
        }
        
        emitEvent("scene:request", sceneFile);
    },

    // ---------------------------------------
    // MEDIA
    // ---------------------------------------
    playVideo(videoId) {
        stateManager.set("videoId", videoId);
    },

    playSound(soundId, scene) {
        try {
            const soundSource = scene?.assets?.audios?.[soundId]?.src || soundId;
            const audioPath = getPath(soundSource);
            const audio = new Audio(audioPath);
            audio.play().catch(error => {
                console.warn("No se pudo reproducir el audio:", error);
            });
        } catch (error) {
            console.warn("Error al intentar reproducir audio:", error);
        }
    },

    audioFinished() {
        emitEvent("audio_finished");
    },

    // ---------------------------------------
    // TEMPORIZADORES
    // ---------------------------------------
    wait(milliseconds) {
        const delay = parseInt(milliseconds, 10) || 1000;
        setTimeout(() => {
            emitEvent(`wait_end:${delay}`);
        }, delay);
    },

    // ---------------------------------------
    // SUBIR ARCHIVOS
    // ---------------------------------------
    async uploadFile(action) {
        try {
            emitEvent("upload_file_" + action.id);

            const file = action.__file;
            if (!file) {
                throw new Error("No se recibió ningún archivo");
            }

            const result = await submitAssignment(action.assignmentId, file);
            
            const currentAssignments = stateManager.get("assignments") || [];
            const updatedAssignments = currentAssignments.map(assignment => {
                if (assignment.id === action.assignmentId) {
                    return { ...assignment, submissionstatus: "submitted" };
                }
                return assignment;
            });
            
            stateManager.set("assignments", updatedAssignments);
            emitEvent("success:upload_file_" + action.id);
            
            return result;

        } catch (error) {
            console.error("Error al subir archivo:", error);
            emitEvent("error:upload_file_" + action.id);
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
    _parseValue(rawValue) {
        if (rawValue === "true") return true;
        if (rawValue === "false") return false;
        
        const asNumber = Number(rawValue);
        if (!isNaN(asNumber) && rawValue !== "") {
            return asNumber;
        }
        
        return rawValue;
    },

    // Divide un argumento en partes (key, value, etc)
    _parseArgument(arg) {
        if (!arg) return [];
        return arg.toString().split(/[:,]/).map(part => part.trim());
    },

    setStateVariable(arg) {
        const parts = this._parseArgument(arg);
        if (parts.length < 2) {
            console.warn("setStateVariable requiere formato 'key:value'");
            return;
        }
        
        const key = parts[0];
        const rawValue = parts.slice(1).join(":");
        const value = this._parseValue(rawValue);
        
        console.log(`Estableciendo ${key} =`, value);
        stateManager.set(key, value);
    },

    incrementState(arg) {
        const parts = this._parseArgument(arg);
        const key = parts[0];
        const incrementBy = parseInt(parts[1], 10) || 1;
        
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
        const parts = this._parseArgument(arg);
        if (parts.length < 2) {
            console.warn("setCustomVariable requiere al menos 'key:value'");
            return;
        }

        const key = parts[0];
        let storageType = "local"; // por defecto
        let rawValue;

        // Formato: key:local:value o key:session:value
        if (parts[1] === "local" || parts[1] === "session") {
            storageType = parts[1];
            rawValue = parts.slice(2).join(":");
        } else {
            // Formato: key:value
            rawValue = parts.slice(1).join(":");
        }

        // Intentar parsear como JSON, sino usar valor directo
        let value;
        try {
            value = JSON.parse(rawValue);
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
            const coreState = stateManager.get() || {};
            
            // Variables personalizadas
            const customStore = stateManager.getCustom ? stateManager.getCustom() : {};
            const custom = {
                ...customStore,
                get(key) {
                    return stateManager.getCustom ? stateManager.getCustom(key) : undefined;
                }
            };
            
            // Contexto completo para evaluar la expresión
            const context = { 
                ...coreState, 
                state: coreState, 
                custom 
            };
            
            const evaluator = new Function("ctx", `with (ctx) { return ( ${expression} ); }`);
            const result = evaluator(context);
            
            return Boolean(result);
        } catch (error) {
            console.warn(`Error al evaluar condición "${expression}":`, error);
            return false;
        }
    },

    // ---------------------------------------
    // REGLAS DE VISIBILIDAD
    // ---------------------------------------
    
    applyVisibilityRules(scene) {
        if (!scene) return;

        // Obtener elementos del slide actual
        const getCurrentElements = (scene) => {
            if (Array.isArray(scene.slides)) {
                const currentIndex = stateManager.get("slideIndex") || 0;
                const currentSlide = scene.slides[currentIndex];
                return currentSlide?.elements || [];
            }
            return scene.elements || [];
        };

        // Procesar un elemento y sus hijos recursivamente
        const processElement = (element) => {
            if (!element) return;

            // Procesar visible_if
            const visibilityCondition = element.visible_if || 
                                       element.visibleIf || 
                                       element.visibleIfCondition;
            
            if (visibilityCondition && element.id) {
                const isVisible = this.evaluateCondition(visibilityCondition);
                if (isVisible) {
                    this.showElement(element.id);
                } else {
                    this.hideElement(element.id);
                }
            }

            // Procesar elementos hijos
            if (Array.isArray(element.elements)) {
                element.elements.forEach(child => processElement(child));
            }
        };

        const elements = getCurrentElements(scene);
        elements.forEach(element => processElement(element));
    },

    // ---------------------------------------
    // EJECUTOR DE ACCIONES
    // ---------------------------------------
    
    // Normaliza una acción a formato { type, arg }
    _normalizeAction(action) {
        if (typeof action === "string") {
            const parts = action.split(":");
            return {
                type: parts[0],
                arg: parts.slice(1).join(":"),
                raw: action
            };
        }
        
        if (typeof action === "object" && action.type) {
            return {
                type: action.type.toString().replace(/^:/, ""),
                arg: action.arg !== undefined ? action.arg : action.value,
                raw: action
            };
        }
        
        return null;
    },

    async execute(action, scene = null) {
        if (!action) return;

        const actions = Array.isArray(action) ? action : [action];

        for (const rawAction of actions) {
            const normalized = this._normalizeAction(rawAction);
            
            if (!normalized) {
                console.error("Acción inválida:", rawAction);
                continue;
            }

            const { type, arg } = normalized;

            switch (type) {
                // ELEMENTOS
                case "show":
                    this.showElement(arg);
                    break;
                    
                case "hide":
                    this.hideElement(arg);
                    break;

                // NAVEGACIÓN
                case "previous_slide":
                    this.previousSlide();
                    break;
                    
                case "next_slide":
                    this.nextSlide();
                    break;
                    
                case "goto_scene":
                    this.gotoScene(arg, scene);
                    break;
                    
                case "goto_id":
                    this.gotoId(arg, scene);
                    break;

                // MEDIA
                case "play_video":
                    this.playVideo(arg);
                    break;
                    
                case "play_sound":
                    this.playSound(arg, scene);
                    break;
                    
                case "audio_finished":
                    this.audioFinished();
                    break;

                // TEMPORIZADORES
                case "wait":
                    this.wait(arg);
                    break;

                // ARCHIVOS
                case "upload_file":
                    await this.uploadFile(normalized.raw);
                    break;

                // COMPLETADO
                case "mark_complete":
                    this.markComplete(arg);
                    break;
                    
                case "end":
                    emitEvent(`end:${arg}`);
                    break;

                // ESTADO
                case "set":
                    this.setStateVariable(arg);
                    break;
                    
                case "inc":
                    this.incrementState(arg);
                    break;
                    
                case "dec":
                    this.decrementState(arg);
                    break;
                    
                case "call":
                    this.callMethod(arg);
                    break;

                // ESTADO PERSONALIZADO
                case "custom_set":
                    this.setCustomVariable(arg);
                    break;
                    
                case "custom_inc":
                    this.incrementCustom(arg);
                    break;
                    
                case "custom_dec":
                    this.decrementCustom(arg);
                    break;

                // CONDICIONALES
                case "if": {
                    const condition = arg;
                    const shouldExecute = this.evaluateCondition(condition);
                    
                    if (shouldExecute && normalized.raw.actions) {
                        await this.execute(normalized.raw.actions, scene);
                    }
                    break;
                }

                default:
                    console.warn("Acción no reconocida:", type, normalized.raw);
            }
        }

        // Re-evaluar visibilidad después de ejecutar acciones
        if (scene) {
            this.applyVisibilityRules(scene);
        }
    }
};