# Appium Inspector — Guía completa

## Instalación

Descargar el instalador desde:  
**https://github.com/appium/appium-inspector/releases**

Disponible para macOS, Windows y Linux (AppImage / .deb).

> Appium Inspector es una app de escritorio independiente. No requiere Appium CLI instalado en la misma máquina, pero sí necesita acceso al Appium Server.

---

## Configuración de conexión al servidor

| Campo | Valor por defecto | Descripción |
|---|---|---|
| Remote Host | `127.0.0.1` | IP o hostname del Appium Server |
| Remote Port | `4723` | Puerto del Appium Server |
| Remote Path | `/` | Base path (Appium 2.x usa `/`) |
| SSL | Off | Activar solo si el server usa HTTPS |

### Verificar que el server esté corriendo

```bash
appium --address 127.0.0.1 --port 4723
# Verificar:
curl http://127.0.0.1:4723/status
```

---

## Capabilities para Inspector

### Android (emulador)

```json
{
  "platformName": "Android",
  "appium:automationName": "UiAutomator2",
  "appium:deviceName": "emulator-5554",
  "appium:app": "/ruta/absoluta/app.apk",
  "appium:noReset": true,
  "appium:newCommandTimeout": 300
}
```

> `noReset: true` evita que la app se reinstale entre sesiones del Inspector — útil para navegar sin perder estado.

### Android (dispositivo físico)

```json
{
  "platformName": "Android",
  "appium:automationName": "UiAutomator2",
  "appium:deviceName": "Mi11_5G",
  "appium:udid": "RF8N20XXXXX",
  "appium:appPackage": "com.example.myapp",
  "appium:appActivity": ".MainActivity",
  "appium:noReset": true
}
```

> Obtener UDID: `adb devices`  
> Obtener appPackage + appActivity: `adb shell dumpsys window | grep -E 'mCurrentFocus|mFocusedApp'`

### iOS (simulador)

```json
{
  "platformName": "iOS",
  "appium:automationName": "XCUITest",
  "appium:deviceName": "iPhone 15",
  "appium:platformVersion": "17.0",
  "appium:app": "/ruta/absoluta/app.app",
  "appium:noReset": true,
  "appium:newCommandTimeout": 300
}
```

### iOS (dispositivo físico)

```json
{
  "platformName": "iOS",
  "appium:automationName": "XCUITest",
  "appium:deviceName": "iPhone de Juan",
  "appium:udid": "00008110-000XXXXXXXXX",
  "appium:bundleId": "com.example.myapp",
  "appium:noReset": true,
  "appium:xcodeOrgId": "TEAM_ID",
  "appium:xcodeSigningId": "iPhone Developer"
}
```

> Obtener UDID iOS: `xcrun xctrace list devices`

---

## Guardar y reutilizar capability sets

El Inspector permite guardar conjuntos de capabilities con nombre. Recomendación: crear uno por entorno:

- `Android - Emulador Dev`
- `Android - Device CI`
- `iOS - Simulator QA`
- `iOS - Device Staging`

---

## Interfaz del Inspector — Paneles principales

```
┌─────────────────────────────────────────────────────────────┐
│  App Screenshot          │  XML Source Tree                  │
│  (live rendering)        │  (jerarquía de elementos)         │
│                          │                                    │
│  [Click → selecciona     │  <hierarchy>                      │
│   elemento en árbol]     │    <android.widget.EditText       │
│                          │       resource-id="username"...>  │
├──────────────────────────┴────────────────────────────────── │
│  Selected Element — Atributos e información de localización  │
│  ┌─────────────────┬──────────────────────────────────────┐  │
│  │ resource-id     │ com.example.app:id/username_input    │  │
│  │ content-desc    │ username_input                        │  │
│  │ class           │ android.widget.EditText               │  │
│  │ text            │ (vacío)                               │  │
│  │ bounds          │ [48,456][1032,570]                    │  │
│  └─────────────────┴──────────────────────────────────────┘  │
│  Locator sugerido: accessibility_id = "username_input"        │
└─────────────────────────────────────────────────────────────┘
```

