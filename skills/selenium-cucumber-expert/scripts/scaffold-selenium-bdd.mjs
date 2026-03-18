#!/usr/bin/env node
/**
 * scaffold-selenium-bdd.mjs
 * Scaffolding script for Selenium + Cucumber + Java projects.
 *
 * Usage:
 *   node scaffold-selenium-bdd.mjs --level 2 --name my-project
 *   node scaffold-selenium-bdd.mjs --level 1 --name poc-tests --package com.acme.tests
 *
 * Levels:
 *   1 = Basic      (flat structure, single runner, no extras)
 *   2 = Intermediate (feature folders by domain, config files, utilities) [recommended]
 *   3 = Advanced   (+ Screenplay layer, multi-environment config, test data)
 *   4 = Enterprise (+ multi-module Maven parent, docker/grid config, GitHub Actions)
 */

import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { parseArgs } from 'util';

// ─── Argument parsing ─────────────────────────────────────────────────────────

const { values: args } = parseArgs({
  args: process.argv.slice(2),
  options: {
    level:   { type: 'string', short: 'l', default: '2' },
    name:    { type: 'string', short: 'n', default: 'selenium-bdd-tests' },
    package: { type: 'string', short: 'p', default: 'com.mycompany.tests' },
    help:    { type: 'boolean', short: 'h', default: false },
  },
});

if (args.help) {
  console.log(`
Selenium + Cucumber + Java Project Scaffolder

Usage: node scaffold-selenium-bdd.mjs [options]

Options:
  -l, --level    Project complexity level (1-4, default: 2)
  -n, --name     Project/directory name (default: selenium-bdd-tests)
  -p, --package  Java base package (default: com.mycompany.tests)
  -h, --help     Show this help

Levels:
  1  Basic        - single flat structure, quick to get started
  2  Intermediate - feature folders by domain, config, utils (recommended)
  3  Advanced     - + Screenplay pattern layer, multi-environment
  4  Enterprise   - + multi-module Maven, Docker, GitHub Actions
`);
  process.exit(0);
}

const level     = parseInt(args.level, 10);
const projectName = args.name;
const pkg       = args['package'];
const pkgPath   = pkg.replace(/\./g, '/');
const root      = resolve(process.cwd(), projectName);

