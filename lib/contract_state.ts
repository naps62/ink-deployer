import type { ApiPromise } from "@polkadot/api";

class ContractState {
  public name: string;
  public success: boolean;
  public errorMessage: string | null;
  public codeHash: string;
  public address: string;
  public events: any[];
  api: ApiPromise;

  constructor(api: ApiPromise, name: string) {
    this.api = api;
    this.name = name;
    this.events = [];
    this.success = true;
    this.errorMessage = null;
  }

  public toJSON(): Object {
    return {
      name: this.name,
      success: this.success,
      codeHash: this.codeHash && this.codeHash.toString(),
      address: this.address && this.address.toString(),
    };
  }

  public pushEvent(event: any) {
    const { ExtrinsicFailed } = this.api.events.system;
    const { CodeStored, Instantiated } = this.api.events.contracts;

    this.events.push(event);

    if (ExtrinsicFailed.is(event)) {
      this.onExtrinsicFailed(event);
    }

    if (CodeStored.is(event)) {
      this.onCodeStored(event);
    }

    if (Instantiated.is(event)) {
      this.onInstantiated(event);
    }

    // else {
    //   this.onUnknown(event);
    // }
  }

  public isFailure(): boolean {
    return !this.success;
  }

  public isSuccess(): boolean {
    return !!this.address;
  }

  onExtrinsicFailed({ data: [error, info] }: any) {
    this.success = false;

    if (error.isModule) {
      // for module errors, we have the section indexed, lookup
      const decoded = this.api.registry.findMetaError(error.asModule);
      const { documentation, method, section } = decoded;

      this.errorMessage = `${section}.${method}: ${documentation.join(" ")}`;
    } else {
      // Other, CannotLookup, BadOrigin, no extra info
      this.errorMessage = error.toString();
    }
  }

  onCodeStored({ data: [codeHash] }: any) {
    this.codeHash = codeHash;
  }

  onInstantiated({ data: [deployer, address] }: any) {
    this.address = address;
  }

  onUnknown(event: any) {
    // console.log(`unknown event type: ${event}`);
  }
}

export { ContractState };
