# Contributing Guidelines

Thank you for your interest in contributing to AVELIS! As a showcase portfolio application, we maintain high standards of code hygiene, structured architecture, and detailed documentation.

---

## Code of Conduct

* Focus on readability, performance, and clean design patterns.
* Maintain JSDoc declarations on all public methods and modules.
* Preserve separation of concerns: keep controllers thin and service logic transactional.

---

## Development Workflow

### 1. Fork and Clone
Fork the repository on GitHub, then clone your fork locally:

```bash
git clone https://github.com/Aaditgupta1234/AVELIS.git
cd AVELIS
```

### 2. Branching Convention
Create a descriptive feature branch from the `main` branch:

```bash
git checkout -b feature/your-feature-name
```
* **Conventions:**
  * Features: `feature/amazing-feature`
  * Bug fixes: `bugfix/issue-description`
  * Optimizations: `perf/optimization-target`

### 3. Coding Standards
* **JavaScript:** Strict ES Modules (ESM) imports. Use modern syntactic structures.
* **Linting:** Run Oxlint to verify code syntax cleanliness before committing:
  ```bash
  npx oxlint
  ```

### 4. Committing Changes
Write descriptive, semantic commit messages:

```bash
git commit -m "feat: add user notifications on borrow events"
```
* **Prefixes:** `feat:`, `fix:`, `perf:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`

### 5. Pull Request Guidelines
1. Push your branch to your GitHub fork.
2. Submit a Pull Request targeting the `main` branch of the upstream repository.
3. Ensure all tests and phase verification scripts pass without errors.
