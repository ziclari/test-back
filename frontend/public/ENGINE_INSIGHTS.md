# 🧠 Perspectivas del Motor y Patrones Arquitectónicos

Este informe sintetiza las lecciones aprendidas y los patrones emergentes durante la fase de validación de nuestro motor de simulación *low-code*. Nuestro objetivo es establecer directrices claras para maximizar la versatilidad de la herramienta y la eficiencia del desarrollo de contenido.

## 🚀 Análisis del Motor Base

Nuestro motor es un simulador basado en configuración (YAML) construido sobre una *stack* de **React** y **Vite**. La arquitectura, que separa la **Lógica de Presentación** (React) de la **Lógica de Negocio/Narrativa** (YAML), implementa un patrón de **Desarrollo Dirigido por Datos** (Data-Driven Development), lo que permite crear simulaciones complejas sin modificar el código fuente del motor.

### Componentes Clave

| Componente | Responsabilidad |
| --- | --- |
| **`App.jsx` (Inicialización)** | Carga el `manifest.yaml`, aplica los *skins* dinámicos (CSS), y determina la escena inicial. |
| **`SceneRenderer.jsx` (Renderizado)** | Orquesta la visualización, carga los archivos YAML de la escena, y renderiza los elementos del *slide* actual. |
| **`UIController.js` (Lógica y Acciones)** | Es el *cerebro* que ejecuta las acciones definidas en YAML (`goto_scene`, `set_custom_var`, etc.) y evalúa dinámicamente las condiciones (`visible_if`, `enabled_if`). |
| **`stateManager.js` (Gestión de Estado)** | Mantiene el estado de la sesión (variables personalizadas, *slide* actual) y gestiona la persistencia de datos (guardado en `localStorage`). |

## ✨ Características Esenciales y Buenas Prácticas

### 1. Gestión de Visibilidad y Variables

El motor es más que una herramienta de presentación; es un *framework* de **lógica de juego** y **gestión de estado** impulsado por variables y visibilidad condicional.

* **Principio de Visibilidad:** La propiedad `visible_if` es el pilar de la interactividad. **Cualquier elemento que use `visible_if` debe poseer un `id` único.**
* **Recomendación de Estado:** Eviten el uso de acciones directas como `action: - show` o `action: - hide`. Estas crean estados transitorios. En su lugar, el flujo debe ser: **Modificar Variables** → **Controlar Visibilidad Condicionalmente**.

> *Flujo Ideal:* Clic en Botón → `set custom.puerta_abierta = true`. El elemento "Puerta" tiene un `visible_if: !custom.puerta_abierta`.

### 2. Navegación Estratégica

Ofrecemos dos comandos de navegación principales, optimizados para diferentes escalas de proyecto:

* **`goto_scene` (Múltiples Archivos YAML):** Ideal para módulos grandes o complejos. Permite dividir el contenido en archivos YAML separados para mantener la organización (`escena_urbana.yaml`, `oficina_central.yaml`).
* **`goto_id` (Archivo Único):** Perfecto para experiencias más pequeñas o prototipado rápido. Permite saltos instantáneos entre *slides* dentro del mismo archivo, simulando "habitaciones" o cambios de pantalla rápidos.

### 3. Persistencia de Estado

El uso de variables personalizadas es clave para construir sistemas de inventario y seguimiento de progreso:

* **`custom_set`:** Para estados temporales o específicos de la sesión actual.
* **`custom_set_persistent`:** **Imprescindible** para cualquier mecánica de "guardado" o datos que deban sobrevivir a recargas de página o transiciones entre escenas (p. ej., un sistema de *time-loop* o inventario permanente).

### 4. Estilo y *Theming*

La propiedad `skin` en el `manifest.yaml` permite transformar completamente la identidad visual de una simulación:

