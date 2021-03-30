import { ApiPromise, WsProvider } from "@polkadot/api";
import { Keyring } from "@polkadot/keyring";
import { CodePromise } from "@polkadot/api-contract";
import { readFileSync } from "fs";

import { ContractState } from "./contract_state";

const Multiplier = 1000000;
const gasLimit = 100000 * Multiplier;
const endowment = 2230000000 * Multiplier;

const getAPI = (): Promise<ApiPromise> => {
  const provider = new WsProvider("ws://127.0.0.1:9944");
  return ApiPromise.create({ provider });
};

const getCode = (api: ApiPromise, contract: string): CodePromise => {
  const abi = JSON.parse(
    readFileSync(`../target/ink/${contract}/metadata.json`).toString()
  );
  const wasm = readFileSync(`../target/ink/${contract}/${contract}.wasm`);

  return new CodePromise(api, abi, wasm);
};
const getAccount = (_api: ApiPromise, path: string, name: string): any => {
  const keyring = new Keyring({ type: "sr25519", ss58Format: 42 });
  return keyring.addFromUri("//Alice", { name: "Alice" });
};

const deploySingle = async (
  contract: string,
  constructor: string,
  data: any[],
  opts: any
): Promise<ContractState> => {
  const { api, account, salt } = opts;

  const code = getCode(api, contract);

  return new Promise(async (resolve, reject) => {
    let state = new ContractState(api, contract);

    const tx = code.createContract(
      constructor,
      { gasLimit, salt, value: endowment },
      data
    );

    const unsub = await tx.signAndSend(account, ({ status, events }: any) => {
      if (status.isInBlock || status.isFinalized) {
        for (const { event } of Object.values(events) as any) {
          state.pushEvent(event);
        }

        if (state.isFailure()) {
          unsub();
          reject(state);
        } else if (state.isSuccess()) {
          unsub();
          resolve(state);
        }
      }
    });
  });
};

export { getAPI, getAccount, deploySingle };
