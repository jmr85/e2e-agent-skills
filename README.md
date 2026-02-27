# E2E Agent Skills

A collection of skills focused on end-to-end automation for AI agents.

Includes best practices, scalable structure, recommended patterns, and scaffolding commands for professional E2E projects.

---

📦 Installation

You can install the skill directly from GitHub using:

```bash
npx skills add jmr85/e2e-agent-skills
```
or

```bash
npx skills add https://github.com/jmr85/e2e-agent-skills --skill playwright-automation-expert
```

---

## 🛠 Requirements

- Node.js 18+
- npm or pnpm
- CLI compatible with `skills` (for example OpenCode, Claude Code, or other compatible agents)

---

## 🚀 Usage

Once installed, the agent will be able to:

- Generate professional Playwright project structures
- Apply the Page Object Model
- Create feature-based organized tests
- Implement anti-flaky best practices
- Apply naming conventions
- Generate scaffolding for new modules
- Suggest debugging strategies

Example usage inside the agent:

```
Create a professional Playwright structure using the playwright-automation-expert skill
```

Or:

```
Generate an E2E test applying the Page Object Model and anti-flaky best practices
```

The skill will automatically load when you mention terms related to:
- Playwright
- E2E test / end-to-end
- Browser testing / automation
- Page Object Model
- API testing / REST API
- Project structure / folder layout
- Visual testing

---

## 📂 Recommended Structure

```
e2e/
 ├── tests/
 │    ├── login/
 │    ├── checkout/
 │    └── profile/
 ├── pages/
 ├── fixtures/
 ├── utils/
 └── playwright.config.ts
```

---

## 🧠 What the Skill Includes

- Guides for debugging flaky tests
- Feature-based organization
- Naming conventions
- Proper use of locators and selectors
- Scalable Page Object Model
- Best practices for API testing with Playwright
- Common anti-patterns and how to avoid them

---

## 🔧 Scaffold Example

The skill can automatically generate:

- Base project structure
- Initial Playwright configuration
- Recommended npm scripts
- Page Object templates
- Test templates

---

## 📈 Promoted Best Practices

✔ Use of stable locators  
✔ Avoid `waitForTimeout`  
✔ Proper fixture usage  
✔ Clear separation between test and page logic  
✔ Strategic retries  
✔ Debugging with tracing and screenshots  

---

## 📝 License

MIT License - See [LICENSE](https://github.com/jmr85/e2e-agent-skills/blob/main/LICENSE) file for details.