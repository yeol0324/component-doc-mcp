# component-doc-mcp

MCP server that analyzes React component files and auto-generates documentation including props, usage examples, and Storybook links.

---

## Tools

### list_components

Scans the project and returns a list of all React component files.

**How it works**

1. Uses `glob` to recursively find all `**/*.{tsx,jsx}` files from the project root, excluding `node_modules` and `dist`.
2. Extracts the file name using `path.basename()`. e.g. `src/components/Button.tsx` → `Button`.
3. If the file name is `index`, uses the parent directory name instead. e.g. `src/components/Modal/index.tsx` → `Modal`.
4. Filters component names based on the `namingConvention` config. Supports `pascal` (e.g. `Button`) and `kebab` (e.g. `user-profile`). If multiple conventions are specified, a name matching any one of them passes the filter.
5. Removes duplicates in case both `Button.tsx` and `Button/index.tsx` exist.
6. Sorts alphabetically and returns the list.

**Output**

```
Components (3):

- Button
- Card
- user-profile
```

---

### analyze_component 🔜

Analyzes a component file and auto-generates documentation including props, usage examples, and description.

---

### search_component 🔜

Searches components by name or keyword and returns matching results.

---

## Configuration

Configuration is resolved in the following priority order: **CLI args > config.json > defaults**.

**Defaults**

| Option             | Default      | Description                                                   |
| ------------------ | ------------ | ------------------------------------------------------------- |
| `namingConvention` | `["pascal"]` | Naming conventions to include. Supports `pascal` and `kebab`. |

**config.json**

Place a `config.json` in your project root:

```json
{
  "namingConvention": ["pascal", "kebab"]
}
```

**CLI override**

```bash
node dist/index.js /path/to/project --naming-convention pascal,kebab
```

---

## Project Structure

```
src/
├── index.ts              # Server setup, handler registration, and startup
├── config.ts             # Configuration loading and merging (CLI, config.json, defaults)
└── tools/
    └── list_components.ts  # list_components logic
```

---

## Installation

```bash
npm install
npm run build
```

## Usage

```bash
# Pass project path as argument
node dist/index.js /path/to/project

# Or use environment variable
PROJECT_ROOT=/path/to/project node dist/index.js
```