* **CSS Personalizado:** Una hoja de estilos dedicada (e.g., `corporativo.css`, `gótico.css`) aplicada vía *skin* establece de inmediato la atmósfera, desde la tipografía hasta la paleta de colores.
* **Cinemática:** El motor soporta un conjunto rico de animaciones (`pop`, `shake`, `pulse`, `float`). El uso estratégico de la propiedad `delay` puede crear transiciones y entradas de elementos de calidad cinematográfica.

## ⏳ Roadmap: Gestión de Tiempo (Timers)

**Estado:** Diseño Técnico Aprobado / Pendiente de Implementación
**Propósito:** Introducir presión temporal, eventos programados y mecánicas de ritmo (pacing) en las simulaciones.

La gestión del tiempo es el siguiente gran paso para evolucionar de "presentaciones interactivas" a "simuladores dinámicos".

### Implementación en el Engine (Pasos Futuros)

Para soportar timers manteniendo la pureza del patrón *Data-Driven*, se requieren tres cambios fundamentales en la arquitectura:

#### 1. Definición en YAML (Schema)
Los timers se tratarán como **Elementos Funcionales**. Pueden ser visibles (cuenta regresiva) o invisibles (lógica pura).

```yaml
- type: timer
  id: bomb_timer
  duration: 60           # Segundos
  visible: true          # Si es false, corre en segundo plano
  style: "danger_red"    # Clase CSS para timer visual
  format: "mm:ss"        # Formato de visualización
  autostart: true        # ¿Inicia al cargar el slide?
  on_tick:               # Opcional: acciones cada segundo
    - action_poca_presion
  on_timeout:            # OBLIGATORIO: Qué pasa al llegar a 0
    - custom_set: game_over_reason, local, "timeout"
    - goto_id: mission_failed_screen
```

#### 2. Nuevas Acciones de Control
Se necesita extender `UIController.js` para manejar el ciclo de vida del timer desde otros elementos:

* `timer_start`: Inicia o reanuda un timer por ID.
* `timer_pause`: Pausa el timer (mantiene el tiempo restante).
* `timer_reset`: Reinicia el tiempo a su duración original.
* `timer_add`: Sumar/restar tiempo dinámicamente (ej: `timer_add: bomb_timer, -10` como penalización).

#### 3. Integración en el Core (`TimerManager.js`)
No podemos confiar simplemente en `setTimeout`. Necesitamos un `TimerManager` robusto que:

* **Sincronización:** Se enganche al `stateManager`. Si el jugador recarga la página, el timer debe continuar donde se quedó (o reiniciar, según configuración).
* **Precisión:** Use `requestAnimationFrame` o corrección de deriva (drift correction) para evitar desincronización en sesiones largas.
* **Event Loop:** Compruebe condiciones de victoria/derrota en cada tick si es necesario.

### Casos de Uso Previstos
* **Desafíos de Hacking:** "Tienes 30 segundos para encontrar la contraseña".
* **Narrativa en Tiempo Real:** "El guardia volverá en 2 minutos" (Timer invisible que gatilla un evento `game_over` si no has salido).
* **QTEs Lentos:** Decisiones que deben tomarse antes de que se agote una barra de tiempo.

## ✅ Recomendaciones del Desarrollador Principal

1. **Diseño de Variables Primero:** Antes de escribir una sola escena, definan un **esquema de variables** (inventario, *score*, progreso) que necesitarán rastrear.
2. **Prototipado Rápido con `goto_id`:** Usen la arquitectura de **Archivo Único** para la fase inicial de diseño y prueba de lógica. Solo separen en múltiples archivos (`goto_scene`) cuando la complejidad del contenido lo exija.
3. **Tematización Temprana:** Definir el *skin* y el CSS personalizado en la fase de diseño inspira el contenido y garantiza una identidad visual cohesiva.
4. **Uso de *Debugging* con Texto:** Para verificar la lógica durante el desarrollo, muestren temporalmente las variables críticas en la pantalla con la sintaxis de *templating* (p. ej., `Estado de la llave: {{ custom.llave }}`).