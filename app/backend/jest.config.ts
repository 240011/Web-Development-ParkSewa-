import type { Config } from "jest";

const config: Config = {
    preset: "ts-jest",
    testEnvironment: "node",
    rootDir: ".",
    roots: ["<rootDir>/src"],
    testMatch: ["**/*.test.ts"],
    transform: {
        "^.+\\.ts$": ["ts-jest", { tsconfig: "<rootDir>/tsconfig.json" }],
    },
    setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup.ts"],
    maxWorkers: 1,
    moduleNameMapper: {
        "^uuid$": "<rootDir>/src/__tests__/__mocks__/uuid.js",
    },
};

export default config;
