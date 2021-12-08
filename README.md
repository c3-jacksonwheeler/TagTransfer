# TagTransfer


## To setup
1. clone the repo locally
2. npm install
3. npm run start

<img width="988" alt="Screen Shot 2021-12-06 at 2 20 01 PM" src="https://user-images.githubusercontent.com/73851169/144932187-e4dd0384-e0a8-40e3-8871-b6e065bf97d2.png">

## NOTE:
This application should only be used for pulling data to testing environments.

## To debug issues during transfer
Sometimes it may be necessary to cancel the transfer and start again from a particular index if the transfer begins to fail.
This can be accomplished by setting the Start Index field in the Transfer Options.

<img width="1000" alt="Screen Shot 2021-12-06 at 2 12 04 PM" src="https://user-images.githubusercontent.com/73851169/144931195-9d3022ca-27d7-4449-8e07-fc820ed852d4.png">


## Options Behavior

### Start Index
Skip the first (n) Types before beginning a transfer (useful for restarting after a failure partway through)

### Type Blacklist
Provide a custom blacklist (which is appended to the internal blacklist)
The internal blacklist will do its best to filter out unnecessary/unsafe types. (Users, auth tokens, Parametric types, etc.)

### Type Whitelist 
Provide a custom whitelist (which is applied after the internal blacklist and custom blacklist)

### Dry Run
Perform the fetches, but never merge anything

# Contributions
Please feel free to contribute to this project! (PRs to the main branch)

## Project File/Directory guide
```
TagTransfer
  src/              -- NodeJS+Electron backend code
    BlackList.js        -- Provide type blacklist
    index.js            -- main entrypoint
    preload.js          -- not currently used (electron related)
    TagConnection.js    -- Connect to and perform API requests on a C3 Tag
    TagValidator.js     -- Validate connection to a Tag (Used by TagConnection)
    TagTransfer.js      -- Main transfer code exists here, called by TransferState
    TransferState.js    -- Main communications between the frontend code exists here, initiator of TagTransfer
  
  statics/          -- Frontend code
    index.html
    main.css
    main.js             -- frontend code entrypoint
    TagConfigManager.js -- Handle TagConfig frontend<->backend comms
    Transfer.js         -- Handles Transfer settings and transfer progress stats
```
