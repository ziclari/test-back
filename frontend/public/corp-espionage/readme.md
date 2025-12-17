# Catálogo de animaciones disponibles

Cada animación corresponde a una key dentro del objeto `animations`. Puedes usar cualquiera de estas cadenas en tu YAML:

```
fade
fadeUp
fadeDown
fadeLeft
fadeRight
zoomIn
zoomOut
slideLeft
slideRight
slideUp
slideDown
rotateIn
rotateOut
pop
bounce
pulse
heartbeat
flipY
flipX
staggerContainer
none
```

---

# Sintaxis YAML esperada

Tu `MotionWrapper` soporta tres formas de definir animaciones en YAML:

## 1. Una única animación

```
animate: slideRight
delay: 0.5
```

## 2. Múltiples animaciones en secuencia

```
animate:
  - slideUp
  - heartbeat
```

## 3. Modo secuencia explícita con repeat

```
animate:
  sequence:
    - slideUp
    - heartbeat
  repeat: infinite
delay: 0.3
```

---

# Reglas de interpretación según `MotionWrapper`

1. **Si `animate` es string:** se convierte a una lista de un solo elemento.
   Ej.: `"slideRight"`

2. **Si `animate` es array:** se usan en orden como secuencia.
   Ej.: `["slideUp", "heartbeat"]`

3. **Si `animate` usa `sequence:`:** se respeta tal cual.
   Ej.: `sequence: ["zoomIn", "pulse"]`

4. **repeat infinito:**

   * `"repeat: infinite"` (solo en modo `sequence`).
   * `"infinite: true"` (si usas array).

5. **Si no se especifica animación la animación fallback es `fadeUp`.**

6. **delay** controla el inicio de la animación y cuándo se habilitan los clics.

---

# Ejemplos completos basados

### Ejemplo 1: Animación simple

```
  animate: fadeUp
  delay: 0.6
```

### Ejemplo 2: Slide + delay

```
  animate: slideRight
  delay: 0.5
```

### Ejemplo 3: Secuencia simple

```
  animate:
    - slideUp
    - heartbeat
```

### Ejemplo 4: Secuencia infinita

```
  animate:
    sequence:
      - pulse
      - heartbeat
    repeat: infinite
```

### Ejemplo 5: Secuencia infinita forma corta

```
  animate:
    - bounce
    - pulse
  infinite: true
```

### Ejemplo 6: Sin animación

```
  animate: none
```