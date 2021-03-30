import { readFileSync } from "fs";
import { writeFile } from "fs/promises";
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";

import { deploySingle, getAPI, getAccount } from "./lib/deploy";
import { ContractState } from "./lib/contract_state";
import { Manifest } from "manifest-js";

const deployCommand = async (argv: any) => {
  let stateContent;
  try {
    stateContent = JSON.parse(readFileSync(argv.manifest).toString());
  } catch (err) {
    stateContent = { code: {}, contracts: {} };
  }

  const state = new Manifest(stateContent);

  const api = await getAPI();
  const alice = getAccount(api, "//Alice", "Alice");

  const opts = { api, account: alice, salt: argv.salt };

  try {
    await deploy(state, "parent", "new", [alice.address], opts);
    await deploy(state, "child", "new", [state.data.code.parent], opts);

    const blob = new Uint8Array(
      Buffer.from(JSON.stringify(state.data, null, 2))
    );

    await writeFile(argv.manifest, blob);
    process.exit(0);
  } catch (err) {
    if (err instanceof ContractState) {
      console.log(`Error deploying \`${err.name}\`:\n${err.errorMessage}`);
    } else {
      console.log(err);
    }
    process.exit(1);
  }
};

const deploy = async (
  state: Manifest,
  name: string,
  constructor: string,
  args: any[],
  opts: object
): Promise<void> => {
  if (state.needsDeploy(name)) {
    const result = await deploySingle(name, constructor, args, opts);
    state.setCodeHash(name, result.codeHash);
    state.setContractAddress(name, result.address);
  }
};

(async () => {
  const args = hideBin(process.argv).filter((arg: string) => arg !== "--");

  yargs(args).command(
    "deploy",
    "deploy a given contract",
    (yargs) => {
      return yargs
        .positional("salt", {
          describe: "salt used for deploy",
        })
        .positional("manifest", { description: "manifest file" });
    },
    (argv) => {
      deployCommand(argv);
    }
  ).argv;
})();
