# Drawing App

![Screenshot](https://github.com/hiddenist/drawing-app/assets/563879/2bd5299e-c7db-4a15-b5b4-86e613782f79)

This is a 2d web-based drawing application. I started this as a hobby project, because I have no idea what a shader is and thought learning WebGL could be fun!

Check out the app here: [hiddenist.github.io/drawing-app](https://hiddenist.github.io/drawing-app/)

The app is missing a number of features, most notably there are only a few history states and no soft brushes. If you have an idea you want to see added, feel free to [create and issue](https://github.com/hiddenist/drawing-app/issues/new) to request it. Thanks for checking this out!

## Local Setup

### Prerequisites

- Node.js: https://nodejs.org/en/
- pnpm: https://pnpm.io/installation

> [!TIP]
> You can [create a shorter alias](https://pnpm.io/installation#using-a-shorter-alias) for `pnpm`, such as `pn`, to make it easier to type.

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