---

## Estrategias de localización — cuándo usar cada una

### 1. Accessibility ID ✅ (primera opción)

```python
AppiumBy.ACCESSIBILITY_ID, "username_input"
```

- Android: atributo `content-desc`
- iOS: atributo `accessibilityIdentifier`
- Funciona en ambas plataformas con el mismo locator si el dev setea el mismo valor
- Verificar en Inspector: columna `content-desc` / `name`

### 2. ID (resource-id)

```python
AppiumBy.ID, "com.example.app:id/username_input"
# o sin el package name si está configurado:
AppiumBy.ID, "username_input"
```

- Solo Android
- Verificar en Inspector: atributo `resource-id`

### 3. XPath (último recurso)

```python
AppiumBy.XPATH, "//android.widget.EditText[@resource-id='com.example.app:id/username_input']"
```

Simplificar XPaths copiados del Inspector:
```python
# Malo (frágil):
"//hierarchy/android.widget.FrameLayout[1]/android.widget.LinearLayout[1]/..."
# Bueno:
"//android.widget.EditText[@content-desc='username_input']"
```

### 4. Android UIAutomator

```python
AppiumBy.ANDROID_UIAUTOMATOR, 'new UiSelector().text("Iniciar sesión")'
AppiumBy.ANDROID_UIAUTOMATOR, 'new UiSelector().className("android.widget.Button").index(0)'
AppiumBy.ANDROID_UIAUTOMATOR, 'new UiSelector().resourceId("com.example:id/btn_login")'
# Scroll a elemento:
AppiumBy.ANDROID_UIAUTOMATOR, 'new UiScrollable(new UiSelector().scrollable(true)).scrollIntoView(new UiSelector().text("Ver más"))'
```

### 5. iOS Predicate String

```python
AppiumBy.IOS_PREDICATE, 'label == "Iniciar sesión"'
AppiumBy.IOS_PREDICATE, 'type == "XCUIElementTypeButton" AND label CONTAINS "Login"'
AppiumBy.IOS_PREDICATE, 'name == "username_input" AND enabled == true'
```

### 6. iOS Class Chain

```python
AppiumBy.IOS_CLASS_CHAIN, '**/XCUIElementTypeTextField[`label == "Email"`]'
AppiumBy.IOS_CLASS_CHAIN, '**/XCUIElementTypeButton[-1]'   # último botón
```

---

## Acciones desde el Inspector

| Acción | Descripción |
|---|---|
| **Tap** | Click sobre el elemento seleccionado |
| **Send Keys** | Escribir texto en un input |
| **Clear** | Limpiar el campo |
| **Get Source** | Obtener XML completo de la pantalla |
| **Take Screenshot** | Captura manual |
| **Swipe** | Definir coordenadas de inicio/fin |
| **Execute Script** | Correr mobile: commands (scroll, etc.) |

---

## Flujo recomendado para identificar locators

1. Levantar Appium Server: `appium`
2. Abrir Inspector y crear sesión con las capabilities del entorno
3. Navegar manualmente a la pantalla a testear
4. Hacer click en el elemento en el screenshot → ver atributos en el panel
5. Elegir locator según prioridad (ver tabla arriba)
6. Usar el **Search Bar** del árbol XML para filtrar por texto/atributo
7. Copiar el locator al Page Object correspondiente
8. Usar **Refresh** para actualizar la pantalla si navegaste

---

## Troubleshooting Inspector

| Problema | Causa | Solución |
|---|---|---|
| `Could not start a new session` | Caps incorrectas o app no encontrada | Verificar ruta absoluta del APK/IPA |
| Sesión crea pero pantalla en negro | App tardó en cargar | Aumentar `appium:appWaitActivity` o `newCommandTimeout` |
| Árbol XML vacío o incompleto | Appium Inspector desactualizado | Actualizar a la última versión |
| `Inspector could not connect` | Server no levantado | `curl http://127.0.0.1:4723/status` |
| iOS: sesión falla con `xcodebuild` | Xcode no configurado | `xcode-select --install`, verificar `xcrun simctl list` |