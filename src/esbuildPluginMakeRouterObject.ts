import { Plugin } from "esbuild";
import { readdir, writeFile, mkdir } from "fs/promises";
import { dirname, extname, isAbsolute, join, relative, resolve } from "path";
import { fileURLToPath } from "url";

interface Config {
  outfile: string;
  routesDirectory: string;
}

export const esbuildPluginMakeRouterObject = ({
  outfile,
  routesDirectory,
}: Config): Plugin => ({
  name: "make-router-object",
  setup(build) {
    const useTypescript = outfile.toLowerCase().endsWith(".ts");
    build.onStart(async () => {
      if (!isAbsolute(routesDirectory)) {
        routesDirectory = resolve(
          dirname(fileURLToPath(import.meta.url)),
          routesDirectory
        );
      }
      let routerPaths: string[] = [];
      try {
        routerPaths = await readdir(routesDirectory);
      } catch (error) {
        if ((error as Record<string, unknown>).code === "ENOENT") {
          throw new Error(
            `The routes directory does not exist: "${routesDirectory}"`
          );
        }
        throw error;
      }
      routerPaths = routerPaths.filter((path) => path.match("^.+.m?[jt]s"));
      const imports = [];
      for (const routePath of routerPaths) {
        const name = routePath.substring(
          0,
          routePath.length - extname(routePath).length
        );
        let relativePath = join(
          relative(dirname(outfile), routesDirectory),
          routePath
        );
        if (relativePath.endsWith(".ts")) {
          relativePath = relativePath.substring(0, relativePath.length - 3);
        }
        imports.push({
          name,
          relativePath,
        });
      }
      const importLines = [];
      const objectLines = [];
      for (const [index, im] of imports.entries()) {
        const importName = `i${index + 1}`;
        importLines.push(
          `import * as ${importName} from "${im.relativePath}";`
        );
        objectLines.push(
          `"${im.name}": ${importName}${useTypescript ? " as Router" : ""}`
        );
      }

      let out = "";

      if (useTypescript) {
        out += 'import { Router } from "koa-object-router";\n';
      }

      out +=
        importLines.join("\n") +
        "\n\nexport default {\n  " +
        objectLines.join(",\n  ") +
        "\n};\n";

      await mkdir(dirname(outfile), { recursive: true });

      await writeFile(outfile, out);
    });
  },
});
