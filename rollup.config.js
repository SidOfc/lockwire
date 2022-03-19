export default {
    input: "src/index.js",
    output: [
        {
            dir: "dist",
            format: "esm",
            entryFileNames: "[name].mjs",
            preserveModules: true,
        },
        {
            dir: "dist",
            format: "cjs",
            entryFileNames: "[name].cjs",
            preserveModules: true,
        },
    ],
};
