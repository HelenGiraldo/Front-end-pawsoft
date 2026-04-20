# Changelog — PawSoft Frontend

Registro de cambios, correcciones y mejoras del frontend.

---

## [2026-04-19] - 19 de abril de 2026

### Correcciones

#### Fix: Tests del Frontend — 95/95 pasando
Reescritos todos los archivos `.spec.ts` para alinearse con las APIs reales. Ver CHANGELOG del backend para detalle completo.

#### Fix: Botón "Descargar PDF" fuera del recuadro
Eliminado `height: 140px` fijo en `.pdf-item-cliente` y `.pdf-item-historial`.

#### Fix: Mascotas hospitalizadas en selector de citas (Recepcionista)
Tarjetas deshabilitadas visualmente con badge "🏥 Hospitalizada". `selectPet()` bloquea selección.

#### Fix: Autocompletado IA — solo medicamentos del catálogo
`aplicarMedicamentosSugeridos()` filtra contra `catalogoMedicamentos` antes de agregar.

#### Fix: Alineación columnas tabla de medicamentos
`align-items: end` → `align-items: start` en `.med-fields`.

#### Fix: Botón "Cobrar" solo en tab Inicio de Recepcionista
Eliminado de tabs Pagos y Todas las Citas. `savePayment()` encadena `markAsPaid()` automáticamente.

#### Fix: Mensaje de error específico al cerrar atención
Lista exacta de campos faltantes con `white-space: pre-line`.

#### Fix: Scroll en Login
Eliminado `[scrollY]="false"` de `ion-content`.

#### Fix: Nota de costos en historial veterinario
Eliminado mensaje "ℹ️ Los costos mostrados son los originales..." del historial del veterinario.

### Nuevas Funcionalidades

#### Chatbot de Autenticación
Nuevo `AuthChatbotComponent` en páginas públicas (login, register, forgot-password). System prompts restringidos por contexto. Montado en `app.component.html`.

#### Directiva `autoResize`
Textareas del formulario de consulta crecen automáticamente. Escucha `ngAfterViewInit` y `ngModelChange`.

#### Regla: Cancelación con 24h de anticipación
`puedeCancel()` en cliente y recepcionista. Botón Cancelar oculto si faltan menos de 24h.

### Mejoras

#### Colores de texto en botones
`--color: #ffffff` en botones "Validar" (OTP) y "Continuar" (forgot-password).

#### Límites longitudinales en campos
`maxlength` coherentes en todos los formularios de autenticación y mascotas.

#### Asteriscos en campos obligatorios
`*` rojo en todos los campos requeridos de login, register y forgot-password.

---

## [2026-04-15] - 15 de abril de 2026

### Nuevas Funcionalidades

#### Mejoras en Dashboard Veterinario - Gestión de Atención Médica
**Tipo:** Feature Completa  
**Rama:** `feat/vet-dashboard-improvements`  
**Commits:** 5 commits  
**Funcionalidad:** Mejoras significativas en la gestión de atención médica veterinaria con visualización de historial, deshabilitación de botones y limpieza de estados corruptos.

**Commits Realizados:**

1. **fix: remove duplicate calcularEdad() methods** (`db4e90a`)
   - Removidas 2 definiciones duplicadas del método `calcularEdad()`
   - Resueltos errores de compilación de TypeScript
   - Build ahora compila sin errores

2. **feat: display last 2 medical attentions with veterinarian names** (`5394c64`)
   - Nueva sección "📅 Últimas Atenciones" en formulario de consulta
   - Muestra las últimas 2 atenciones médicas de la mascota
   - Incluye nombre del veterinario (👨‍⚕️ Dr. [name])
   - Información mostrada: Fecha/Hora, Motivo, Diagnóstico, Observaciones
   - Estado de carga mientras se obtienen datos
   - Styling completo con soporte para modo oscuro

3. **feat: improve medical attention state management** (`987f317`)
   - Inicialización robusta del estado con retry logic
   - Nuevo método `syncStateFromStorage()` para sincronizar desde localStorage
   - Validación para asegurar propagación correcta del estado
   - Mejor manejo de errores para datos corruptos
   - Limpieza automática de borradores antiguos

4. **feat: implement button disabling logic** (`ca0b9c3`)
   - Solo una atención puede estar en progreso a la vez
   - Botones de "Iniciar Atención" deshabilitados cuando hay atención activa
   - Métodos de validación: `canStartAttention()`, `canShowDisabledButton()`, `canContinueAttention()`
   - Implementado `cleanupInProgressAppointments()` para resetear citas
   - Previene múltiples atenciones concurrentes

5. **feat: add cleanup buttons for corrupted states** (`8aa320b`)
   - 🗑️ Botón "Limpiar atención activa" - limpia atención actual
   - 🧹 Botón "Limpiar todas" - resetea todas las citas IN_PROGRESS a CONFIRMED
   - Métodos: `limpiarAtencionManual()`, `limpiarTodasLasAtenciones()`, `limpiarAtencionHuerfana()`
   - Sincronización automática de estado desde localStorage
   - Recuperación manual de estados corruptos

**Componentes Modificados:**
- `formulario-consulta.component.ts` - Carga de últimas atenciones
- `formulario-consulta.component.html` - Sección de últimas atenciones
- `formulario-consulta.component.scss` - Styling de últimas atenciones
- `dashboard-vet.component.ts` - Lógica de deshabilitación de botones
- `dashboard-vet.component.html` - Botones deshabilitados
- `dashboard-vet.component.scss` - Estilos de botones deshabilitados
- `atencion-medica.component.ts` - Botones de limpieza
- `atencion-medica.component.html` - UI de limpieza
- `atencion-medica.component.scss` - Estilos de limpieza
- `medical-record.service.ts` - Mejoras de estado

**Características Implementadas:**
✅ Visualización de últimas 2 atenciones con nombres de veterinarios  
✅ Deshabilitación de botones cuando hay atención activa  
✅ Botones de limpieza para estados corruptos  
✅ Gestión robusta de estado de atención  
✅ Sincronización de localStorage  
✅ Detección de atenciones huérfanas  
✅ Prevención de múltiples atenciones concurrentes  

**Estadísticas:**
- 5 commits
- 11 archivos modificados
- +1,500 líneas agregadas
- -100 líneas removidas
- Build: ✅ Compila sin errores

**Beneficios:**
- Mejor experiencia de usuario
- Prevención de estados inconsistentes
- Recuperación automática de errores
- Interfaz más clara y confiable
- Historial médico visible durante consulta

---

## Notas

- Todos los cambios son backward compatible
- No hay cambios en APIs públicas
- Mejoras puramente en funcionalidad y UX
- Código sigue estándares del proyecto
