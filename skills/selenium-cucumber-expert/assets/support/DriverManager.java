package com.mycompany.tests.support;

import io.github.bonigarcia.wdm.WebDriverManager;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.firefox.FirefoxOptions;
import org.openqa.selenium.remote.RemoteWebDriver;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.net.MalformedURLException;
import java.net.URL;
import java.time.Duration;

/**
 * DriverManager — creates and destroys WebDriver instances.
 *
 * Uses ThreadLocal<WebDriver> so each thread in a parallel test run gets its own
 * browser instance. This is the single most important pattern for parallel safety.
 *
 * Always call quitDriver() in the @After hook and call driverThread.remove()
 * to prevent memory leaks in long-running thread pools.
 */
public class DriverManager {

    private static final Logger log = LoggerFactory.getLogger(DriverManager.class);
    private static final ThreadLocal<WebDriver> driverThread = new ThreadLocal<>();

    private DriverManager() {
        // Utility class — not instantiable
    }

    /**
     * Creates a new WebDriver for the current thread.
     * Reads configuration from ConfigReader (browser, headless, use.grid, grid.url).
     */
    public static WebDriver createDriver() {
        String browser  = ConfigReader.get("browser", "chrome");
        boolean useGrid = Boolean.parseBoolean(ConfigReader.get("use.grid", "false"));

        WebDriver driver;
        try {
            driver = useGrid ? createRemoteDriver(browser) : createLocalDriver(browser);
        } catch (MalformedURLException e) {
            throw new RuntimeException("Invalid grid URL: " + ConfigReader.get("grid.url"), e);
        }

        driver.manage().window().maximize();
        driver.manage().timeouts().implicitlyWait(Duration.ZERO);  // rely on explicit waits only

        driverThread.set(driver);
        log.info("WebDriver created: {} (thread {})", browser, Thread.currentThread().getName());
        return driver;
    }

    /** Returns the WebDriver for the current thread. */
    public static WebDriver getDriver() {
        return driverThread.get();
    }

    /** Quits and removes the WebDriver for the current thread. */
    public static void quitDriver() {
        WebDriver driver = driverThread.get();
        if (driver != null) {
            try {
                driver.quit();
                log.info("WebDriver quit (thread {})", Thread.currentThread().getName());
            } finally {
                driverThread.remove();  // critical: prevents memory leaks
            }
        }
    }

    // ─── Private helpers ──────────────────────────────────────────────────────────

    private static WebDriver createLocalDriver(String browser) {
        boolean headless = Boolean.parseBoolean(ConfigReader.get("headless", "false"));

        return switch (browser.toLowerCase()) {
            case "firefox" -> {
                WebDriverManager.firefoxdriver().setup();
                FirefoxOptions options = new FirefoxOptions();
                if (headless) options.addArguments("-headless");
                yield new FirefoxDriver(options);
            }
            case "edge" -> {
                WebDriverManager.edgedriver().setup();
                yield new org.openqa.selenium.edge.EdgeDriver();
            }
            default -> {  // chrome
                WebDriverManager.chromedriver().setup();
                ChromeOptions options = new ChromeOptions();
                if (headless) {
                    options.addArguments("--headless=new");
                    options.addArguments("--window-size=1920,1080");
                }
                options.addArguments("--no-sandbox");
                options.addArguments("--disable-dev-shm-usage");
                yield new ChromeDriver(options);
            }
        };
    }

    private static WebDriver createRemoteDriver(String browser) throws MalformedURLException {
        String gridUrl = ConfigReader.get("grid.url", "http://localhost:4444");
        log.info("Connecting to Selenium Grid at: {}", gridUrl);

        return switch (browser.toLowerCase()) {
            case "firefox" -> new RemoteWebDriver(new URL(gridUrl + "/wd/hub"), new FirefoxOptions());
            default -> {
                ChromeOptions options = new ChromeOptions();
                options.addArguments("--no-sandbox", "--disable-dev-shm-usage");
                yield new RemoteWebDriver(new URL(gridUrl + "/wd/hub"), options);
            }
        };
    }
}
