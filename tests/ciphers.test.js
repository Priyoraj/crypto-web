// Tests for the cipher code in js/. Run from the repository folder with
// Node.js 18 or newer:   node --test
const test = require("node:test");
const assert = require("node:assert/strict");

const { caesarShift } = require("../js/caesar.js");
const playfair = require("../js/playfair.js");
const des = require("../js/des.js");

// ---------- Caesar ----------

test("Caesar: shift 3, and shift 23 to get back", () => {
	assert.equal(caesarShift("Hello, World!", 3), "Khoor, Zruog!");
	assert.equal(caesarShift("Khoor, Zruog!", 23), "Hello, World!");
});

test("Caesar: wraps from Z to A and leaves other characters alone", () => {
	assert.equal(caesarShift("xyz XYZ 123", 3), "abc ABC 123");
	assert.equal(caesarShift("JACKDAWS LOVE MY BIG SPHINX OF QUARTZ.", 13),
		"WNPXQNJF YBIR ZL OVT FCUVAK BS DHNEGM.");
});

// ---------- Playfair ----------

test("Playfair: key square for MONARCHY", () => {
	const rows = playfair.playfairSquare("monarchy").map((row) => row.join(""));
	assert.deepEqual(rows, ["MONAR", "CHYBD", "EFGIK", "LPQST", "UVWXZ"]);
});

test("Playfair: the worked examples in Stallings, key MONARCHY", () => {
	// Stallings, Cryptography and Network Security: ar -> RM (same row),
	// mu -> CM (same column), hs -> BP and ea -> IM (rectangle)
	const square = playfair.playfairSquare("MONARCHY");
	assert.equal(playfair.playfairPair(square, "AR", 1), "RM");
	assert.equal(playfair.playfairPair(square, "MU", 1), "CM");
	assert.equal(playfair.playfairPair(square, "HS", 1), "BP");
	assert.equal(playfair.playfairPair(square, "EA", 1), "IM");
	// "balloon" is treated as ba lx lo on
	assert.deepEqual(playfair.playfairPairs("balloon"), ["BA", "LX", "LO", "ON"]);
	assert.equal(playfair.playfairEncrypt("balloon", "MONARCHY").result.join(""), "IBSUPMNA");
});

test("Playfair: Wikipedia example, both directions", () => {
	const key = "playfair example";
	const enc = playfair.playfairEncrypt("Hide the gold in the tree stump", key);
	assert.equal(enc.result.join(""), "BMODZBXDNABEKUDMUIXMMOUVIF");
	const dec = playfair.playfairDecrypt("BM OD ZB XD NA BE KU DM UI XM MO UV IF", key);
	assert.equal(dec.result.join(""), "HIDETHEGOLDINTHETREXESTUMP");
	assert.equal(dec.withoutFillers, "HIDETHEGOLDINTHETREESTUMP");
});

test("Playfair: filler letters", () => {
	assert.deepEqual(playfair.playfairPairs("cat"), ["CA", "TX"]);		// odd length
	assert.deepEqual(playfair.playfairPairs("box"), ["BO", "XQ"]);		// ends in X
	assert.deepEqual(playfair.playfairPairs("taxx"), ["TA", "XQ", "XQ"]);	// doubled X
	assert.deepEqual(playfair.playfairPairs("Jam, 2 jars!"), ["IA", "MI", "AR", "SX"]);	// J is I; non-letters dropped
	assert.deepEqual(playfair.playfairPairs("Jim"), ["IX", "IM"]);	// J and I count as the same letter
});

test("Playfair: decrypting undoes encrypting", () => {
	const texts = ["balloon", "cat", "box", "Meet me at the bridge at noon", "XXX", "a"];
	for (const text of texts) {
		const enc = playfair.playfairEncrypt(text, "secret key");
		const dec = playfair.playfairDecrypt(enc.result.join(""), "secret key");
		assert.deepEqual(dec.result, enc.pairs, text);
	}
	assert.equal(playfair.playfairDecrypt(playfair.playfairEncrypt("cat", "k").result.join(""), "k")
		.withoutFillers, "CAT");
});

test("Playfair: each run is independent of the previous one", () => {
	const first = playfair.playfairEncrypt("cat", "key").result.join("");
	playfair.playfairDecrypt("ABCDEF", "other");
	assert.equal(playfair.playfairEncrypt("cat", "key").result.join(""), first);
});

test("Playfair: input that cannot be processed gives a clear error", () => {
	assert.throws(() => playfair.playfairEncrypt("123 !", "key"), /Type some text/);
	assert.throws(() => playfair.playfairDecrypt("", "key"), /Type the ciphertext/);
	assert.throws(() => playfair.playfairDecrypt("ABC", "key"), /even number of letters/);
	assert.throws(() => playfair.playfairDecrypt("ABCCDE", "key"), /CC cannot occur/);
});

// ---------- DES and Triple DES ----------

function bits(text, isASCII) {
	const array = new Array(65);
	des.get_value(array, text, isASCII);
	assert.notEqual(array[0], des.ERROR_VAL, "rejected: " + text);
	return array;
}

function desHex(message, key, encrypt) {
	return des.bits_to_string(des.des_encrypt(bits(message, false), bits(key, false), encrypt), false);
}

test("DES: worked examples from Grabbe, The DES Algorithm Illustrated", () => {
	assert.equal(desHex("0123456789ABCDEF", "133457799BBCDFF1", true), "85e813540f0ab405");
	assert.equal(desHex("8787878787878787", "0E329232EA6D0D73", true), "0000000000000000");
	assert.equal(desHex("85E813540F0AB405", "133457799BBCDFF1", false), "0123456789abcdef");
});

test("DES: hex digits may be separated by spaces", () => {
	assert.equal(desHex("0123 4567 89ab cdef", "1334 5779 9bbc dff1", true), "85e813540f0ab405");
});

test("DES: 8 ASCII characters in, the same 8 characters back", () => {
	const key = bits("3b3898371520f75e", false);
	const enc = des.des_encrypt(bits("Hi there", true), key, true);
	assert.equal(des.bits_to_string(des.des_encrypt(enc, key, false), true), "Hi there");
});

test("Triple DES (two keys): agrees with Python's cryptography library", () => {
	// expected value from cryptography's TripleDES with the 16-byte key A||B
	const keyA = bits("3b3898371520f75e", false);
	const keyB = bits("922fb510c71f436e", false);
	const enc = des.tdes_encrypt(bits("0123456789abcdef", false), keyA, keyB, true);
	assert.equal(des.bits_to_string(enc, false), "5d707c18bb35da6d");
	const dec = des.tdes_encrypt(enc, keyA, keyB, false);
	assert.equal(des.bits_to_string(dec, false), "0123456789abcdef");
	// with key B = key A, Triple DES is the same as single DES
	const same = des.tdes_encrypt(bits("0123456789abcdef", false), keyA, keyA, true);
	assert.equal(des.bits_to_string(same, false), desHex("0123456789abcdef", "3b3898371520f75e", true));
});

test("DES: wrong input is rejected with a message", () => {
	const messages = [];
	global.window = { alert: (text) => messages.push(text) };
	try {
		for (const [text, isASCII] of [["0123", false], ["0123456789abcdeg", false], ["short", true], ["ÄÖÜ€ abc", true]]) {
			const array = new Array(65);
			des.get_value(array, text, isASCII);
			assert.equal(array[0], des.ERROR_VAL, text);
		}
		assert.equal(messages.length, 4);
		assert.match(messages[1], /g is not a valid hex digit/);
		assert.match(messages[3], /€ does not fit in 8 bits/);
	} finally {
		delete global.window;
	}
});