if (level < 1 || level > 4) {
  console.error('Error: --level must be between 1 and 4');
  process.exit(1);
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function mkdir(dir) {
  const fullPath = join(root, dir);
  mkdirSync(fullPath, { recursive: true });
}

function write(filePath, content) {
  const fullPath = join(root, filePath);
  writeFileSync(fullPath, content, 'utf8');
}

function log(msg) {
  console.log(`  [scaffold] ${msg}`);
}

// ─── Base directories (all levels) ───────────────────────────────────────────

log(`Creating Level ${level} project: ${projectName}`);
log(`Package: ${pkg}`);
log(`Directory: ${root}`);
console.log('');

const javaBase    = `src/test/java/${pkgPath}`;
const resourceBase = 'src/test/resources';

// All levels share these directories
mkdir(`${javaBase}/pages`);
mkdir(`${javaBase}/steps`);
mkdir(`${javaBase}/support`);
mkdir(`${javaBase}/runners`);
mkdir(`${javaBase}/utils`);
mkdir(`${resourceBase}/features/auth`);
mkdir(`${resourceBase}/config`);

// ─── pom.xml ─────────────────────────────────────────────────────────────────

write('pom.xml', `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>${pkg.split('.').slice(0, 2).join('.')}</groupId>
    <artifactId>${projectName}</artifactId>
    <version>1.0.0-SNAPSHOT</version>

    <properties>
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <selenium.version>4.20.0</selenium.version>
        <cucumber.version>7.18.0</cucumber.version>
        <webdrivermanager.version>5.8.0</webdrivermanager.version>
        <extentreports.version>5.1.1</extentreports.version>
        <junit.platform.version>1.10.2</junit.platform.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.seleniumhq.selenium</groupId>
            <artifactId>selenium-java</artifactId>
            <version>\${selenium.version}</version>
        </dependency>
        <dependency>
            <groupId>io.github.bonigarcia</groupId>
            <artifactId>webdrivermanager</artifactId>
            <version>\${webdrivermanager.version}</version>
        </dependency>
        <dependency>
            <groupId>io.cucumber</groupId>
            <artifactId>cucumber-java</artifactId>
            <version>\${cucumber.version}</version>
        </dependency>
        <dependency>
            <groupId>io.cucumber</groupId>
            <artifactId>cucumber-picocontainer</artifactId>
            <version>\${cucumber.version}</version>
        </dependency>
        <dependency>
            <groupId>io.cucumber</groupId>
            <artifactId>cucumber-junit-platform-engine</artifactId>
            <version>\${cucumber.version}</version>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.junit.platform</groupId>
            <artifactId>junit-platform-suite</artifactId>
            <version>\${junit.platform.version}</version>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.junit.platform</groupId>
            <artifactId>junit-platform-launcher</artifactId>
            <version>\${junit.platform.version}</version>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>com.aventstack</groupId>
            <artifactId>extentreports</artifactId>
            <version>\${extentreports.version}</version>
        </dependency>
        <dependency>
            <groupId>ch.qos.logback</groupId>
            <artifactId>logback-classic</artifactId>
            <version>1.4.14</version>
        </dependency>
    </dependencies>

    <build>
        <testResources>
            <testResource>
                <directory>src/test/resources</directory>
            </testResource>
        </testResources>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-failsafe-plugin</artifactId>
                <version>3.2.5</version>
                <configuration>
                    <includes><include>**/*Runner.java</include></includes>
                    <systemPropertyVariables>
                        <browser>\${browser}</browser>
                        <headless>\${headless}</headless>
                        <base.url>\${base.url}</base.url>
                    </systemPropertyVariables>
                </configuration>
                <executions>
                    <execution>
                        <goals>
                            <goal>integration-test</goal>
                            <goal>verify</goal>
                        </goals>
                    </execution>
                </executions>
            </plugin>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.13.0</version>
            </plugin>
        </plugins>
    </build>

    <profiles>
        <profile>
            <id>default</id>
            <activation><activeByDefault>true</activeByDefault></activation>
            <properties>
                <browser>chrome</browser>
                <headless>false</headless>
                <base.url>https://example.com</base.url>
            </properties>
        </profile>
        <profile>
            <id>ci</id>
            <properties><headless>true</headless></properties>
        </profile>
    </profiles>
</project>
`);
log('Created pom.xml');

// ─── cucumber.properties ──────────────────────────────────────────────────────

write(`${resourceBase}/cucumber.properties`, `cucumber.publish.quiet=true
cucumber.execution.parallel.enabled=${level >= 3 ? 'true' : 'false'}
${level >= 3 ? 'cucumber.execution.parallel.config.strategy=dynamic' : '# cucumber.execution.parallel.config.strategy=dynamic'}
`);
log('Created cucumber.properties');

// ─── config.properties ───────────────────────────────────────────────────────

write(`${resourceBase}/config/config.properties`, `base.url=https://example.com
browser=chrome
headless=false
implicit.wait=0
explicit.wait=10
use.grid=false
grid.url=http://localhost:4444
test.user.email=testuser@example.com
test.user.password=TestPass123!
`);
log('Created config/config.properties');

// ─── Sample feature file ──────────────────────────────────────────────────────

write(`${resourceBase}/features/auth/login.feature`, `@auth
Feature: User Authentication

  Background:
    Given the user is on the login page

  @smoke
  Scenario: Successful login with valid credentials
    When the user enters username "user@example.com" and password "Secret123!"
    And clicks the login button
    Then they should be redirected to the dashboard
`);
log('Created features/auth/login.feature');

// ─── BasePage ─────────────────────────────────────────────────────────────────

write(`${javaBase}/pages/BasePage.java`, `package ${pkg}.pages;

import org.openqa.selenium.*;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;

public abstract class BasePage {

    protected WebDriver driver;
    protected WebDriverWait wait;

    public BasePage(WebDriver driver) {
        this.driver = driver;
        this.wait = new WebDriverWait(driver, Duration.ofSeconds(10));
    }

    protected WebElement waitForVisible(By locator) {
        return wait.until(ExpectedConditions.visibilityOfElementLocated(locator));
    }

    protected WebElement waitForClickable(By locator) {
        return wait.until(ExpectedConditions.elementToBeClickable(locator));
    }

    protected void click(By locator) {
        waitForClickable(locator).click();
    }

    protected void type(By locator, String text) {
        WebElement el = waitForVisible(locator);
        el.clear();
        el.sendKeys(text);
    }

    protected String getText(By locator) {
        return waitForVisible(locator).getText();
    }

    protected boolean isDisplayed(By locator) {
        try {
            return driver.findElement(locator).isDisplayed();
        } catch (NoSuchElementException e) {
            return false;
        }
    }
}
`);
log('Created pages/BasePage.java');

// ─── TestContext ──────────────────────────────────────────────────────────────

write(`${javaBase}/support/TestContext.java`, `package ${pkg}.support;

import org.openqa.selenium.WebDriver;

/**
 * Shared state for a single scenario.
 * PicoContainer creates one instance per scenario and injects it
 * into all step classes and hooks that declare it in their constructor.
 */
public class TestContext {
    private WebDriver driver;

    public WebDriver getDriver() { return driver; }
    public void setDriver(WebDriver driver) { this.driver = driver; }
}
`);
log('Created support/TestContext.java');

// ─── ConfigReader ─────────────────────────────────────────────────────────────

write(`${javaBase}/utils/ConfigReader.java`, `package ${pkg}.utils;

import java.io.InputStream;
import java.util.Properties;

public class ConfigReader {
    private static final Properties props = new Properties();

    static {
        try (InputStream in = ConfigReader.class
                .getClassLoader()
                .getResourceAsStream("config/config.properties")) {
            if (in != null) props.load(in);
        } catch (Exception e) {
            throw new RuntimeException("Failed to load config.properties", e);
        }
    }

    public static String get(String key) {
        return System.getProperty(key, props.getProperty(key));
    }

    public static String get(String key, String defaultValue) {
        String value = get(key);
        return (value != null && !value.isEmpty()) ? value : defaultValue;
    }
}
`);
log('Created utils/ConfigReader.java');

// ─── DriverManager ────────────────────────────────────────────────────────────

write(`${javaBase}/support/DriverManager.java`, `package ${pkg}.support;

import ${pkg}.utils.ConfigReader;
import io.github.bonigarcia.wdm.WebDriverManager;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.firefox.FirefoxOptions;

public class DriverManager {

    private static final ThreadLocal<WebDriver> driverThread = new ThreadLocal<>();

    private DriverManager() {}

    public static WebDriver createDriver() {
        String browser  = ConfigReader.get("browser", "chrome");
        boolean headless = Boolean.parseBoolean(ConfigReader.get("headless", "false"));

        WebDriver driver = switch (browser.toLowerCase()) {
            case "firefox" -> {
                WebDriverManager.firefoxdriver().setup();
                FirefoxOptions opts = new FirefoxOptions();
                if (headless) opts.addArguments("-headless");
                yield new FirefoxDriver(opts);
            }
            default -> {
                WebDriverManager.chromedriver().setup();
                ChromeOptions opts = new ChromeOptions();
                if (headless) { opts.addArguments("--headless=new", "--window-size=1920,1080"); }
                opts.addArguments("--no-sandbox", "--disable-dev-shm-usage");
                yield new ChromeDriver(opts);
            }
        };

        driver.manage().window().maximize();
        driverThread.set(driver);
        return driver;
    }

    public static WebDriver getDriver() { return driverThread.get(); }

    public static void quitDriver() {
        WebDriver driver = driverThread.get();
        if (driver != null) {
            try { driver.quit(); } finally { driverThread.remove(); }
        }
    }
}
`);
log('Created support/DriverManager.java');

// ─── Hooks ────────────────────────────────────────────────────────────────────

write(`${javaBase}/support/Hooks.java`, `package ${pkg}.support;

import io.cucumber.java.After;
import io.cucumber.java.Before;
import io.cucumber.java.Scenario;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;

public class Hooks {

    private final TestContext context;

    public Hooks(TestContext context) {
        this.context = context;
    }

    @Before(order = 1)
    public void setUp(Scenario scenario) {
        context.setDriver(DriverManager.createDriver());
    }

    @After(order = 1)
    public void takeScreenshotOnFailure(Scenario scenario) {
        if (scenario.isFailed() && context.getDriver() != null) {
            try {
                byte[] screenshot = ((TakesScreenshot) context.getDriver())
                    .getScreenshotAs(OutputType.BYTES);
                scenario.attach(screenshot, "image/png", "Screenshot on failure");
            } catch (Exception e) {
                System.err.println("Could not take screenshot: " + e.getMessage());
            }
        }
    }

    @After(order = 0)
    public void tearDown() {
        DriverManager.quitDriver();
    }
}
`);
log('Created support/Hooks.java');

// ─── TestRunner ───────────────────────────────────────────────────────────────

write(`${javaBase}/runners/TestRunner.java`, `package ${pkg}.runners;

import org.junit.platform.suite.api.ConfigurationParameter;
import org.junit.platform.suite.api.IncludeEngines;
import org.junit.platform.suite.api.SelectClasspathResource;
import org.junit.platform.suite.api.Suite;

import static io.cucumber.junit.platform.engine.Constants.*;

@Suite
@IncludeEngines("cucumber")
@SelectClasspathResource("features")
@ConfigurationParameter(key = GLUE_PROPERTY_NAME,   value = "${pkg}")
@ConfigurationParameter(key = PLUGIN_PROPERTY_NAME, value =
    "pretty," +
    "html:target/cucumber-reports/cucumber.html," +
    "json:target/cucumber-reports/cucumber.json," +
    "junit:target/cucumber-reports/cucumber.xml"
)
@ConfigurationParameter(key = FILTER_TAGS_PROPERTY_NAME, value = "not @wip")
@ConfigurationParameter(key = PUBLISH_QUIET_PROPERTY_NAME, value = "true")
public class TestRunner {}
`);
log('Created runners/TestRunner.java');

// ─── logback-test.xml ─────────────────────────────────────────────────────────

write(`${resourceBase}/logback-test.xml`, `<configuration>
    <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>%d{HH:mm:ss} [%-5level] %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>
    <root level="INFO">
        <appender-ref ref="CONSOLE"/>
    </root>
    <logger name="org.openqa.selenium" level="WARN"/>
    <logger name="io.github.bonigarcia" level="WARN"/>
</configuration>
`);
log('Created logback-test.xml');

// ─── .gitignore ───────────────────────────────────────────────────────────────

write('.gitignore', `target/
.idea/
*.iml
.vscode/
*.class
*.jar
!gradle-wrapper.jar
.DS_Store
`);
log('Created .gitignore');

// ─── Level 3: Screenplay layer ────────────────────────────────────────────────

if (level >= 3) {
  mkdir(`${javaBase}/screenplay/abilities`);
  mkdir(`${javaBase}/screenplay/tasks`);
  mkdir(`${javaBase}/screenplay/questions`);
  mkdir(`${javaBase}/screenplay/interactions`);
  mkdir(`${resourceBase}/testdata`);

  write(`${javaBase}/screenplay/Actor.java`, `package ${pkg}.screenplay;

import ${pkg}.screenplay.abilities.BrowseTheWeb;
import org.openqa.selenium.WebDriver;

public class Actor {
    private final String name;
    private BrowseTheWeb browseTheWeb;

    private Actor(String name) { this.name = name; }

    public static Actor named(String name) { return new Actor(name); }

    public Actor whoCan(BrowseTheWeb ability) {
        this.browseTheWeb = ability;
        return this;
    }

    public WebDriver getDriver() { return browseTheWeb.getDriver(); }

    public void attemptsTo(Task... tasks) {
        for (Task task : tasks) task.performAs(this);
    }

    public <T> T asksAbout(Question<T> question) {
        return question.answeredBy(this);
    }

    public String getName() { return name; }
}
`);

  write(`${javaBase}/screenplay/Task.java`, `package ${pkg}.screenplay;

@FunctionalInterface
public interface Task {
    void performAs(Actor actor);
}
`);

  write(`${javaBase}/screenplay/Question.java`, `package ${pkg}.screenplay;

@FunctionalInterface
public interface Question<T> {
    T answeredBy(Actor actor);
}
`);

  write(`${javaBase}/screenplay/abilities/BrowseTheWeb.java`, `package ${pkg}.screenplay.abilities;

import org.openqa.selenium.WebDriver;

public class BrowseTheWeb {
    private final WebDriver driver;

    private BrowseTheWeb(WebDriver driver) { this.driver = driver; }

    public static BrowseTheWeb with(WebDriver driver) { return new BrowseTheWeb(driver); }

    public WebDriver getDriver() { return driver; }
}
`);

  log('Created screenplay layer (Actor, Task, Question, BrowseTheWeb)');
}

// ─── Level 4: Docker + GitHub Actions ────────────────────────────────────────

if (level >= 4) {
  mkdir('docker');
  mkdir('.github/workflows');

  write('docker/docker-compose.yml', `version: '3.8'

services:
  selenium-hub:
    image: selenium/hub:4.20.0
    ports:
      - "4444:4444"
      - "4442:4442"
      - "4443:4443"

  chrome-node:
    image: selenium/node-chrome:4.20.0
    shm_size: 2gb
    depends_on: [selenium-hub]
    environment:
      - SE_EVENT_BUS_HOST=selenium-hub
      - SE_EVENT_BUS_PUBLISH_PORT=4442
      - SE_EVENT_BUS_SUBSCRIBE_PORT=4443
      - SE_NODE_MAX_SESSIONS=4

  firefox-node:
    image: selenium/node-firefox:4.20.0
    shm_size: 2gb
    depends_on: [selenium-hub]
    environment:
      - SE_EVENT_BUS_HOST=selenium-hub
      - SE_EVENT_BUS_PUBLISH_PORT=4442
      - SE_EVENT_BUS_SUBSCRIBE_PORT=4443
`);

  write('.github/workflows/ci.yml', `name: Selenium BDD Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
          cache: maven
      - uses: browser-actions/setup-chrome@v1
      - name: Run tests
        run: mvn clean verify -Dheadless=true -Dbrowser=chrome
        env:
          BASE_URL: \${{ secrets.STAGING_BASE_URL }}
      - name: Upload reports
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-reports
          path: target/cucumber-reports/
`);

  log('Created docker/docker-compose.yml');
  log('Created .github/workflows/ci.yml');
}

// ─── Done ─────────────────────────────────────────────────────────────────────

console.log('');
console.log(`✓ Project scaffolded at: ${root}`);
console.log('');
console.log('Next steps:');
console.log(`  1. cd ${projectName}`);
console.log('  2. Update src/test/resources/config/config.properties with your base URL');
console.log('  3. Add your page objects in src/test/java/' + pkgPath + '/pages/');
console.log('  4. Write your feature files in src/test/resources/features/');
console.log('  5. mvn clean verify');
console.log('');
console.log('Tips:');
console.log('  - Run smoke tests only: mvn verify -Dcucumber.filter.tags="@smoke"');
console.log('  - Run headless: mvn verify -Dheadless=true');
if (level >= 3) {
  console.log('  - Enable parallel: set cucumber.execution.parallel.enabled=true in cucumber.properties');
}
if (level >= 4) {
  console.log('  - Start Selenium Grid: docker compose -f docker/docker-compose.yml up -d');
  console.log('  - Run on Grid: mvn verify -Duse.grid=true -Dgrid.url=http://localhost:4444');
}
