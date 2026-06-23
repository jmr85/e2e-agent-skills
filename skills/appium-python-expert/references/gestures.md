# Gestures Táctiles — Referencia completa

## API recomendada: W3C Actions (Appium 2.x)

Appium 2.x deprecó la API antigua (`TouchAction`, `MultiAction`). Usar siempre **W3C Actions API** con `PointerInput`.

```python
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.actions.action_builder import ActionBuilder
from selenium.webdriver.common.actions.pointer_input import PointerInput
from selenium.webdriver.common.actions import interaction
```

---

## Helper base (agregar a `utils/gestures.py`)

```python
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.actions.action_builder import ActionBuilder
from selenium.webdriver.common.actions.pointer_input import PointerInput
from selenium.webdriver.common.actions import interaction


def make_touch(driver, name: str = "touch"):
    """Crea un PointerInput táctil y lo asocia al ActionBuilder."""
    touch = PointerInput(interaction.POINTER_TOUCH, name)
    chains = ActionChains(driver)
    chains.w3c_actions = ActionBuilder(driver, mouse=touch)
    return chains, touch


def get_screen_center(driver) -> tuple[int, int]:
    size = driver.get_window_size()
    return size["width"] // 2, size["height"] // 2


def element_center(element) -> tuple[int, int]:
    loc, sz = element.location, element.size
    return loc["x"] + sz["width"] // 2, loc["y"] + sz["height"] // 2
```

---

## Catálogo de gestures

### Tap

```python
def tap(driver, x: int, y: int):
    chains, _ = make_touch(driver)
    (chains.w3c_actions.pointer_action
        .move_to_location(x, y)
        .pointer_down()
        .pointer_up())
    chains.perform()

def tap_element(driver, element):
    cx, cy = element_center(element)
    tap(driver, cx, cy)
```

### Double Tap

```python
def double_tap(driver, x: int, y: int):
    chains, _ = make_touch(driver)
    (chains.w3c_actions.pointer_action
        .move_to_location(x, y)
        .pointer_down().pointer_up()
        .pause(0.1)
        .pointer_down().pointer_up())
    chains.perform()
```

### Long Press

```python
def long_press(driver, x: int, y: int, duration_ms: int = 1500):
    chains, _ = make_touch(driver)
    (chains.w3c_actions.pointer_action
        .move_to_location(x, y)
        .pointer_down()
        .pause(duration_ms / 1000)
        .pointer_up())
    chains.perform()

def long_press_element(driver, element, duration_ms: int = 1500):
    cx, cy = element_center(element)
    long_press(driver, cx, cy, duration_ms)
```

### Swipe / Scroll

```python
def swipe(driver, start_x: int, start_y: int,
          end_x: int, end_y: int, duration_ms: int = 500):
    chains, _ = make_touch(driver)
    (chains.w3c_actions.pointer_action
        .move_to_location(start_x, start_y)
        .pointer_down()
        .pause(duration_ms / 1000)
        .move_to_location(end_x, end_y)
        .pointer_up())
    chains.perform()


def swipe_up(driver, percent: float = 0.5):
    """Scroll hacia arriba (revela contenido más abajo)."""
    size = driver.get_window_size()
    cx = size["width"] // 2
    start_y = int(size["height"] * 0.75)
    end_y   = int(size["height"] * (0.75 - percent))
    swipe(driver, cx, start_y, cx, end_y)


def swipe_down(driver, percent: float = 0.5):
    """Pull-to-refresh o scroll hacia arriba de la lista."""
    size = driver.get_window_size()
    cx = size["width"] // 2
    start_y = int(size["height"] * 0.25)
    end_y   = int(size["height"] * (0.25 + percent))
    swipe(driver, cx, start_y, cx, end_y)


def swipe_left(driver, percent: float = 0.6):
    """Pasar a la siguiente página / item del carrusel."""
    size = driver.get_window_size()
    cy = size["height"] // 2
    start_x = int(size["width"] * 0.8)
    end_x   = int(size["width"] * (0.8 - percent))
    swipe(driver, start_x, cy, end_x, cy)


def swipe_right(driver, percent: float = 0.6):
    """Volver a la página anterior o abrir drawer."""
    size = driver.get_window_size()
    cy = size["height"] // 2
    start_x = int(size["width"] * 0.2)
    end_x   = int(size["width"] * (0.2 + percent))
    swipe(driver, start_x, cy, end_x, cy)
```

