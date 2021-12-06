# TagTransfer


## To setup
1. clone the repo locally
2. npm install
3. npm run start


<img width="988" alt="Screen Shot 2021-12-06 at 2 20 01 PM" src="https://user-images.githubusercontent.com/73851169/144932047-6c1e9050-bc13-4d01-a4f4-03bc2ff68305.png">

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

### Type Whitelist 
Provide a custom whitelist (which is applied after the internal blacklist and custom blacklist)

### Dry Run
Perform the fetches, but never merge anything
