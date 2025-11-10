## 2.0.2 (2025-11-10)


### Bug Fixes

* **types:** update tsconfig to emit declaration files only 4342d57

## 2.0.1 (2025-07-14)


### Bug Fixes

* **load-context:** pass remix request to `getLoadContext` instead of raw request 8eee350

# 2.0.0 (2025-05-26)


### Features

* **node:** drop support for node 18 16b5ff0
* **stream:** add support streaming responses and remix v2 1178286


### BREAKING CHANGES

* **node:** Node 18 is no longer supported

## 1.0.4 (2024-08-30)


### Bug Fixes

* **binary-type:** defaults to empty string 1a0b7d0

## 1.0.3 (2024-05-23)


### Bug Fixes

* **types:** add type decleration to enforce specific typing 28609ef

## 1.0.2 (2024-05-23)


### Bug Fixes

* **post:** update logic to reject bodies for GET/HEAD but not other request types d96cb72
* **request:** set duplex to 'half' when body exists 560a880

## 1.0.1 (2024-01-11)


### Bug Fixes

* **adapter:** add support for async load context 1a923d5

# 1.0.0 (2024-01-11)

### Bug Fixes

- **deps:** upgrade node dependencies 73e74c2
- **remix-adapter:** update jsdocs and types da375a7

### Features

- **adapter:** implement remix.run azure adapter 1cdaa77
