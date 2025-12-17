# UIController

Formato general:

```
action:
  - tipo:argumento
```

O en forma objeto:

```
action:
  - type: tipo
    arg: valor
```

---

# 1. Elementos

```
action:
  - show:header
  - hide:panel
  - mark_inactive:btnNext
```

---

# 2. Navegación

```
action:
  - previous_slide
  - next_slide
  - goto_scene:intro
```

---

# 3. Media

```
action:
  - play_video:introVideo
  - play_sound:click
  - audio_finished
```

---

# 4. Temporizadores

```
action:
  - wait:1000
```

---

# 5. Subida de archivos

(No usar en esta prueba)

```
action:
  - type: upload_file
    id: subir1
    assignmentId: 33
```

---

# 6. Finalización
(no usar en esta prueba)
```
action:
  - mark_complete:actividad1
  - end:finEscena
```

---

# 7. Estado (state) 
(solo score y current_role disponibles)

**Set**

```
action:
  - set:score,10
  - set:current_role,local
```

**Inc / Dec**

```
action:
  - inc:score
  - inc:score,2
  - dec:score
```

**Call**
(no hay acciones aun disponibles)
```
action:
  - call:resetGame
```

---

# 8. Custom State

**Set**

```
action:
  - custom_set:flag,true
  - custom_set:data,{"x":1}
```

**Set persistente**

```
action:
  - custom_set_persistent:darkmode,local,true
```

**Incrementos**

```
action:
  - custom_inc:contador
  - custom_dec:vidas,2
```

---

# 9. Condiciones

**Forma simple**

```
action:
  - if:score > 10
```

**Forma con acciones**

```
action:
  - type: if
    arg: score >= 5 && custom.flag
    actions:
      - show:premio
```

---

# 10. Reglas en elementos (no son acciones)

En el YAML del elemento:

```
visible_if: score > 5
enabled_if: has_key
```

UIController las evalúa automáticamente.

---

# 11. Ejemplos completos

### Secuencia con delay

```
action:
  - play_sound:click
  - hide:boton
  - wait:500
  - show:mensaje
```

### Rama condicional hacia escenas

```
action:
  - type: if
    arg: score >= 10
    actions:
      - goto_scene:final_bueno

  - type: if
    arg: score < 10
    actions:
      - goto_scene:final_malo
```