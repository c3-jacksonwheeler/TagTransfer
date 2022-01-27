# TagTransfer

<h2 style="font-size:8em">
☁️</br>
↕️</br>
💻</h2>

The TagTransfer tool is a utility to transfer instances of types between different Tags. It does this by dynamically retreiving a list of fetchable Persistable types from each Tag. It then further refines these types through an internal blacklist, as well as user controlled configurations. The tool fetches these instances in batches, while updating the user on its Transfer status.

### Here is an example use-case/workflow that the TagTransfer program was designed for.
As a DSE/FDE working on customer A, I need to make some changes to the UI. I've stood up a local docker environment, however I don't have any data locally, which makes it impossible to test my changes. Customer A has had several custom configurations to the data model on top of what was in base. My options are to either prov and bundle to a developer environment of Customer A (this sometimes takes upwards of 1/2 hour for each change!), or to go through the laborious process of manually stepping through all the types required to test my changes locally(along with all the necessary type relations up to the org level!). By using the TagTransfer program, I can essentially "copy" all the types in customer A's developer or QA environment to my own environment, allowing me to develop locally and use UI-IDE.

## To setup
1. clone the repo locally
2. npm install
3. npm run start
4. Important! Pause your queues in the destination environment before starting the Transfer!
5. Measurement types are internally blacklisted, if you need measurements you can remove the type from BlackList.js (this may increase transfer times significantly)

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
