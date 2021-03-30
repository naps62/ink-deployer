# Ink deploy flow

This is a sub-component of a private project, published here to publish on
Polkadot's Discord server

Since it's just a copy&paste from an existing project, it's not meant to be used
outside of it (at least for now).
So there are a few assumptions it makes. If you want to adapt this to your
project, you'll need to tweak some things:

1. **Assumes a particular directory structure**

I assume a structure where a Cargo workspace exists with several child
contracts, which are compiled to `project/target/ink/<contract-name>`

Check `lib/deploy.ts` to see the lines where contract artifacts are being read
from hardcoded directories

```
project
|- Cargo.toml
|- deployer/
  |- this code
|- target/
  |- ink/
    |- contract1
      |- metadata.json
      |- contract1.json
    |- contract2
      |- metadata.json
      |- contract2.json
```


2. **Assumes canvas node is being used**

It's currently hardcoded to connect to `new WsProvider("ws://127.0.0.1:9944");`

3. **One instance of each contract, same name as contract itself**

I intend to support use cases where many instances of the same contract are
needed (e.g.: one instance of `contract1`, two instances of `contract2`). Right
now, that's not supported, though

4. **Uses a JSON file to keep track of state**

This file has two purposes:
- Serve as output for the rest of the project to read the current address of
    each contract
- Serve as state, so that contracts already deployed are not duplicated

The last point implies that, if you want to re-deploy, you need to manually
delete this file.

Sample output:

```
{
  "code": {
    "contract1": "0x88e19308ad408f4ccadee34323ce15f00480ca412ba5b327310c9c9e306447c7",
    "contract2": "0x4d69808d3f244b8c66839821d5de40ca5ffc1cce38762d2dbb53f82304e3ee7e"
  },
  "contracts": {
    "contract1": "5CvPjdprPZNmPAooYNCzWib9W5hkEE43zsLCrU83PxXrg7mL",
    "contract2": "5DGYm5ReQF6j1kkAGZKzRZFCo1HjxX9qJH27U3Zekbvqhq7h"
  }
}
```