### Scroll hasta encontrar elemento

```python
from appium.webdriver.common.appiumby import AppiumBy

def scroll_to_element(driver, by, value, max_swipes: int = 8,
                      direction: str = "up") -> bool:
    """
    Hace swipes hasta encontrar el elemento o agotar intentos.
    direction: "up" (hacia abajo en la lista) | "down" (hacia arriba)
    """
    for _ in range(max_swipes):
        try:
            el = driver.find_element(by, value)
            if el.is_displayed():
                return True
        except Exception:
            pass
        if direction == "up":
            swipe_up(driver, percent=0.4)
        else:
            swipe_down(driver, percent=0.4)
    return False


def scroll_to_element_android(driver, text: str):
    """
    Scroll nativo Android usando UIAutomator (más rápido y confiable).
    """
    driver.find_element(
        AppiumBy.ANDROID_UIAUTOMATOR,
        f'new UiScrollable(new UiSelector().scrollable(true))'
        f'.scrollIntoView(new UiSelector().text("{text}"))'
    )
```

### Drag and Drop

```python
def drag_and_drop(driver, source_element, target_element, duration_ms: int = 1000):
    sx, sy = element_center(source_element)
    tx, ty = element_center(target_element)
    swipe(driver, sx, sy, tx, ty, duration_ms=duration_ms)


def drag_to_coordinates(driver, source_element, target_x: int, target_y: int,
                         duration_ms: int = 1000):
    sx, sy = element_center(source_element)
    swipe(driver, sx, sy, target_x, target_y, duration_ms=duration_ms)
```

### Pinch y Zoom (dos dedos)

```python
def pinch_zoom(driver, scale: float = 2.0, duration_ms: int = 600):
    """
    scale > 1.0 → zoom in (separar dedos)
    scale < 1.0 → pinch out (juntar dedos)
    """
    size   = driver.get_window_size()
    cx, cy = size["width"] // 2, size["height"] // 2
    offset = int(min(cx, cy) * 0.25)

    f1 = PointerInput(interaction.POINTER_TOUCH, "finger1")
    f2 = PointerInput(interaction.POINTER_TOUCH, "finger2")
    chains = ActionChains(driver)
    chains.w3c_actions = ActionBuilder(driver, mouse=f1, wheel=f2)

    pause = duration_ms / 1000

    if scale >= 1.0:  # zoom in: dedos empiezan juntos, se separan
        f1_sx, f1_ex = cx, cx - int(offset * scale)
        f2_sx, f2_ex = cx, cx + int(offset * scale)
    else:             # pinch: dedos empiezan separados, se juntan
        f1_sx, f1_ex = cx - offset, cx - int(offset * scale)
        f2_sx, f2_ex = cx + offset, cx + int(offset * scale)

    (chains.w3c_actions.pointer_action
        .move_to_location(f1_sx, cy).pointer_down()
        .pause(pause)
        .move_to_location(f1_ex, cy).pointer_up())
    chains.perform()


def zoom_in(driver):
    pinch_zoom(driver, scale=2.5)


def zoom_out(driver):
    pinch_zoom(driver, scale=0.4)
```

### Rotate (solo iOS físico)

```python
def rotate(driver, x: int, y: int, radius: int,
           rotation: float, touch_count: int = 2, duration: float = 1.0):
    """
    Rotate gesture — solo disponible en iOS con XCUITest.
    rotation: radianes (math.pi = 180°)
    """
    import math
    driver.execute_script("mobile: rotate", {
        "x": x,
        "y": y,
        "radius": radius,
        "rotation": rotation,
        "touchCount": touch_count,
        "duration": duration
    })
```

### Shake (solo simulador iOS)

```python
def shake(driver):
    driver.shake()
```

---

## Mobile Commands nativos (execute_script)

Appium 2.x expone gestures avanzados vía `mobile:` commands. Más eficientes que W3C para casos específicos.

### Android

