## Local Setup

### Prerequisites

- Node.js: https://nodejs.org/en/
- pnpm: https://pnpm.io/installation

> [!TIP]
> You can [create a shorter](https://pnpm.io/installation#using-a-shorter-alias) alias for `pnpm`, such as `pn`, to make it easier to type.

### Install packages

```sh
pnpm i
```

### Start local dev

```sh
pnpm dev
```

## Contributing

### Installing new dependencies

This repository is a monorepo managed by `pnpm`. Dependencies that are installed in the root `package.json` will be shared among all other packagers.

To install a new package to the workspace root, you have to use the `--workspace-root` or `-w` flag.

```sh
pnpm -w i [dependency-name] --save-dev
```

`pnpm` operations, including installed dependencies, can be scoped to a specific workspace package using the `--filter` flag:

```sh
pnpm --filter [package-name] i [dependency-name]  --save-dev
```

> ![INFO] Read more about `pnpm` workspaces: https://pnpm.io/workspaces
