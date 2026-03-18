package com.mycompany.tests.support;

import com.aventstack.extentreports.ExtentTest;
import io.cucumber.java.After;
import io.cucumber.java.AfterAll;
import io.cucumber.java.Before;
import io.cucumber.java.BeforeAll;
import io.cucumber.java.Scenario;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import org.openqa.selenium.WebDriver;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Base64;

/**
 * Cucumber Hooks — runs setup/teardown around each scenario.
 *
 * Responsibilities:
 * - Start a WebDriver before each scenario (@Before order 1)
 * - Start an ExtentReports test node (@Before order 0, runs first)
 * - Take a screenshot and attach it to both reports on failure
 * - Quit the WebDriver after each scenario (@After)
 * - Flush reports after the full suite (@AfterAll)
 *
 * Hook execution order:
 *   @Before(order=0) → @Before(order=1) → ...steps... → @After(order=1) → @After(order=0)
 *   (for @After, HIGHER order runs FIRST — allows screenshot before driver quit)
 */
public class Hooks {

    private static final Logger log = LoggerFactory.getLogger(Hooks.class);

    private final TestContext context;

    // PicoContainer injects TestContext — same instance shared with all step classes
    public Hooks(TestContext context) {
        this.context = context;
    }

    @BeforeAll
    public static void globalSetUp() {
        log.info("=== Test Suite Starting ===");
    }

    @Before(order = 0)
    public void startExtentTest(Scenario scenario) {
        ExtentTest test = ExtentReportManager.getInstance()
            .createTest(scenario.getName())
            .assignCategory(scenario.getSourceTagNames().toArray(new String[0]));
        ExtentReportManager.setTest(test);
    }

    @Before(order = 1)
    public void setUp(Scenario scenario) {
        log.info("Starting scenario: [{}] {}", scenario.getStatus(), scenario.getName());
        WebDriver driver = DriverManager.createDriver();
        context.setDriver(driver);
    }

    @After(order = 1)  // runs before order=0, so screenshot is taken before driver quits
    public void takeScreenshotOnFailure(Scenario scenario) {
        WebDriver driver = context.getDriver();
        if (scenario.isFailed() && driver != null) {
            try {
                byte[] screenshot = ((TakesScreenshot) driver)
                    .getScreenshotAs(OutputType.BYTES);

                // Attach to Cucumber's native HTML/JSON report
                scenario.attach(screenshot, "image/png", "Screenshot on failure");

                // Attach to ExtentReports
                ExtentTest test = ExtentReportManager.getTest();
                if (test != null) {
                    String base64 = Base64.getEncoder().encodeToString(screenshot);
                    test.addScreenCaptureFromBase64String(base64, "Failure Screenshot");
                    test.fail("Scenario FAILED: " + scenario.getName());
                }

                log.error("Scenario FAILED — screenshot captured: {}", scenario.getName());
            } catch (Exception e) {
                log.warn("Could not capture screenshot: {}", e.getMessage());
            }
        }
    }

    @After(order = 0)  // runs last — quits driver after screenshot is already taken
    public void tearDown(Scenario scenario) {
        // Update ExtentReports status
        ExtentTest test = ExtentReportManager.getTest();
        if (test != null && !scenario.isFailed()) {
            test.pass("Scenario PASSED");
        }

        // Always quit the driver, even if something above throws
        try {
            DriverManager.quitDriver();
        } catch (Exception e) {
            log.warn("Error quitting WebDriver: {}", e.getMessage());
        }

        log.info("Scenario finished: {} — {}", scenario.getStatus(), scenario.getName());
    }

    @AfterAll
    public static void globalTearDown() {
        ExtentReportManager.flush();
        log.info("=== Test Suite Complete — Reports generated in target/ ===");
    }
}