```python
# Scroll por dirección
driver.execute_script("mobile: scrollGesture", {
    "left": 100, "top": 100, "width": 800, "height": 1200,
    "direction": "down",
    "percent": 0.75
})

# Swipe
driver.execute_script("mobile: swipeGesture", {
    "left": 100, "top": 500, "width": 800, "height": 200,
    "direction": "left",
    "percent": 0.75
})

# Fling (scroll con inercia)
driver.execute_script("mobile: flingGesture", {
    "left": 0, "top": 0, "width": 1080, "height": 1920,
    "direction": "up",
    "speed": 2500
})

# Long click
driver.execute_script("mobile: longClickGesture", {
    "x": 540, "y": 960,
    "duration": 1500
})

# Drag
driver.execute_script("mobile: dragGesture", {
    "startX": 100, "startY": 300,
    "endX": 500, "endY": 900,
    "speed": 1000
})
```

### iOS

```python
# Scroll
driver.execute_script("mobile: scroll", {
    "direction": "down",
    "predicateString": 'name == "myScrollView"'
})

# Swipe
driver.execute_script("mobile: swipe", {
    "direction": "left",
    "element": element.id
})

# Tap con coordenadas absolutas
driver.execute_script("mobile: tap", {
    "x": 200, "y": 400
})

# Pinch
driver.execute_script("mobile: pinch", {
    "scale": 0.5,
    "velocity": -1.0,
    "element": element.id
})
```

---

## Ejemplos en tests con Allure

```python
import allure
import pytest
from utils.gestures import swipe_left, scroll_to_element, long_press_element
from appium.webdriver.common.appiumby import AppiumBy

class TestGesturesAndroid:

    @allure.story("Carrusel")
    @allure.title("Swipe en carrusel de imágenes")
    def test_image_carousel(self, android_driver):
        with allure.step("Verificar primera imagen visible"):
            assert android_driver.find_element(
                AppiumBy.ACCESSIBILITY_ID, "image_1"
            ).is_displayed()

        with allure.step("Swipe left para pasar a la segunda imagen"):
            swipe_left(android_driver)

        with allure.step("Verificar segunda imagen"):
            assert android_driver.find_element(
                AppiumBy.ACCESSIBILITY_ID, "image_2"
            ).is_displayed()

    @allure.story("Lista larga")
    @allure.title("Scroll hasta elemento al final de la lista")
    def test_scroll_to_bottom(self, android_driver):
        with allure.step("Hacer scroll hasta 'Términos y condiciones'"):
            found = scroll_to_element(
                android_driver, AppiumBy.ACCESSIBILITY_ID, "terms_link"
            )
        assert found, "No se encontró el link de términos"

    @allure.story("Menú contextual")
    @allure.title("Long press abre menú de opciones")
    def test_long_press_context_menu(self, android_driver):
        item = android_driver.find_element(AppiumBy.ACCESSIBILITY_ID, "list_item_1")
        with allure.step("Long press sobre el primer item"):
            long_press_element(android_driver, item, duration_ms=1500)
        with allure.step("Verificar que aparece el menú contextual"):
            menu = android_driver.find_element(AppiumBy.ACCESSIBILITY_ID, "context_menu")
            assert menu.is_displayed()
```

---

## Tabla de compatibilidad de gestures

| Gesture | Android | iOS | API recomendada |
|---|---|---|---|
| Tap | ✅ | ✅ | W3C PointerInput |
| Double Tap | ✅ | ✅ | W3C PointerInput |
| Long Press | ✅ | ✅ | W3C PointerInput |
| Swipe | ✅ | ✅ | W3C PointerInput |
| Scroll a elemento | ✅ | ✅ | `mobile: scrollGesture` / `mobile: scroll` |
| Drag & Drop | ✅ | ✅ | W3C PointerInput (duration larga) |
| Pinch / Zoom | ✅ | ✅ | `mobile: pinch` (iOS) / W3C multi-finger (Android) |
| Rotate | ❌ | ✅ (físico) | `mobile: rotate` |
| Shake | ❌ | ✅ (simulador) | `driver.shake()` |
| Fling | ✅ | ❌ | `mobile: flingGesture` |