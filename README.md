# crypto-web

A web application for learning three classic ciphers: **Caesar**, **Playfair** and **DES / Triple DES**.
It runs entirely in the browser, with no installation, server or internet connection needed.

**Live demo:** https://priyoraj.github.io/crypto-web/

| Page | What it does |
|---|---|
| Caesar cipher | Shifts every letter 0 to 25 places along the alphabet; decryption shifts back. |
| Playfair cipher | Builds the 5×5 key square from a key word (I and J share a cell) and shows it. Splits the text into letter pairs with the usual filler rules and encrypts or decrypts them. Decryption also gives a best guess with the filler letters removed. |
| DES / Triple DES | Encrypts or decrypts one 64-bit block (16 hex digits or 8 characters) with DES, or with two-key Triple DES (encrypt with key A, decrypt with key B, encrypt with key A). The Details box lists the 16 subkeys and every round. |

## Run it on your own computer

1. Download the repository (**Code → Download ZIP**) and unzip it, or clone it:
   `git clone https://github.com/Priyoraj/crypto-web.git`
2. Open `index.html` in any web browser (double-click it).

## Tests

The cipher code is checked against published worked examples: Stallings' Playfair examples
(key MONARCHY), the Wikipedia Playfair example, and the DES examples in J. Orlin Grabbe's
*The DES Algorithm Illustrated*. Triple DES is checked against Python's `cryptography` library.
With [Node.js](https://nodejs.org/) 18 or newer, run this in the repository folder:

```
node --test
```

## Files

| Path | Contents |
|---|---|
| `index.html`, `caesar-cipher.html`, `playfair.html`, `DES.html` | the pages |
| `css/style.css` | the look shared by all pages |
| `js/caesar.js`, `js/playfair.js`, `js/des.js` | the cipher code, one file per cipher |
| `tests/ciphers.test.js` | the tests |
